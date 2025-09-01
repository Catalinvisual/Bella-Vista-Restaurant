const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendOrderConfirmation } = require('../services/emailService');
const router = express.Router();

// Middleware to check if user is authenticated via JWT
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const jwt = require('jsonwebtoken');
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
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Admin access required' });
  }
};

// Middleware to check authentication for orders (allows guest checkout for cash on delivery)
const isAuthenticatedOrGuest = (req, res, next) => {
  const { payment_method = 'cash_on_delivery' } = req.body;
  
  // Allow guest checkout for cash on delivery
  if (payment_method === 'cash_on_delivery') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Guest user - set req.user to null
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
      next();
    } catch (error) {
      // Invalid token but cash on delivery - allow as guest
      req.user = null;
      next();
    }
  } else {
    // For other payment methods, require authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required for this payment method' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }
};

// Create new order
router.post('/', isAuthenticatedOrGuest, [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.menu_item_id').isInt({ min: 1 }).withMessage('Valid menu item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('delivery_address').optional().trim().isLength({ min: 5 }).withMessage('Delivery address must be at least 5 characters'),
  body('phone_number').optional().isMobilePhone(['nl-NL', 'en-GB', 'de-DE', 'fr-FR', 'it-IT', 'es-ES', 'pt-PT', 'at-AT', 'ch-CH', 'dk-DK', 'se-SE', 'no-NO', 'fi-FI', 'ie-IE', 'lt-LT', 'lv-LV', 'ee-EE', 'si-SI', 'hr-HR', 'sk-SK', 'cz-CZ', 'pl-PL', 'ro-RO', 'bg-BG', 'gr-GR', 'cy-CY', 'mt-MT', 'lu-LU', 'li-LI', 'mc-MC', 'sm-SM']).withMessage('Please provide a valid European phone number'),
  body('special_instructions').optional().trim(),
  body('customer_info.full_name').optional().trim(),
  body('customer_info.phone').optional().trim(),
  body('customer_info.email').optional().isEmail().withMessage('Please provide a valid email address'),
  body('pickup_time').optional().isISO8601().withMessage('Please provide a valid pickup time'),
  body('order_type').optional().isIn(['delivery', 'pickup']).withMessage('Order type must be delivery or pickup'),
  body('payment_method').optional().isIn(['cash_on_delivery', 'stripe']).withMessage('Payment method must be cash_on_delivery or stripe')
], async (req, res) => {
  const client = await req.app.locals.db.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { items, delivery_address, phone_number, special_instructions, order_type = 'delivery', customer_info, pickup_time } = req.body;
    const user_id = req.user ? req.user.id : null;
    
    // For guest users, require customer_info
    if (!req.user && (!customer_info || !customer_info.full_name || !customer_info.email || !customer_info.phone)) {
      return res.status(400).json({ 
        message: 'Customer information (full name, email, and phone) is required for guest orders' 
      });
    }

    await client.query('BEGIN');

    // Verify all menu items exist and are available
    const menuItemIds = items.map(item => item.menu_item_id);
    const menuItemsQuery = `
      SELECT id, name, price, is_available 
      FROM menu_items 
      WHERE id = ANY($1) AND is_active = true
    `;
    const menuItemsResult = await client.query(menuItemsQuery, [menuItemIds]);
    
    if (menuItemsResult.rows.length !== menuItemIds.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'One or more menu items not found or inactive' });
    }

    // Check if all items are available
    const unavailableItems = menuItemsResult.rows.filter(item => !item.is_available);
    if (unavailableItems.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Some items are currently unavailable',
        unavailable_items: unavailableItems.map(item => item.name)
      });
    }

    // Calculate total amount
    let total_amount = 0;
    const validatedItems = items.map(orderItem => {
      const menuItem = menuItemsResult.rows.find(mi => mi.id === orderItem.menu_item_id);
      const itemTotal = menuItem.price * orderItem.quantity;
      total_amount += itemTotal;
      
      return {
        menu_item_id: orderItem.menu_item_id,
        quantity: orderItem.quantity,
        price: menuItem.price,
        total: itemTotal
      };
    });

    // Add delivery fee if applicable
    const delivery_fee = order_type === 'delivery' ? 3.99 : 0;
    const tax_amount = total_amount * 0.08; // 8% tax
    const final_total = total_amount + delivery_fee + tax_amount;

    // Create order
    const orderQuery = `
      INSERT INTO orders (
        user_id, total_amount, tax_amount, delivery_fee, final_total,
        order_type, status, delivery_address, phone_number, special_instructions,
        customer_email, customer_name, customer_phone, pickup_time,
        payment_method, payment_status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const { payment_method = 'cash_on_delivery' } = req.body;
    const payment_status = payment_method === 'cash_on_delivery' ? 'pending' : 'paid';

    const orderResult = await client.query(orderQuery, [
      user_id, total_amount, tax_amount, delivery_fee, final_total,
      order_type, delivery_address, phone_number, special_instructions,
      customer_info?.email || null, customer_info?.full_name || null, customer_info?.phone || null,
      pickup_time || null, payment_method, payment_status
    ]);

    const order = orderResult.rows[0];

    // Create order items
    const orderItemsQuery = `
      INSERT INTO order_items (order_id, menu_item_id, quantity, price, total)
      VALUES ($1, $2, $3, $4, $5)
    `;

    for (const item of validatedItems) {
      await client.query(orderItemsQuery, [
        order.id, item.menu_item_id, item.quantity, item.price, item.total
      ]);
    }

    await client.query('COMMIT');

    // Fetch complete order with items and user info
    const completeOrderQuery = `
      SELECT 
        o.*,
        COALESCE(o.customer_name, u.full_name) as customer_name,
        COALESCE(o.customer_email, u.email) as customer_email,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'menu_item_name', mi.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = $1
      GROUP BY o.id, o.customer_name, o.customer_email, u.full_name, u.email
    `;

    const completeOrderResult = await client.query(completeOrderQuery, [order.id]);
    const orderWithDetails = completeOrderResult.rows[0];

    // Send order confirmation email
    try {
      await sendOrderConfirmation(orderWithDetails);
      console.log('Order confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: orderWithDetails
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get user's orders
router.get('/my-orders', isAuthenticated, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { limit = 10, offset = 0 } = req.query;
    const user_id = req.user.id;

    const query = `
      SELECT 
        o.id, o.total_amount, o.tax_amount, o.delivery_fee, o.final_total,
        o.order_type, o.status, o.delivery_address, o.special_instructions,
        o.created_at, o.updated_at,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'menu_item_name', mi.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [user_id, parseInt(limit), parseInt(offset)]);

    res.json({
      orders: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single order
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { id } = req.params;
    const user_id = req.user.id;
    const isAdminUser = req.user.role === 'admin';

    let query = `
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'menu_item_name', mi.name,
            'quantity', oi.quantity,
            'price', oi.unit_price,
            'total', oi.total_price
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = $1
    `;

    const queryParams = [id];

    // Non-admin users can only see their own orders
    if (!isAdminUser) {
      query += ` AND o.user_id = $2`;
      queryParams.push(user_id);
    }

    query += ` GROUP BY o.id, u.full_name, u.email`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin routes

// Get all orders (Admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { status, limit = 20, offset = 0, date_from, date_to } = req.query;

    let query = `
      SELECT 
        o.id, o.total_amount, o.tax_amount, o.delivery_fee, o.final_total,
        o.order_type, o.status, o.delivery_address, o.special_instructions,
        o.created_at, o.updated_at,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone_number as customer_phone,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (date_from) {
      paramCount++;
      query += ` AND o.created_at >= $${paramCount}`;
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      query += ` AND o.created_at <= $${paramCount}`;
      queryParams.push(date_to);
    }

    query += ` GROUP BY o.id, u.full_name, u.email, u.phone_number`;
    query += ` ORDER BY o.created_at DESC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(parseInt(offset));

    const result = await pool.query(query, queryParams);

    res.json({
      orders: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', isAdmin, [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).withMessage('Invalid status'),
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

    const query = `
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Complete cash payment (Admin only)
router.patch('/:id/complete-cash-payment', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { id } = req.params;

    // First check if order exists and is a cash payment
    const checkQuery = `
      SELECT id, payment_method, payment_status, status 
      FROM orders 
      WHERE id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = checkResult.rows[0];
    
    if (order.payment_method !== 'cash_on_delivery') {
      return res.status(400).json({ message: 'This order is not a cash payment order' });
    }
    
    if (order.payment_status === 'paid') {
      return res.status(400).json({ message: 'Payment has already been completed' });
    }

    // Update payment status to paid and order status to confirmed if still pending
    const updateQuery = `
      UPDATE orders 
      SET payment_status = 'paid', 
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [id]);

    res.json({
      message: 'Cash payment completed successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing cash payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get order statistics (Admin only)
router.get('/stats/overview', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COALESCE(SUM(final_total), 0) as total_revenue,
        COALESCE(AVG(final_total), 0) as average_order_value,
        COUNT(DISTINCT user_id) as unique_customers
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const result = await pool.query(statsQuery);

    res.json({
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;