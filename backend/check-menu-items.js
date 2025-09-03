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

async function checkMenuItems() {
  try {
    console.log('Connecting to production database...');
    
    // Check if menu_items table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items'
      );
    `);
    
    console.log('Menu items table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get table schema
      const schemaQuery = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'menu_items'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nMenu items table schema:');
      schemaQuery.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Count total menu items
      const countResult = await pool.query('SELECT COUNT(*) FROM menu_items');
      console.log(`\nTotal menu items: ${countResult.rows[0].count}`);
      
      // Get sample menu items
      const sampleResult = await pool.query(`
        SELECT * FROM menu_items
        ORDER BY id 
        LIMIT 5
      `);
      
      console.log('\nSample menu items:');
      sampleResult.rows.forEach(item => {
        console.log(`- ID: ${item.id}, Name: ${item.name}, Price: $${item.price}, Category ID: ${item.category_id}, Available: ${item.is_available}`);
      });
      
      // Check if categories table exists
      const categoriesTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'categories'
        );
      `);
      
      console.log('\nCategories table exists:', categoriesTableCheck.rows[0].exists);
      
      if (categoriesTableCheck.rows[0].exists) {
        const categoriesResult = await pool.query('SELECT * FROM categories ORDER BY id');
        console.log('Categories:');
        categoriesResult.rows.forEach(cat => {
          console.log(`- ID: ${cat.id}, Name: ${cat.name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking menu items:', error.message);
  } finally {
    await pool.end();
  }
}

checkMenuItems();