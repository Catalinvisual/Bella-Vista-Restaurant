const express = require('express');
const cors = require('cors');
// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

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
    
    const pool = new Pool(
      process.env.DATABASE_URL ? 
        { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 } :
        {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000
        }
    );
    
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

// Check existing tables
app.get('/api/debug/tables', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool(
      process.env.DATABASE_URL ? 
        { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } } :
        {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
          ssl: { rejectUnauthorized: false }
        }
    );
    
    const client = await pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    client.release();
    await pool.end();
    
    res.json({ 
      tables: result.rows.map(row => row.table_name)
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tables',
      details: error.message
    });
  }
});

// Setup complete database schema endpoint
app.post('/api/debug/setup-complete-db', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool(
      process.env.DATABASE_URL ? 
        { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } } :
        {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
          ssl: { rejectUnauthorized: false }
        }
    );
    
    const client = await pool.connect();
    
    // Create all required tables
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // User sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      
      ALTER TABLE user_sessions ADD CONSTRAINT IF NOT EXISTS session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON user_sessions (expire);
    `);
    
    // Menu categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Menu items table
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
        allergens TEXT[],
        dietary_info TEXT[],
        preparation_time INTEGER,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        stripe_payment_intent_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        delivery_address TEXT,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Reservations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        party_size INTEGER NOT NULL,
        reservation_date DATE NOT NULL,
        reservation_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    client.release();
    await pool.end();
    
    res.json({ 
      message: 'Complete database schema setup completed successfully'
    });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ 
      error: 'Database setup failed',
      details: error.message
    });
  }
});

// Setup database schema endpoint
app.post('/api/debug/setup-db', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool(
      process.env.DATABASE_URL ? 
        { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } } :
        {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
          ssl: { rejectUnauthorized: false }
        }
    );
    
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