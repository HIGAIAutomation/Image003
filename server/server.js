require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');
const path = require('path');

const { saveToExcel, getMembersByDesignation, getAllUsers, deleteUser, updateUser } = require('./utils/excel');
const { processCircularImage, generateFooterSVG, createFinalPoster } = require('./utils/image');

const app = express();
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'members.xlsx');
const LOGO_PATH = path.join(__dirname, 'assets/logo.png');

// Create required directories
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({ 
  dest: UPLOADS_DIR,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const users = getAllUsers(EXCEL_PATH);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  try {
    deleteUser(EXCEL_PATH, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

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
      } catch (e) {
        throw new Error(`Failed to save image: ${e.message}`);
      }
    }

    try {
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
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, designation } = req.body;

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
