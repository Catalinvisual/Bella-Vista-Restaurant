const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to check environment variables
app.get('/api/debug/env', (req, res) => {
  res.json({
    DB_HOST: process.env.DB_HOST || 'not set',
    DB_NAME: process.env.DB_NAME || 'not set',
    DB_USER: process.env.DB_USER || 'not set',
    DB_PORT: process.env.DB_PORT || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set'
  });
});

// Test database connection endpoint
app.get('/api/debug/db-test', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    
    res.json({
      status: 'success',
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      code: error.code
    });
  }
});

// Setup database schema endpoint
app.post('/api/debug/setup-db', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    const client = await pool.connect();
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES menu_categories(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        is_available BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        label VARCHAR(50),
        allergens TEXT[],
        dietary_info TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if data exists
    const categoriesCount = await client.query('SELECT COUNT(*) FROM menu_categories');
    
    if (categoriesCount.rows[0].count === '0') {
      // Insert categories
      const categories = [
        { name: 'Appetizers', description: 'Start your meal with our delicious appetizers', display_order: 1 },
        { name: 'Main Courses', description: 'Our signature main dishes', display_order: 2 },
        { name: 'Pasta', description: 'Fresh homemade pasta dishes', display_order: 3 },
        { name: 'Desserts', description: 'Sweet endings to your meal', display_order: 4 },
        { name: 'Beverages', description: 'Refreshing drinks and beverages', display_order: 5 }
      ];
      
      for (const category of categories) {
        await client.query(
          'INSERT INTO menu_categories (name, description, display_order) VALUES ($1, $2, $3)',
          [category.name, category.description, category.display_order]
        );
      }
      
      // Insert menu items
      const menuItems = [
        { category_id: 1, name: 'Bruschetta', description: 'Toasted bread with fresh tomatoes and basil', price: 8.99, is_featured: true },
        { category_id: 1, name: 'Calamari Fritti', description: 'Crispy fried squid with marinara sauce', price: 12.99, is_featured: false },
        { category_id: 2, name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with lemon herb butter', price: 24.99, is_featured: true },
        { category_id: 2, name: 'Chicken Parmigiana', description: 'Breaded chicken breast with marinara and mozzarella', price: 19.99, is_featured: false },
        { category_id: 3, name: 'Spaghetti Carbonara', description: 'Classic pasta with eggs, cheese, and pancetta', price: 16.99, is_featured: true },
        { category_id: 3, name: 'Fettuccine Alfredo', description: 'Rich and creamy pasta with parmesan cheese', price: 15.99, is_featured: false },
        { category_id: 4, name: 'Tiramisu', description: 'Classic Italian dessert with coffee and mascarpone', price: 7.99, is_featured: true },
        { category_id: 4, name: 'Panna Cotta', description: 'Silky smooth vanilla custard with berry sauce', price: 6.99, is_featured: false },
        { category_id: 5, name: 'Italian Wine', description: 'Selection of fine Italian wines', price: 8.99, is_featured: false },
        { category_id: 5, name: 'Espresso', description: 'Rich and bold Italian coffee', price: 3.99, is_featured: false }
      ];
      
      for (const item of menuItems) {
        await client.query(
          'INSERT INTO menu_items (category_id, name, description, price, is_featured) VALUES ($1, $2, $3, $4, $5)',
          [item.category_id, item.name, item.description, item.price, item.is_featured]
        );
      }
    }
    
    // Get final counts
    const finalCategoriesCount = await client.query('SELECT COUNT(*) FROM menu_categories');
    const finalItemsCount = await client.query('SELECT COUNT(*) FROM menu_items');
    const featuredCount = await client.query('SELECT COUNT(*) FROM menu_items WHERE is_featured = true');
    
    client.release();
    await pool.end();
    
    res.json({
      status: 'success',
      message: 'Database setup completed',
      data: {
        categories: finalCategoriesCount.rows[0].count,
        items: finalItemsCount.rows[0].count,
        featured: featuredCount.rows[0].count
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database setup failed',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log('Environment variables:');
  console.log('- DB_HOST:', process.env.DB_HOST || 'not set');
  console.log('- DB_NAME:', process.env.DB_NAME || 'not set');
  console.log('- DB_USER:', process.env.DB_USER || 'not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
});