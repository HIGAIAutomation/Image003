const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

// Use JSON file for simple persistence
const USERS_FILE = path.join(__dirname, 'users.json');
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

// Admin login (dummy)
app.post('/api/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get all users
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
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  let users = readUsers();
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (user && user.photoUrl) {
    const photoPath = path.join(__dirname, user.photoUrl);
    try {
      fs.unlinkSync(photoPath);
    } catch (err) {
      console.error('Error deleting photo file:', err);
    }
  }
  users = users.filter(u => u.id !== id);
  writeUsers(users);
  res.json({ success: true });
});

// Admin - Update user's photo
app.put('/api/users/:id/photo', upload.single('photo'), isAdmin, async (req, res) => {
  try {
    const users = readUsers();
    const { id } = req.params;
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    // Delete old photo if it exists
    if (user.photoUrl) {
      const oldPhotoPath = path.join(__dirname, user.photoUrl);
      await deleteFileIfExists(oldPhotoPath);
    }

    // Update user's photo URL
    user.photoUrl = `/uploads/${req.file.filename}`;
    writeUsers(users);

    res.json({ 
      success: true,
      photoUrl: user.photoUrl,
      message: 'Photo updated successfully by admin'
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Delete user's photo
app.delete('/api/users/:id/photo', async (req, res) => {
  try {
    const users = readUsers();
    const { id } = req.params;
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.photoUrl) {
      return res.status(404).json({ error: 'User has no photo' });
    }

    // Delete photo file
    const photoPath = path.join(__dirname, user.photoUrl);
    await deleteFileIfExists(photoPath);
    
    // Update user record
    user.photoUrl = '';
    writeUsers(users);
    
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});
    
app.listen(PORT, () => {
  const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  console.log(`Server running on ${BACKEND_URL}`);
});

// In AdminPanel.tsx
const handleImageSave = async (userId, photoFile) => {
  const formData = new FormData();
  formData.append('photo', photoFile);

  try {
    const response = await fetch(`/api/users/${userId}/photo?isAdmin=true`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to update photo');
    }

    const data = await response.json();
    // Handle success
    return data.photoUrl;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

const handlePosterSubmit = async (posterFiles) => {
  const formData = new FormData();
  posterFiles.forEach(file => {
    formData.append('posters', file);
  });

  try {
    const response = await fetch('/api/send-posters', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload posters');
    }

    const data = await response.json();
    // data.posters will contain an array of poster URLs
    return data.posters;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};