const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
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

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Create a new reservation
router.post('/', isAuthenticated, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[+]?[1-9]?[0-9]{7,15}$/).withMessage('Valid phone number is required'),
  body('guests').isInt({ min: 1, max: 20 }).withMessage('Number of guests must be between 1 and 20'),
  body('reservation_date').isISO8601().withMessage('Valid date is required'),
  body('reservation_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
  body('special_requests').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const pool = req.app.locals.db;
    const user_id = req.user.id;
    const {
      name,
      email,
      phone,
      guests,
      reservation_date,
      reservation_time,
      special_requests
    } = req.body;

    // Check if the reservation date is not in the past
    const reservationDateTime = new Date(`${reservation_date}T${reservation_time}`);
    const now = new Date();
    
    // Add 1 minute buffer to account for processing time
    const nowWithBuffer = new Date(now.getTime() + 60000); // 1 minute buffer
    
    // Allow reservations that are at least 1 minute in the future
    if (reservationDateTime < nowWithBuffer) {
      return res.status(400).json({ 
        message: 'Reservation date and time cannot be in the past' 
      });
    }

    // Insert reservation into database
    const insertQuery = `
      INSERT INTO reservations (
        user_id, guest_name, guest_email, guest_phone, party_size, 
        reservation_date, reservation_time, special_requests, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      user_id,
      name,
      email,
      phone,
      guests,
      reservation_date,
      reservation_time,
      special_requests || null,
      'pending'
    ];

    const result = await pool.query(insertQuery, values);
    const reservation = result.rows[0];

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's reservations
router.get('/my-reservations', isAuthenticated, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const user_id = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const query = `
      SELECT 
        id, guest_name as name, guest_email as email, guest_phone as phone, party_size as guests, reservation_date, 
        reservation_time, special_requests, status, created_at
      FROM reservations
      WHERE user_id = $1
      ORDER BY reservation_date DESC, reservation_time DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [user_id, parseInt(limit), parseInt(offset)]);

    res.json({
      reservations: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin routes

// Get all reservations (Admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { status, date, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT 
        r.id, r.guest_name as name, r.guest_email as email, r.guest_phone as phone, r.party_size as guests, 
        r.reservation_date, r.reservation_time, r.special_requests, 
        r.status, r.created_at, r.updated_at,
        u.full_name as customer_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (date) {
      paramCount++;
      query += ` AND r.reservation_date = $${paramCount}`;
      queryParams.push(date);
    }

    query += ` ORDER BY r.reservation_date DESC, r.reservation_time DESC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(parseInt(offset));

    const result = await pool.query(query, queryParams);

    res.json({
      reservations: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update reservation status (Admin only)
router.patch('/:id/status', isAdmin, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const pool = req.app.locals.db;
    const { id } = req.params;
    const { status } = req.body;

    const updateQuery = `
      UPDATE reservations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json({
      message: 'Reservation status updated successfully',
      reservation: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete reservation (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM reservations WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json({
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;