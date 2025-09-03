const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

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

// Dashboard statistics (detailed)
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    
    // Get various statistics
    const statsQueries = {
      // Total orders today
      todayOrders: `
        SELECT COUNT(*) as count, COALESCE(SUM(final_total), 0) as revenue
        FROM orders 
        WHERE DATE(created_at) = CURRENT_DATE
      `,
      
      // Total orders this month
      monthlyOrders: `
        SELECT COUNT(*) as count, COALESCE(SUM(final_total), 0) as revenue
        FROM orders 
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `,
      
      // Total customers
      totalCustomers: `
        SELECT COUNT(*) as count
        FROM users 
        WHERE role = 'customer' AND is_active = true
      `,
      
      // Active menu items
      activeMenuItems: `
        SELECT COUNT(*) as count
        FROM menu_items 
        WHERE is_active = true
      `,
      
      // Recent orders
      recentOrders: `
        SELECT 
          o.id, o.final_total, o.status, o.created_at,
          u.full_name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `,
      
      // Order status distribution
      orderStatusDistribution: `
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY status
      `,
      
      // Top selling items
      topSellingItems: `
        SELECT 
          mi.name,
          SUM(oi.quantity) as total_sold,
          SUM(oi.total) as total_revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY mi.id, mi.name
        ORDER BY total_sold DESC
        LIMIT 5
      `
    };

    const results = {};
    
    for (const [key, query] of Object.entries(statsQueries)) {
      const result = await pool.query(query);
      results[key] = result.rows;
    }

    // Format the response
    const dashboardData = {
      todayStats: {
        orders: parseInt(results.todayOrders[0].count),
        revenue: parseFloat(results.todayOrders[0].revenue)
      },
      monthlyStats: {
        orders: parseInt(results.monthlyOrders[0].count),
        revenue: parseFloat(results.monthlyOrders[0].revenue)
      },
      totalCustomers: parseInt(results.totalCustomers[0].count),
      activeMenuItems: parseInt(results.activeMenuItems[0].count),
      recentOrders: results.recentOrders,
      orderStatusDistribution: results.orderStatusDistribution,
      topSellingItems: results.topSellingItems
    };

    res.json({
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Dashboard statistics (simple stats for frontend)
router.get('/dashboard/stats', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    
    // Get simple statistics
    const totalOrdersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    const totalRevenueResult = await pool.query('SELECT COALESCE(SUM(final_total), 0) as revenue FROM orders');
    const totalCustomersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'customer\' AND is_active = true');
    const menuItemsResult = await pool.query('SELECT COUNT(*) as count FROM menu_items WHERE is_active = true');
    const totalReservationsResult = await pool.query('SELECT COUNT(*) as count FROM reservations');
    
    const stats = {
      totalOrders: parseInt(totalOrdersResult.rows[0].count),
      totalRevenue: parseFloat(totalRevenueResult.rows[0].revenue),
      totalCustomers: parseInt(totalCustomersResult.rows[0].count),
      menuItems: parseInt(menuItemsResult.rows[0].count),
      totalReservations: parseInt(totalReservationsResult.rows[0].count)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User management

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { role, search, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        id, full_name, email, phone_number, role, is_active, 
        email_verified, created_at, updated_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as total_orders,
        (SELECT COALESCE(SUM(final_total), 0) FROM orders WHERE user_id = users.id) as total_spent
      FROM users
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      queryParams.push(role);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      users: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user status
router.patch('/users/:id/status', isAdmin, [
  body('is_active').isBoolean().withMessage('is_active must be a boolean'),
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
    const { is_active } = req.body;

    // Prevent admin from deactivating themselves
    if (req.user.id === parseInt(id) && !is_active) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const query = `
      UPDATE users 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, full_name, email, is_active
    `;

    const result = await pool.query(query, [is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user role
router.patch('/users/:id/role', isAdmin, [
  body('role').isIn(['customer', 'admin']).withMessage('Role must be either customer or admin'),
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
    const { role } = req.body;

    // Prevent admin from changing their own role
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const query = `
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, full_name, email, role
    `;

    const result = await pool.query(query, [role, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User role updated to ${role} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Analytics and Reports

// Sales report
router.get('/reports/sales', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { period = 'week', start_date, end_date } = req.query;
    
    let dateFilter = '';
    const queryParams = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE o.created_at BETWEEN $1 AND $2';
      queryParams.push(start_date, end_date);
    } else {
      switch (period) {
        case 'today':
          dateFilter = 'WHERE DATE(o.created_at) = CURRENT_DATE';
          break;
        case 'week':
          dateFilter = 'WHERE o.created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'month':
          dateFilter = 'WHERE o.created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
        case 'year':
          dateFilter = 'WHERE o.created_at >= CURRENT_DATE - INTERVAL \'1 year\'';
          break;
      }
    }
    
    const salesQuery = `
      SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as total_orders,
        SUM(o.final_total) as total_revenue,
        AVG(o.final_total) as average_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      ${dateFilter}
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `;
    
    const result = await pool.query(salesQuery, queryParams);
    
    res.json({
      period,
      sales_data: result.rows
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Menu performance report
router.get('/reports/menu-performance', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = 'WHERE o.created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'WHERE o.created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'WHERE o.created_at >= CURRENT_DATE - INTERVAL \'1 year\'';
        break;
    }
    
    const menuPerformanceQuery = `
      SELECT 
        mi.id,
        mi.name,
        mc.name as category_name,
        mi.price,
        COUNT(oi.id) as times_ordered,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.total) as total_revenue,
        AVG(oi.quantity) as avg_quantity_per_order
      FROM menu_items mi
      LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      ${dateFilter}
      WHERE mi.is_active = true
      GROUP BY mi.id, mi.name, mc.name, mi.price
      ORDER BY total_quantity_sold DESC NULLS LAST
    `;
    
    const result = await pool.query(menuPerformanceQuery);
    
    res.json({
      period,
      menu_performance: result.rows
    });
  } catch (error) {
    console.error('Error generating menu performance report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Customer analytics
router.get('/reports/customers', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    
    const customerAnalyticsQuery = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.created_at as registration_date,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.final_total), 0) as total_spent,
        COALESCE(AVG(o.final_total), 0) as average_order_value,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer' AND u.is_active = true
      GROUP BY u.id, u.full_name, u.email, u.created_at
      ORDER BY total_spent DESC
      LIMIT 50
    `;
    
    const result = await pool.query(customerAnalyticsQuery);
    
    res.json({
      customer_analytics: result.rows
    });
  } catch (error) {
    console.error('Error generating customer analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// System settings

// Get system settings
router.get('/settings', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    
    const settingsQuery = `
      SELECT key, value, description, updated_at
      FROM system_settings
      ORDER BY key
    `;
    
    const result = await pool.query(settingsQuery);
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = {
        value: row.value,
        description: row.description,
        updated_at: row.updated_at
      };
    });
    
    res.json({
      settings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update system setting
router.put('/settings/:key', isAdmin, [
  body('value').notEmpty().withMessage('Value is required'),
  body('description').optional().trim(),
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
    const { key } = req.params;
    const { value, description } = req.body;

    const query = `
      INSERT INTO system_settings (key, value, description, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, system_settings.description),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [key, value, description]);

    res.json({
      message: 'Setting updated successfully',
      setting: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get orders for admin dashboard
router.get('/orders', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { limit = 10, offset = 0, status } = req.query;
    
    let query = `
      SELECT 
        o.id, o.final_total, o.status, o.created_at, o.updated_at,
        u.full_name as customer_name, u.email as customer_email,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'name', mi.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    query += ` GROUP BY o.id, u.full_name, u.email`;
    query += ` ORDER BY o.id DESC`;
    
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

// Get reservations for admin dashboard
router.get('/reservations', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { limit = 10, offset = 0, status } = req.query;
    
    let query = `
      SELECT 
        r.id, r.name, r.email, r.phone, r.guests, 
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
    
    query += ` ORDER BY r.id DESC`;
    
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

// Update reservation status
router.patch('/reservations/:id/status', isAdmin, [
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

module.exports = router;