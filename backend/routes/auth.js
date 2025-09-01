const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const router = express.Router();

// Middleware to check if user is authenticated via JWT
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Legacy session-based authentication middleware
const isAuthenticatedSession = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
};

// Register
router.post('/register', [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').optional().isMobilePhone(['nl-NL', 'en-GB', 'de-DE', 'fr-FR', 'it-IT', 'es-ES', 'pt-PT', 'at-AT', 'ch-CH', 'dk-DK', 'se-SE', 'no-NO', 'fi-FI', 'ie-IE', 'lt-LT', 'lv-LV', 'ee-EE', 'si-SI', 'hr-HR', 'sk-SK', 'cz-CZ', 'pl-PL', 'ro-RO', 'bg-BG', 'gr-GR', 'cy-CY', 'mt-MT', 'lu-LU', 'li-LI', 'mc-MC', 'sm-SM']).withMessage('Please provide a valid European phone number'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Registration validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { fullName, email, password, phoneNumber } = req.body;
    const pool = req.app.locals.db;

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await pool.query(existingUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const insertUserQuery = `
      INSERT INTO users (full_name, email, password, phone_number, is_active, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, full_name, email, phone_number, role, is_active, email_verified, created_at
    `;

    const newUser = await pool.query(insertUserQuery, [
      fullName,
      email,
      hashedPassword,
      phoneNumber || null
    ]);

    const user = newUser.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    const pool = req.app.locals.db;

    // Check if user exists
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'No user found with that email' });
    }
    
    const user = userResult.rows[0];
    
    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    
    // Remove password from user object
    const { password: userPassword, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Session cleanup failed' });
      }
      
      res.json({ message: 'Logout successful' });
    });
  });
});

// Get current user
router.get('/me', isAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email } = req.body;
    const pool = req.app.locals.db;

    // Check if user exists
    const userQuery = 'SELECT id, full_name FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    const updateQuery = `
      UPDATE users 
      SET reset_token = $1, reset_token_expiry = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `;
    await pool.query(updateQuery, [resetToken, resetTokenExpiry, user.id]);

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ 
      message: 'If the email exists, a reset link has been sent',
      // Remove this in production:
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { token, password } = req.body;
    const pool = req.app.locals.db;

    // Find user with valid reset token
    const userQuery = `
      SELECT id FROM users 
      WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP
    `;
    const userResult = await pool.query(userQuery, [token]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = userResult.rows[0];

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    const updateQuery = `
      UPDATE users 
      SET password = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    await pool.query(updateQuery, [hashedPassword, user.id]);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;