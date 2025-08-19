const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
<<<<<<< HEAD
// Excel export removed; XLSX not required
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
=======
const app = express();
const PORT = 3001;

// Use JSON file for simple persistence
const USERS_FILE = path.join(__dirname, 'users.json');
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]');
      return [];
    }
    const data = fs.readFileSync(USERS_FILE);
    if (!data.length) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users.json:', err);
    return [];
  }
}
function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing users.json:', err);
  }
}

// Multer setup for photo uploads
const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Admin login (dummy)
app.post('/api/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get all users
<<<<<<< HEAD
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
=======
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(Array.isArray(users) ? users : []);
});

// Create user
app.post('/api/users', upload.single('photo'), (req, res) => {
  const users = readUsers();
  const { name, email } = req.body;
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';
  const id = Date.now().toString();
  const user = { id, name, email, photoUrl };
  users.push(user);
  writeUsers(users);
  res.json(user);
});

// Edit user
app.put('/api/users/:id', (req, res) => {
  const users = readUsers();
  const { id } = req.params;
  const { name, email } = req.body;
  const user = users.find(u => u.id === id);
  if (user) {
    user.name = name;
    user.email = email;
    writeUsers(users);
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
  }
});

// Delete user
<<<<<<< HEAD
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
// Excel export endpoints removed

const startServer = async () => {
  await db.connect();
  app.listen(PORT, () => {
    const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    console.log(`Server running on ${BACKEND_URL}`);
  });
};

startServer();
=======
app.delete('/api/users/:id', (req, res) => {
  let users = readUsers();
  const { id } = req.params;
  users = users.filter(u => u.id !== id);
  writeUsers(users);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
