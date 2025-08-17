const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Admin authentication middleware
const isAdmin = (req, res, next) => {
  const isAdminUser = req.query.isAdmin === 'true' || (req.body && req.body.isAdmin === true);
  if (!isAdminUser) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Helper function to delete a file if it exists
const deleteFileIfExists = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};
// Note: persistence is moved to MongoDB via ./db.js

// Multer setup for photo uploads with file naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG and PNG files are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle poster submissions
app.post('/api/send-posters', upload.array('posters'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No posters uploaded' });
    }

    const posterUrls = req.files.map(file => `/uploads/${file.filename}`);

    res.json({
      success: true,
      posters: posterUrls,
      message: 'Posters uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading posters:', error);
    res.status(500).json({ error: 'Failed to upload posters' });
  }
});

// Admin login with env variables
app.post('/api/admin-login', (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  
  if (username === adminUsername && password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.allUsers();
    res.json(Array.isArray(users) ? users : []);
  } catch (err) {
    console.error('Error fetching users from DB:', err);
    res.status(500).json([]);
  }
});

// Create user
app.post('/api/users', upload.single('photo'), async (req, res) => {
  try {
    const { name, email, phone, designation } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const id = Date.now().toString();
    const user = { id, name, email, phone: phone || '', designation: designation || '', photoUrl };
    const created = await db.createUser(user);
    res.json(created);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Edit user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const changes = req.body;
    const updated = await db.updateUser(id, changes);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.getUser(id);
    if (user && user.photoUrl) {
      const photoPath = path.join(__dirname, user.photoUrl);
      try { fs.unlinkSync(photoPath); } catch (e) { /* ignore */ }
    }
    await db.deleteUser(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin - Update user's photo
app.put('/api/users/:id/photo', upload.single('photo'), isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.getUser(id);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    // Delete old photo if it exists
    if (user.photoUrl) {
      const oldPhotoPath = path.join(__dirname, user.photoUrl);
      await deleteFileIfExists(oldPhotoPath);
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const updated = await db.updateUser(id, { ...user, photoUrl });
    res.json({ success: true, photoUrl: updated.photoUrl, message: 'Photo updated successfully by admin' });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Delete user's photo
app.delete('/api/users/:id/photo', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.getUser(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.photoUrl) return res.status(404).json({ error: 'User has no photo' });

    const photoPath = path.join(__dirname, user.photoUrl);
    await deleteFileIfExists(photoPath);
    await db.updateUser(id, { ...user, photoUrl: '' });
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Export users to Excel (Admin only)
app.get('/api/export-users', isAdmin, async (req, res) => {
  try {
    const users = await db.allUsers();

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Format data for Excel
    const excelData = users.map(user => ({
      ID: user.id,
      Name: user.name,
      Email: user.email,
      Photo: user.photoUrl ? 'Yes' : 'No'
    }));

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // ID
      { wch: 30 }, // Name
      { wch: 35 }, // Email
      { wch: 10 }  // Photo
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

    // Send file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});
    
// Export member sheet to Excel (Admin only)
app.get('/api/export-members', isAdmin, async (req, res) => {
  try {
    const users = await db.allUsers();

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Format data for Excel
    const excelData = users.map(user => ({
      'Member ID': user.id,
      'Full Name': user.name,
      'Email': user.email,
      'Phone': user.phone || 'N/A',
      'Designation': user.designation || 'N/A',
      'Photo Status': user.photoUrl ? 'Available' : 'Not Available'
    }));

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Member ID
      { wch: 30 }, // Full Name
      { wch: 35 }, // Email
      { wch: 15 }, // Phone
      { wch: 25 }, // Designation
      { wch: 15 }  // Photo Status
    ];
    worksheet['!cols'] = colWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User List');

    // Create buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=user_list.xlsx');

    // Send the file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ error: 'Failed to export Excel file' });
  }
});

const startServer = async () => {
  await db.connect();
  app.listen(PORT, () => {
    const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    console.log(`Server running on ${BACKEND_URL}`);
  });
};

startServer();