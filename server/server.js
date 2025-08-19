require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const nodemailer = require('nodemailer');

// Import required modules
const { processCircularImage, generateFooterSVG, createFinalPoster } = require('./utils/image');
const { sendEmail, testEmailConfiguration } = require('./utils/emailSender');
const db = require('./db');

const app = express();

// Configure paths
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');
const LOGO_PATH = path.join(__dirname, 'assets/logo.png');

// Create necessary directories if they don't exist
[UPLOADS_DIR, OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configure multer for file uploads
const upload = multer({ 
    dest: UPLOADS_DIR,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure CORS
const allowedOrigins = [
    'https://abuinshah.netlify.app',
    'http://localhost:5173'
];

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

// Configure middleware
app.use(express.json());
app.use(cookieParser(process.env.ADMIN_TOKEN_SECRET || 'supersecret'));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.allUsers();
    // normalize: older records may have `photo` while client expects `photoUrl`
    const normalized = users.map(u => ({
      ...u,
      photoUrl: u.photoUrl || u.photo || ''
    }));
    res.json(normalized);
  } catch (error) {
    console.error('Fetch users error:', error);
  try {
    const users = getAllUsers(EXCEL_PATH);
    res.json(users);
  } catch (error) {
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

<<<<<<< HEAD
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await db.getUser(req.params.id);
    if (user && user.photo) {
      try { fs.unlinkSync(user.photo); } catch (e) { /* ignore */ }
    }
    await db.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
app.post('/api/register', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, email, designation } = req.body;
    if (!name || !phone || !email || !designation) {
      return res.status(400).json({ error: 'All fields are required' });
    }
// Register new member
app.post('/api/register', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, email, designation } = req.body;
    
    // Validate inputs
    if (!name || !phone || !email || !designation) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    // Process photo
    const filenameSafe = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const finalPhotoPath = path.join('uploads', `${filenameSafe}_${Date.now()}.jpeg`);
    try {
      if (!fs.existsSync(req.file.path)) throw new Error('Uploaded file not found');
      await processCircularImage(req.file.path, finalPhotoPath, 200);
      if (!fs.existsSync(finalPhotoPath)) throw new Error('Failed to save processed image');
      try { 
        await fs.promises.unlink(req.file.path); 
      } catch (e) { 
        console.warn('Cleanup error (ignored):', e.message || e); 
      }
    } catch (err) {
      console.error('Image processing failed:', err);
      try {
        if (fs.existsSync(req.file.path)) {
          await fs.promises.rename(req.file.path, finalPhotoPath);
        } else {
          throw new Error('No valid image file available');
        }
    const filenameSafe = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const finalPhotoPath = `uploads/${filenameSafe}_${Date.now()}.jpeg`;

    try {
      if (!fs.existsSync(req.file.path)) {
        throw new Error('Uploaded file not found');
      }

      await processCircularImage(req.file.path, finalPhotoPath, 200);
      
      // Verify the processed image exists
      if (!fs.existsSync(finalPhotoPath)) {
        throw new Error('Failed to save processed image');
      }
      
      // Clean up original upload
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('Could not delete original file:', e);
      }
    } catch (err) {
      console.error('🛑 Image processing failed:', err);
      // If image processing fails, try to use original file
      try {
        if (fs.existsSync(req.file.path)) {
          fs.renameSync(req.file.path, finalPhotoPath);
        } else {
          throw new Error('No valid image file available');
        }
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
      } catch (e) {
        throw new Error(`Failed to save image: ${e.message}`);
      }
    }

    try {
<<<<<<< HEAD
      if (designation && designation.toLowerCase() === 'both') {
          const id1 = Date.now().toString();
          const userData1 = { id: id1, name, phone, email, designation: 'Health Insurance Advisor', photoUrl: `/${finalPhotoPath}` };
          const id2 = (Date.now() + 1).toString();
          const userData2 = { id: id2, name, phone, email, designation: 'Wealth Manager', photoUrl: `/${finalPhotoPath}` };
          await db.createUser(userData1);
          await db.createUser(userData2);
          res.json({ success: true, message: '✅ Two profiles registered successfully', users: [userData1, userData2] });
        } else {
          const id = Date.now().toString();
          const userData = { id, name, phone, email, designation, photoUrl: `/${finalPhotoPath}` };
          await db.createUser(userData);
          res.json({ success: true, message: '✅ Member registered successfully', user: userData });
        }
    } catch (err) {
      if (err.message && err.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'Duplicate entry' });
      }
      throw err;
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
  const recipients = (await db.findMembersByDesignation(desig)).map(recipient => ({ ...recipient, designation: desig }));

      if (!recipients.length) continue;
      totalRecipients += recipients.length;
      
      for (const person of recipients) {
        const finalImagePath = path.join(OUTPUT_DIR, `final_${Date.now()}_${person.name.replace(/\s+/g, '_')}.jpeg`);
        try {
          // Get the correct photo path
          let photoPath = person.photo;
          
          // If it's a relative path, make it absolute
          if (photoPath && !path.isAbsolute(photoPath)) {
            // If it starts with uploads/, it's relative to server root
            if (photoPath.startsWith('uploads/')) {
              photoPath = path.join(__dirname, photoPath);
            } else {
              photoPath = path.join(UPLOADS_DIR, photoPath);
            }
          }

          // Try photoUrl if photo path is not valid
          if (!photoPath && person.photoUrl) {
            photoPath = path.join(UPLOADS_DIR, path.basename(person.photoUrl));
          }

          if (!photoPath || !fs.existsSync(photoPath)) {
            throw new Error(`Invalid or missing photo for ${person.name}. Checked paths: ${person.photo}, ${photoPath}`);
          }

          await createFinalPoster({
            templatePath,
            person: {
              ...person,
              photo: photoPath
            },
            logoPath: LOGO_PATH,
            outputPath: finalImagePath
          });

          await sendEmail({
            Name: person.name,
            Email: person.email,
            Phone: person.phone,
            Designation: person.designation
          }, finalImagePath);

          // Clean up the generated image
          try {
            await fs.promises.unlink(finalImagePath);
          } catch (e) {
            console.warn(`Cleanup failed for ${person.name}'s image (ignored):`, e.message);
          }
        } catch (err) {
          console.error(`Failed for ${person.name}:`, err);
          continue; // Continue with next person even if one fails
        }
      }
    }

  try { fs.unlinkSync(templatePath); } catch (e) { console.warn('Template cleanup failed (ignored):', e.message || e); }

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

// Admin authorization middleware used by endpoints that require admin access
function isAdmin(req, res, next) {
  const isAdminQuery = req.query.isAdmin === 'true';
  const token = req.signedCookies && req.signedCookies[ADMIN_COOKIE_NAME];
  if (isAdminQuery || token) return next();
  return res.status(403).json({ error: 'Admin access required' });
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

=======
      // Save to Excel
      const id = Date.now().toString();
      const userData = { 
        id, 
        name, 
        phone, 
        email, 
        designation, 
        photo: finalPhotoPath,
        createdAt: new Date().toISOString()
      };
      
      saveToExcel(userData);

      // Set up email transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      // Get members to notify based on designation
      let membersToNotify = [];
      if (designation === 'both') {
        const healthMembers = getMembersByDesignation('Health insurance advisor', EXCEL_PATH);
        const wealthMembers = getMembersByDesignation('Wealth Manager', EXCEL_PATH);
        membersToNotify = [...healthMembers, ...wealthMembers];
      } else {
        membersToNotify = getMembersByDesignation(designation, EXCEL_PATH);
      }

      // Send welcome emails to existing members
      for (const member of membersToNotify) {
        try {
          await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: member.email,
            subject: 'New Member Registration',
            html: `
              <h2>Welcome Our New Member!</h2>
              <p>A new member has joined as a ${designation}:</p>
              <p><strong>Name:</strong> ${name}</p>
              <p>Welcome them to our community!</p>
            `
          });
        } catch (emailErr) {
          console.error(`Failed to send email to ${member.email}:`, emailErr);
        }
      }
      
      res.json({ 
        success: true, 
        message: '✅ Member registered successfully',
        user: userData
      });
    } catch (err) {
      if (err.message.includes('email is already registered')) {
        res.status(400).json({ 
          error: err.message,
          details: 'Each email address can only be registered once, regardless of designation.'
        });
      } else {
        throw err; // Let the main error handler catch other errors
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to register member',
      details: error.message 
    });
  }
});

// Send posters
app.post('/api/send-posters', upload.single('template'), async (req, res) => {
  try {
    const { designation } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'Template image is required' });
    }

    const templatePath = req.file.path;
    let recipients = [];
    
    if (designation === 'both') {
      // Get users from both designations
      const healthUsers = getMembersByDesignation('Health insurance advisor', EXCEL_PATH);
      const wealthUsers = getMembersByDesignation('Wealth Manager', EXCEL_PATH);
      recipients = [...healthUsers, ...wealthUsers];
    } else {
      recipients = getMembersByDesignation(designation, EXCEL_PATH);
    }

    if (!recipients.length) {
      return res.status(404).json({ 
        error: `No recipients found for designation: ${designation}` 
      });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      return res.status(500).json({ 
        error: 'Email configuration missing' 
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    for (const person of recipients) {
      const finalImagePath = `uploads/final_${Date.now()}.jpeg`;

      try {
        await createFinalPoster({
          templatePath,
          person,
          logoPath: LOGO_PATH,
          outputPath: finalImagePath,
        });

        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: person.email,
          subject: 'Your Personalized Poster',
          html: `<p>Dear ${person.name},<br/>Here is your customized poster.</p>`,
          attachments: [{ filename: 'poster.jpeg', path: finalImagePath }],
        });

        // Clean up the final image after sending
        try {
          fs.unlinkSync(finalImagePath);
        } catch (e) {
          console.warn(`Could not delete final image for ${person.name}:`, e);
        }
      } catch (err) {
        console.error(`Failed to process/send poster for ${person.name}:`, err);
        // Continue with next recipient
      }
    }

    // Clean up the template after processing all recipients
    try {
      fs.unlinkSync(templatePath);
    } catch (e) {
      console.warn('Could not delete template:', e);
    }

    res.json({
      success: true,
      message: '✅ Posters sent successfully',
      recipientCount: recipients.length
    });

  } catch (error) {
    console.error('Send posters error:', error);
    res.status(500).json({ 
      error: 'Failed to send posters',
      details: error.message 
    });
  }
});

// Admin login endpoint
app.post('/api/admin-login', (req, res) => {
  const { username, password } = req.body;
  
  // Check against environment variables
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    return res.status(500).json({ 
      error: 'Admin credentials not configured' 
    });
  }

  if (username === validUsername && password === validPassword) {
    res.json({ 
      success: true,
      token: 'admin-token', // In a real app, generate a secure JWT token
      expiresIn: '1h'
    });
  } else {
    res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }
});

// Update user
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, designation } = req.body;
<<<<<<< HEAD
    if (!id || !name || !email || !phone || !designation) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    // prevent duplicate email
    const existing = await db.User.findOne({ email });
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: 'Email already in use by another user' });
    }
    const updatedUser = await db.updateUser(id, { name, email, phone, designation });
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: '✅ User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

// Admin helper: create user via JSON (no photo) for quick testing
app.post('/api/admin/users', async (req, res) => {
  try {
    const { id, name, email, phone, designation } = req.body;
    if (!id || !name || !email) return res.status(400).json({ error: 'id, name and email required' });
    const exists = await db.User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const user = { id: String(id), name, email, phone: phone || '', designation: designation || '', photoUrl: '' };
    const created = await db.createUser(user);
    res.json({ success: true, user: created });
  } catch (err) {
    console.error('Admin create error:', err);
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

// Admin endpoint: run photo -> photoUrl migration on demand
app.post('/api/admin/migrate-photo', isAdmin, async (req, res) => {
  try {
    const users = await db.User.find({
      $and: [
        { $or: [ { photoUrl: { $exists: false } }, { photoUrl: '' }, { photoUrl: null } ] },
        { photo: { $exists: true, $ne: '' } }
      ]
    }).lean();

    let updated = 0;
    for (const u of users) {
      const val = u.photo || '';
      if (!val) continue;
      const photoUrl = val.startsWith('/') ? val : `/${val}`;
      try { await db.updateUser(u.id, { ...u, photoUrl }); updated++; } catch(e) { console.warn('skip', u.id, e.message); }
    }

    res.json({ success: true, updated });
  } catch (err) {
    console.error('Migration API failed:', err);
    res.status(500).json({ error: 'Migration failed' });
  }
});

// Admin: replace existing user's photo
app.put('/api/users/:id/photo', upload.single('photo'), isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    const user = await db.getUser(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // build a safe filename based on user name or id
    const filenameSafe = (user.name || id).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const finalPhotoPath = `uploads/${filenameSafe}_${Date.now()}.jpeg`;

    try {
      await processCircularImage(req.file.path, finalPhotoPath, 200);
      try { await fs.promises.unlink(req.file.path); } catch (e) { /* ignore cleanup error */ }
    } catch (err) {
      // fallback: move original upload into final location
      try { await fs.promises.rename(req.file.path, finalPhotoPath); } catch (e) { console.warn('Fallback save failed:', e.message || e); }
    }

    // delete previous photo file if exists
    const oldPhoto = user.photoUrl || user.photo || '';
    if (oldPhoto) {
      const oldPath = path.join(__dirname, oldPhoto.startsWith('/') ? oldPhoto.slice(1) : oldPhoto);
      try { await fs.promises.unlink(oldPath); } catch (e) { console.warn('Old photo unlink failed (ignored):', e.message || e); }
    }

    const photoUrl = `/${finalPhotoPath}`;
    await db.updateUser(id, { ...user, photoUrl, photo: finalPhotoPath });

    res.json({ success: true, photoUrl });
  } catch (err) {
    console.error('Admin photo update error:', err);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Health check endpoint to test if backend is live
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is live!' });
});

// Excel export removed: endpoint disabled per configuration

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const startServer = async () => {
  try {
    await db.connect();
  } catch (err) {
    console.error('Failed to connect to DB, exiting.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on ${BACKEND_URL}`);
  });
};

startServer();
=======

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!name || !email || !phone || !designation) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const updatedUser = updateUser(EXCEL_PATH, id, {
      name,
      email,
      phone,
      designation
    });

    res.json({ 
      success: true, 
      message: '✅ User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(error.message.includes('not found') ? 404 : 400).json({ 
      error: error.message || 'Failed to update user'
    });
  }
});

app.listen(3001, () => {
  console.log('✅ Server running on http://localhost:3001');
});
>>>>>>> 53d274ac712e0de6fbb84405e2bad1fcb664a5e5
