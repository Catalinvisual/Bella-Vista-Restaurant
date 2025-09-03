const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createCategoriesTable() {
  try {
    console.log('Connecting to production database...');
    
    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Categories table created successfully!');
    
    // Insert default categories based on the category_ids in menu_items
    const categoryData = [
      { id: 1, name: 'Appetizers', description: 'Start your meal with our delicious appetizers', display_order: 1 },
      { id: 2, name: 'Main Courses', description: 'Our signature main dishes', display_order: 2 },
      { id: 3, name: 'Desserts', description: 'Sweet endings to your meal', display_order: 3 },
      { id: 4, name: 'Beverages', description: 'Refreshing drinks and beverages', display_order: 4 },
      { id: 5, name: 'Salads', description: 'Fresh and healthy salad options', display_order: 5 }
    ];
    
    for (const category of categoryData) {
      await pool.query(`
        INSERT INTO menu_categories (id, name, description, display_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          display_order = EXCLUDED.display_order,
          updated_at = CURRENT_TIMESTAMP
      `, [category.id, category.name, category.description, category.display_order]);
    }
    
    console.log('Default categories inserted successfully!');
    
    // Verify the categories
    const result = await pool.query('SELECT * FROM menu_categories ORDER BY display_order');
    console.log('\nCreated categories:');
    result.rows.forEach(cat => {
      console.log(`- ID: ${cat.id}, Name: ${cat.name}, Order: ${cat.display_order}`);
    });
    
  } catch (error) {
    console.error('Error creating categories table:', error.message);
  } finally {
    await pool.end();
  }
}

createCategoriesTable();