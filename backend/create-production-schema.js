const { Pool } = require('pg');

// Production database configuration
const pool = new Pool({
  user: 'bella_user',
  host: 'dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com',
  database: 'bella_vista_db_dwub',
  password: 'W6KwW991u2Pt8wfyrDsx6ZbpJU5LlxyM',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createProductionSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Creating production database schema...');
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID extension enabled');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        phone_number VARCHAR(20),
        role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        google_id VARCHAR(255) UNIQUE,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created');
    
    // Create indexes for users table
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    
    // Create user sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
          ALTER TABLE user_sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid);
        END IF;
      END
      $$
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions(expire)');
    console.log('User sessions table created');
    
    // Create menu categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON menu_categories(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(display_order)');
    console.log('Menu categories table created');
    
    // Create menu items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        category_id INTEGER REFERENCES menu_categories(id) ON DELETE SET NULL,
        image_url VARCHAR(500),
        is_available BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        label VARCHAR(50),
        allergens TEXT[],
        dietary_info TEXT[],
        preparation_time INTEGER,
        calories INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured)');
    console.log('Menu items table created');
    
    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
        tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
        delivery_fee DECIMAL(10, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
        final_total DECIMAL(10, 2) NOT NULL CHECK (final_total >= 0),
        order_type VARCHAR(20) DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
        delivery_address TEXT,
        phone_number VARCHAR(20),
        special_instructions TEXT,
        estimated_delivery_time TIMESTAMP,
        actual_delivery_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Orders table created');
    
    // Create order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
        total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Order items table created');
    
    // Create reservations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) NOT NULL,
        guest_phone VARCHAR(20) NOT NULL,
        party_size INTEGER NOT NULL CHECK (party_size > 0),
        reservation_date DATE NOT NULL,
        reservation_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Reservations table created');
    
    console.log('\nProduction database schema created successfully!');
    
    // Verify tables were created
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\nCreated tables:', tablesCheck.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('Error creating production schema:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createProductionSchema();