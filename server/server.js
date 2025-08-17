// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const allowedOrigins = [
  'https://abuinshah.netlify.app',
  'http://localhost:5173'  // Remove trailing slash
];

const path = require('path');

const { saveToExcel, getMembersByDesignation, getAllUsers, deleteUser, updateUser } = require('./utils/excel');
const { processCircularImage, generateFooterSVG, createFinalPoster } = require('./utils/image');
const { sendEmail, testEmailConfiguration } = require('./utils/emailSender');

const app = express();
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'members.xlsx');
const LOGO_PATH = path.join(__dirname, 'assets/logo.png');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({ 
  dest: UPLOADS_DIR,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Move CORS configuration before routes
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(cookieParser(process.env.ADMIN_TOKEN_SECRET || 'supersecret'));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.get('/api/users', (req, res) => {
  try {
    const users = getAllUsers(EXCEL_PATH);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    deleteUser(EXCEL_PATH, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/register', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, email, designation } = req.body;
    if (!name || !phone || !email || !designation) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    const filenameSafe = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const finalPhotoPath = `uploads/${filenameSafe}_${Date.now()}.jpeg`;
    try {
      if (!fs.existsSync(req.file.path)) throw new Error('Uploaded file not found');
      await processCircularImage(req.file.path, finalPhotoPath, 200);
      if (!fs.existsSync(finalPhotoPath)) throw new Error('Failed to save processed image');
      try { fs.unlinkSync(req.file.path); } catch (e) { console.warn('Cleanup error:', e); }
    } catch (err) {
      console.error('Image processing failed:', err);
      try {
        if (fs.existsSync(req.file.path)) fs.renameSync(req.file.path, finalPhotoPath);
        else throw new Error('No valid image file available');
      } catch (e) {
        throw new Error(`Failed to save image: ${e.message}`);
      }
    }

    try {
      // If designation is 'both', create two profiles
      if (designation && designation.toLowerCase() === 'both') {
        const id1 = Date.now().toString();
        const userData1 = { id: id1, name, phone, email, designation: 'Health Insurance Advisor', photo: finalPhotoPath, createdAt: new Date().toISOString() };
        saveToExcel(userData1, EXCEL_PATH);
        const id2 = (Date.now() + 1).toString();
        const userData2 = { id: id2, name, phone, email, designation: 'Wealth Manager', photo: finalPhotoPath, createdAt: new Date().toISOString() };
        saveToExcel(userData2, EXCEL_PATH);
        res.json({ success: true, message: '✅ Two profiles registered successfully', users: [userData1, userData2] });
      } else {
        const id = Date.now().toString();
        const userData = { id, name, phone, email, designation, photo: finalPhotoPath, createdAt: new Date().toISOString() };
        saveToExcel(userData, EXCEL_PATH);
        res.json({ success: true, message: '✅ Member registered successfully', user: userData });
      }
    } catch (err) {
      if (err.message && err.message.includes('email is already registered')) {
        res.status(400).json({ error: err.message, details: 'Duplicate email registration' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register member', details: error.message });
  }
});

app.post('/api/send-posters', upload.single('template'), async (req, res) => {
  try {
    const { designation } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Template image is required' });
    const templatePath = req.file.path;

    // Standardize designations and ensure correct format
    let designationsToSend = [];
    if (designation.toLowerCase() === 'both') {
      designationsToSend = ['Health Insurance Advisor', 'Wealth Manager'];
    } else if (designation.toLowerCase().includes('health')) {
      designationsToSend = ['Health Insurance Advisor'];
    } else if (designation.toLowerCase().includes('wealth')) {
      designationsToSend = ['Wealth Manager'];
    } else if (designation.toLowerCase().includes('partner')) {
      designationsToSend = ['Partner'];
    } else {
      designationsToSend = [designation];
    }

    let totalRecipients = 0;
    for (const desig of designationsToSend) {
      // Use case-insensitive search but maintain correct designation format in output
      const recipients = getMembersByDesignation(desig.toLowerCase(), EXCEL_PATH)
        .map(recipient => ({
          ...recipient,
          designation: desig // Use the standardized designation format
        }));

      if (!recipients.length) continue;
      totalRecipients += recipients.length;
      
      for (const person of recipients) {
        const finalImagePath = `uploads/final_${Date.now()}_${person.name.replace(/\s+/g, '_')}.jpeg`;
        try {
          await createFinalPoster({ templatePath, person, logoPath: LOGO_PATH, outputPath: finalImagePath });
          await sendEmail({ Name: person.name, Email: person.email, Phone: person.phone, Designation: person.designation }, finalImagePath);
          try { fs.unlinkSync(finalImagePath); } catch (e) { console.warn(`Cleanup failed for ${person.name}:`, e); }
        } catch (err) {
          console.error(`Failed for ${person.name}:`, err);
        }
      }
    }

    try { fs.unlinkSync(templatePath); } catch (e) { console.warn('Template cleanup failed:', e); }

    if (totalRecipients === 0) {
      return res.status(404).json({ error: `No recipients found for designation: ${designation}` });
    }

    res.json({ success: true, message: '✅ Posters sent successfully', recipientCount: totalRecipients });
  } catch (error) {
    console.error('Send posters error:', error);
    res.status(500).json({ error: 'Failed to send posters', details: error.message });
  }
});


const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'supersecret';
const ADMIN_COOKIE_NAME = 'admin_token';
const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // must be true for cross-site cookies
  sameSite: 'none', // must be 'none' for cross-site cookies
  maxAge: 24 * 60 * 60 * 1000,
  signed: true,
};

const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Admin login: set secure cookie
app.post('/api/admin-login', (req, res) => {
  const { username, password } = req.body;
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) return res.status(500).json({ error: 'Admin credentials not configured' });
  if (username === validUsername && password === validPassword) {
    const token = generateToken();
    res.cookie(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin auth check: verify cookie
app.get('/api/admin-auth', (req, res) => {
  const token = req.signedCookies[ADMIN_COOKIE_NAME];
  if (token) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Admin logout: clear cookie
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 });
  res.json({ success: true });
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, designation } = req.body;
    if (!id || !name || !email || !phone || !designation) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const updatedUser = updateUser(EXCEL_PATH, id, { name, email, phone, designation });
    res.json({ success: true, message: '✅ User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update error:', error);
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message || 'Failed to update user' });
  }
});

// Health check endpoint to test if backend is live
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is live!' });
});

// Export members Excel (admin only). Supports either signed admin cookie or ?isAdmin=true for quick testing.
app.get('/api/export-members', (req, res) => {
  try {
    const isAdminQuery = req.query.isAdmin === 'true';
    const token = req.signedCookies && req.signedCookies[ADMIN_COOKIE_NAME];
    if (!isAdminQuery && !token) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!fs.existsSync(EXCEL_PATH)) {
      return res.status(404).json({ error: 'Members file not found' });
    }

    // Use res.download so browser prompts a save dialog
    return res.download(EXCEL_PATH, 'members.xlsx', err => {
      if (err) {
        console.error('Error sending members.xlsx:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Export members error:', error);
    res.status(500).json({ error: 'Failed to export members' });
  }
});

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
app.listen(PORT, () => {
  console.log(`✅ Server running on ${BACKEND_URL}`);
});
