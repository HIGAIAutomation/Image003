const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
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
  users = users.filter(u => u.id !== id);
  writeUsers(users);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});