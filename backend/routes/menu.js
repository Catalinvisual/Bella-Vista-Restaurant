const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
};

// Get all menu categories
router.get('/categories', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const query = `
      SELECT id, name, description, display_order, created_at, updated_at
      FROM menu_categories 
      ORDER BY display_order ASC, name ASC
    `;
    const result = await pool.query(query);
    
    res.json({
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get complete menu data (categories with items)
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    
    // Get categories
    const categoriesQuery = `
      SELECT id, name, description, display_order, created_at, updated_at
      FROM menu_categories 
      ORDER BY display_order ASC, name ASC
    `;
    const categoriesResult = await pool.query(categoriesQuery);
    
    // Get all menu items
    const itemsQuery = `
      SELECT 
        mi.id, mi.name, mi.description, mi.price, mi.image_url, 
        mi.is_available, mi.is_featured, mi.allergens, mi.dietary_info, mi.label,
        mc.name as category_name, mc.id as category_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.is_available = true
      ORDER BY mc.display_order ASC, mi.name ASC
    `;
    const itemsResult = await pool.query(itemsQuery);
    
    // Group items by category
    const categoriesWithItems = categoriesResult.rows.map(category => ({
      ...category,
      items: itemsResult.rows.filter(item => item.category_id === category.id)
    }));
    
    res.json({
      categories: categoriesWithItems,
      totalItems: itemsResult.rows.length
    });
  } catch (error) {
    console.error('Error fetching complete menu:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all menu items
router.get('/items', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { category, search, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        mi.id, mi.name, mi.description, mi.price, mi.image_url, 
        mi.is_available, mi.is_featured, mi.allergens, mi.dietary_info, mi.label,
        mc.name as category_name, mc.id as category_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.is_available = true
    `;
    
    const queryParams = [];
    let paramCount = 0;
    
    if (category) {
      paramCount++;
      query += ` AND mc.id = $${paramCount}`;
      queryParams.push(category);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (mi.name ILIKE $${paramCount} OR mi.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY mi.is_featured DESC, mi.name ASC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      items: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get featured menu items
router.get('/featured', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const query = `
      SELECT 
        mi.id, mi.name, mi.description, mi.price, mi.image_url, 
        mi.is_available, mi.is_featured, mi.allergens, mi.dietary_info, mi.label,
        mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.is_featured = true AND mi.is_available = true
      ORDER BY mi.created_at DESC
      LIMIT 6
    `;
    
    const result = await pool.query(query);
    
    res.json({
      items: result.rows
    });
  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single menu item
router.get('/items/:id', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { id } = req.params;
    
    const query = `
      SELECT 
        mi.id, mi.name, mi.description, mi.price, mi.image_url, 
        mi.is_available, mi.is_featured, mi.allergens, mi.dietary_info, mi.label,
        mi.preparation_time, mi.created_at, mi.updated_at,
        mc.name as category_name, mc.id as category_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.id = $1 AND mi.is_available = true
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json({
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin routes for managing menu items

// Create menu category (Admin only)
router.post('/categories', isAdmin, [
  body('name').trim().isLength({ min: 1 }).withMessage('Category name is required'),
  body('description').optional().trim(),
  body('display_order').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const pool = req.app.locals.db;
    const { name, description, display_order = 0 } = req.body;

    const query = `
      INSERT INTO menu_categories (name, description, display_order, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await pool.query(query, [name, description, display_order]);

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create menu item (Admin only)
router.post('/items', isAdmin, [
  body('name').trim().isLength({ min: 1 }).withMessage('Item name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_id').isInt({ min: 1 }).withMessage('Valid category ID is required'),
  body('image_url').optional().custom((value) => {
    if (value && !value.startsWith('/uploads/') && !value.match(/^https?:\/\//)) {
      throw new Error('Image URL must be a valid URL or relative path starting with /uploads/');
    }
    return true;
  }),
  body('label').optional().trim().isLength({ max: 50 }).withMessage('Label must be 50 characters or less'),
  body('preparation_time').optional().isInt({ min: 0 }).withMessage('Preparation time must be a positive integer'),
  body('calories').optional().isInt({ min: 0 }).withMessage('Calories must be a positive integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation failed for menu item creation:');
      console.log('Request body:', req.body);
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const pool = req.app.locals.db;
    const {
      name, description, price, category_id, image_url,
      is_available = true, is_featured = false, label,
      allergens, dietary_info, preparation_time, calories
    } = req.body;

    // Check if category exists
    const categoryCheck = await pool.query('SELECT id FROM menu_categories WHERE id = $1 AND is_active = true', [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const query = `
      INSERT INTO menu_items (
        name, description, price, category_id, image_url, is_available, 
        is_featured, label, allergens, dietary_info, preparation_time, calories,
        is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name, description, price, category_id, image_url, is_available,
      is_featured, label, allergens, dietary_info, preparation_time, calories
    ]);

    res.status(201).json({
      message: 'Menu item created successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update menu item (Admin only)
router.put('/items/:id', isAdmin, [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Item name cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_id').optional().isInt({ min: 1 }).withMessage('Valid category ID is required'),
  body('image_url').optional().custom((value) => {
    if (!value) return true;
    // Allow full URLs or relative paths starting with /uploads/
    if (value.startsWith('http') || value.startsWith('/uploads/')) {
      return true;
    }
    throw new Error('Image URL must be a valid URL or start with /uploads/');
  }),
  body('label').optional().trim().isLength({ max: 50 }).withMessage('Label must be 50 characters or less'),
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
    const updateFields = req.body;

    // Check if item exists
    const itemCheck = await pool.query('SELECT id FROM menu_items WHERE id = $1 AND is_active = true', [id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Build dynamic update query
    const setClause = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateFields).forEach(field => {
      if (updateFields[field] !== undefined) {
        paramCount++;
        setClause.push(`${field} = $${paramCount}`);
        values.push(updateFields[field]);
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    paramCount++;
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE menu_items 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Menu item updated successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete menu item (Admin only)
router.delete('/items/:id', isAdmin, async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const { id } = req.params;

    // Soft delete - set is_active to false
    const query = `
      UPDATE menu_items 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;