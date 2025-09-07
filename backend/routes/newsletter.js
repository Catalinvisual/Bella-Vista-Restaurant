const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendNewsletterWelcomeEmail } = require('../services/emailService');
const router = express.Router();

// Newsletter subscription endpoint
router.post('/subscribe', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid email address',
        errors: errors.array() 
      });
    }

    const { email } = req.body;
    
    // Get database connection
    const db = req.app.locals.db;
    
    // Check if email already exists in newsletter subscribers
    const existingSubscriber = await db.query(
      'SELECT id FROM newsletter_subscribers WHERE email = $1',
      [email]
    );
    
    if (existingSubscriber.rows.length > 0) {
      return res.status(200).json({ 
        message: 'You are already subscribed to our newsletter!',
        alreadySubscribed: true
      });
    }
    
    // Add email to newsletter subscribers
    await db.query(
      'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES ($1, NOW())',
      [email]
    );
    
    // Send welcome email
    try {
      await sendNewsletterWelcomeEmail(email);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the subscription if email fails
    }
    
    res.status(201).json({ 
      message: 'Successfully subscribed! Check your email for a welcome message and your 15% discount code.',
      success: true
    });
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ 
      message: 'Failed to subscribe to newsletter. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Unsubscribe endpoint (for future use)
router.post('/unsubscribe', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid email address',
        errors: errors.array() 
      });
    }

    const { email } = req.body;
    const db = req.app.locals.db;
    
    // Remove email from newsletter subscribers
    const result = await db.query(
      'DELETE FROM newsletter_subscribers WHERE email = $1',
      [email]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        message: 'Email not found in our newsletter list'
      });
    }
    
    res.status(200).json({ 
      message: 'Successfully unsubscribed from newsletter',
      success: true
    });
    
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ 
      message: 'Failed to unsubscribe. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;