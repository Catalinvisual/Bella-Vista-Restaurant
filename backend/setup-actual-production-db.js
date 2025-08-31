const { Pool } = require('pg');

// Actual production database configuration from Render
const pool = new Pool({
  user: 'bella_user',
  host: 'dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com',
  database: 'bella_vista_db_dwub',
  password: process.env.DB_PASSWORD, // This will be set in Render
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('Setting up actual production database...');
    
    const client = await pool.connect();
    console.log('✓ Connected to production database');
    
    // Create tables
    console.log('Creating database schema...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'customer',
        google_id VARCHAR(255) UNIQUE,
        is_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create user_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    
    // Add primary key constraint if it doesn't exist
    try {
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
            ALTER TABLE user_sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid);
          END IF;
        END $$
      `);
    } catch (err) {
      console.log('Primary key constraint already exists or error:', err.message);
    }
    
    // Create index on expire column
    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON user_sessions (expire)
    `);
    
    // Create menu_categories table
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
    
    // Create menu_items table
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
    
    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_name VARCHAR(200),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        order_type VARCHAR(20) DEFAULT 'delivery',
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        stripe_payment_intent_id VARCHAR(255),
        delivery_address TEXT,
        pickup_time TIMESTAMP,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create order_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create reservations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_name VARCHAR(200) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        party_size INTEGER NOT NULL,
        reservation_date DATE NOT NULL,
        reservation_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Database schema created successfully');
    
    // Check if data already exists
    const categoriesCount = await client.query('SELECT COUNT(*) FROM menu_categories');
    const itemsCount = await client.query('SELECT COUNT(*) FROM menu_items');
    
    if (categoriesCount.rows[0].count === '0') {
      console.log('Inserting sample data...');
      
      // Insert menu categories
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
      
      console.log('✓ Sample data inserted successfully');
    } else {
      console.log('✓ Data already exists, skipping insertion');
    }
    
    // Verify data
    const finalCategoriesCount = await client.query('SELECT COUNT(*) FROM menu_categories');
    const finalItemsCount = await client.query('SELECT COUNT(*) FROM menu_items');
    const featuredCount = await client.query('SELECT COUNT(*) FROM menu_items WHERE is_featured = true');
    
    console.log(`\n📊 Database Summary:`);
    console.log(`- Categories: ${finalCategoriesCount.rows[0].count}`);
    console.log(`- Menu Items: ${finalItemsCount.rows[0].count}`);
    console.log(`- Featured Items: ${featuredCount.rows[0].count}`);
    
    client.release();
    console.log('\n✅ Production database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();