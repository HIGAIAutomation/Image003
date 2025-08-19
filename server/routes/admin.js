const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'supersecret';
const ADMIN_COOKIE_NAME = 'admin_token';
const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 24 * 60 * 60 * 1000,
  signed: true,
};

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Admin authorization middleware
function isAdmin(req, res, next) {
  const token = req.signedCookies && req.signedCookies[ADMIN_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  next();
}

// Admin auth check handler
function handleAuthCheck(req, res) {
  const token = req.signedCookies[ADMIN_COOKIE_NAME];
  if (token) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
}

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    return res.status(500).json({ error: 'Admin credentials not configured' });
  }

  if (username === validUsername && password === validPassword) {
    const token = generateToken();
    // Set the admin token cookie with proper settings for cross-origin
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/', // Ensure cookie is accessible on all paths
      });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Auth check endpoint - both formats
router.get('/auth', handleAuthCheck);
router.get('-auth', handleAuthCheck); // For backward compatibility

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    ...ADMIN_COOKIE_OPTIONS,
    maxAge: 0
  });
  res.json({ success: true });
});

module.exports = {
  router,
  isAdmin
};
