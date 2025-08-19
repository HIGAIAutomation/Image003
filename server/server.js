require('dotenv').config();

// Import required modules
const express = require('express');
const multer = require('multer');
const fs = require('fs').promises; // Use async promises version
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const db = require('./db'); // Assuming this module is functional and secure

const app = express();

// --- Configuration ---
// Make sure these are in your .env file in a production environment.
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Configure paths
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');
const LOGO_PATH = path.join(__dirname, 'assets/logo.png');

// Create necessary directories if they don't exist
const createDirs = async () => {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
    } catch (err) {
        console.error('Failed to create necessary directories:', err);
        process.exit(1);
    }
};

// Configure multer for file uploads
const upload = multer({ 
    dest: UPLOADS_DIR,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure CORS middleware
const allowedOrigins = [
    'https://abuinshah.netlify.app',
    'http://localhost:5173'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Configure middleware
app.use(express.json());
app.use(cookieParser(ADMIN_TOKEN_SECRET)); // Use a secret from an env variable

// Serve static files
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// --- Utility Functions ---

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Admin authorization middleware - IMPROVED
function isAdmin(req, res, next) {
    const token = req.signedCookies.admin_token;
    if (token) return next();
    return res.status(403).json({ error: 'Admin access required' });
}

// --- API Endpoints ---
// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.allUsers();
        // Normalize: older records may have `photo` while client expects `photoUrl`
        const normalized = users.map(u => ({
            ...u,
            photoUrl: u.photoUrl || u.photo || ''
        }));
        res.json(normalized);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Delete user
app.delete('/api/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await db.getUser(req.params.id);
        if (user && user.photoUrl) {
            try {
                // Ensure the path is correct before unlinking
                const filePath = path.join(__dirname, user.photoUrl);
                await fs.unlink(filePath);
            } catch (e) {
                // It's a warning, not a critical failure if the file is already gone
                console.warn(`Failed to delete user photo for user ${req.params.id}:`, e);
            }
        }
        await db.deleteUser(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Register new member
app.post('/api/register', upload.single('photo'), async (req, res) => {
    try {
        const { name, phone, email, designation } = req.body;
        
        // Validate inputs
        if (!name || !phone || !email || !designation || !req.file) {
            // Clean up uploaded file if validation fails
            if (req.file) {
                await fs.unlink(req.file.path);
            }
            return res.status(400).json({ error: 'All fields and a photo are required' });
        }

        // Process photo - using a safer path and async operations
        const filenameSafe = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const finalPhotoFilename = `${filenameSafe}_${Date.now()}.jpeg`;
        const finalPhotoPath = path.join(UPLOADS_DIR, finalPhotoFilename);
        
        try {
            // Assuming processCircularImage is async
            await processCircularImage(req.file.path, finalPhotoPath, 200);
            await fs.unlink(req.file.path); // Clean up original upload
        } catch (err) {
            console.error('🛑 Image processing failed, falling back:', err);
            // Fallback: move original file if processing fails
            try {
                await fs.rename(req.file.path, finalPhotoPath);
            } catch (e) {
                // If even the fallback fails, it's a critical error
                console.error(`🔴 Critical: Failed to save image even with fallback: ${e.message}`);
                throw new Error(`Failed to save image: ${e.message}`);
            }
        }

        // Construct a cleaner, predictable URL
        const photoUrl = `/uploads/${finalPhotoFilename}`;

        try {
            if (designation && designation.toLowerCase() === 'both') {
                const id1 = Date.now().toString();
                const userData1 = { id: id1, name, phone, email, designation: 'Health Insurance Advisor', photoUrl };
                const id2 = (Date.now() + 1).toString();
                const userData2 = { id: id2, name, phone, email, designation: 'Wealth Manager', photoUrl };
                await db.createUser(userData1);
                await db.createUser(userData2);
                res.json({ success: true, message: '✅ Two profiles registered successfully', users: [userData1, userData2] });
            } else {
                const id = Date.now().toString();
                const userData = { id, name, phone, email, designation, photoUrl };
                await db.createUser(userData);
                res.json({ success: true, message: '✅ Member registered successfully', user: userData });
            }
        } catch (err) {
            // If DB operation fails, clean up the photo
            console.error('Database operation failed, cleaning up photo:', err);
            try { await fs.unlink(finalPhotoPath); } catch (e) { console.warn('Photo cleanup failed:', e); }
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

// Send posters
app.post('/api/send-posters', isAdmin, upload.single('template'), async (req, res) => {
    try {
        const { designation } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'Template image is required' });
        }

        const templatePath = req.file.path;
        let designationsToSend = [];
        if (designation.toLowerCase() === 'both') {
            designationsToSend = ['Health Insurance Advisor', 'Wealth Manager'];
        } else {
            designationsToSend = [designation];
        }

        let totalRecipients = 0;
        for (const desig of designationsToSend) {
            const recipients = (await db.findMembersByDesignation(desig)).map(recipient => ({ ...recipient, designation: desig }));
            
            if (!recipients.length) continue;
            totalRecipients += recipients.length;
            
            for (const person of recipients) {
                const finalImageFilename = `final_${Date.now()}_${person.name.replace(/\s+/g, '_')}.jpeg`;
                const finalImagePath = path.join(OUTPUT_DIR, finalImageFilename);
                try {
                    const photoPath = path.join(__dirname, person.photoUrl);
                    await fs.access(photoPath, fs.constants.R_OK); // Check if file exists and is readable

                    await createFinalPoster({
                        templatePath,
                        person: { ...person, photo: photoPath },
                        logoPath: LOGO_PATH,
                        outputPath: finalImagePath
                    });

                    // Assuming sendEmail is async
                    await sendEmail({
                        Name: person.name,
                        Email: person.email,
                        Phone: person.phone,
                        Designation: person.designation
                    }, finalImagePath);
                
                    // Clean up the generated image
                    try {
                        await fs.unlink(finalImagePath);
                    } catch (e) {
                        console.warn(`Cleanup failed for ${person.name}'s image (ignored):`, e.message);
                    }
                } catch (err) {
                    console.error(`Failed to process/send poster for ${person.name} (${person.email}):`, err);
                    // Continue with next person even if one fails
                }
            }
        }

        // Cleanup the template file
        try { 
            await fs.unlink(templatePath); 
        } catch (e) { 
            console.warn('Template cleanup failed (ignored):', e.message); 
        }

        if (totalRecipients === 0) {
            return res.status(404).json({ error: `No recipients found for designation: ${designation}` });
        }

        res.json({ success: true, message: '✅ Posters sent successfully', recipientCount: totalRecipients });
    } catch (error) {
        console.error('Send posters error:', error);
        res.status(500).json({ error: 'Failed to send posters', details: error.message });
    }
});

// Admin login: set secure cookie
app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;
    
    // Check if credentials are configured
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'Admin credentials not configured' });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateToken();
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000,
            signed: true,
        });
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Admin auth check: verify cookie
app.get('/api/admin-auth', (req, res) => {
    const token = req.signedCookies.admin_token;
    if (token) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// Admin logout: clear cookie
app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('admin_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 0
    });
    res.json({ success: true });
});

// Update user
app.put('/api/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, designation } = req.body;
        if (!id || !name || !email || !phone || !designation) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const existing = await db.getUserByEmail(email);
        if (existing && existing.id !== id) {
            return res.status(400).json({ error: 'Email already in use by another user' });
        }
        
        const updatedUser = await db.updateUser(id, { name, email, phone, designation });
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, message: '✅ User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: error.message || 'Failed to update user' });
    }
});

// Admin helper: create user via JSON (no photo) for quick testing
app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const { id, name, email, phone, designation } = req.body;
        if (!id || !name || !email) {
            return res.status(400).json({ error: 'id, name and email required' });
        }
        
        const exists = await db.getUserByEmail(email);
        if (exists) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const user = { 
            id: String(id), 
            name, 
            email, 
            phone: phone || '', 
            designation: designation || '', 
            photoUrl: '' 
        };
        
        const created = await db.createUser(user);
        res.json({ success: true, user: created });
    } catch (err) {
        console.error('Admin create error:', err);
        res.status(500).json({ error: err.message || 'Failed to create user' });
    }
});

// Admin: replace existing user's photo
app.put('/api/users/:id/photo', isAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No photo uploaded' });
        }

        const user = await db.getUser(id);
        if (!user) {
            await fs.unlink(req.file.path); // Clean up uploaded file if user not found
            return res.status(404).json({ error: 'User not found' });
        }
        
        // build a safe filename based on user name or id
        const filenameSafe = (user.name || id).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const finalPhotoFilename = `${filenameSafe}_${Date.now()}.jpeg`;
        const finalPhotoPath = path.join(UPLOADS_DIR, finalPhotoFilename);

        try {
            await processCircularImage(req.file.path, finalPhotoPath, 200);
            await fs.unlink(req.file.path);
        } catch (err) {
            console.error('Admin photo processing failed, falling back:', err);
            try { 
                await fs.rename(req.file.path, finalPhotoPath);
            } catch (e) { 
                console.error('Admin fallback photo save failed:', e.message); 
                res.status(500).json({ error: 'Failed to save photo' });
                return;
            }
        }
        
        // delete previous photo file if it exists
        const oldPhoto = user.photoUrl || user.photo || '';
        if (oldPhoto) {
            // Correct path handling, slicing off a leading slash if present
            const oldPath = path.join(__dirname, oldPhoto.startsWith('/') ? oldPhoto.slice(1) : oldPhoto);
            try { 
                await fs.unlink(oldPath); 
            } catch (e) { 
                console.warn('Old photo unlink failed (ignored):', e.message); 
            }
        }

        // Construct a cleaner, predictable URL
        const photoUrl = `/uploads/${finalPhotoFilename}`;
        await db.updateUser(id, { ...user, photoUrl });

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

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const startServer = async () => {
    // Check for critical environment variables before starting
    if (!ADMIN_TOKEN_SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
        console.error('Critical: Admin credentials are not set in environment variables. Server will not start.');
        process.exit(1);
    }
    
    try {
        await createDirs();
        await db.connect();
    } catch (err) {
        console.error('Failed to connect to DB or create dirs, exiting.', err);
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`✅ Server running on ${BACKEND_URL}`);
    });
};

startServer();
