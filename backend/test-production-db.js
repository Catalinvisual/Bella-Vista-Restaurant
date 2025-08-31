const { Pool } = require('pg');

// Production database configuration
const pool = new Pool({
  user: 'bella_vista_user',
  host: 'dpg-ctdqhf88fa8c73a6dn50-a.oregon-postgres.render.com',
  database: 'bella_vista_db',
  password: 'Ej4Ej8Ej4Ej8Ej4Ej8Ej4Ej8Ej4Ej8',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    console.log('Host:', 'dpg-ctdqhf88fa8c73a6dn50-a.oregon-postgres.render.com');
    console.log('Database:', 'bella_vista_db');
    console.log('User:', 'bella_vista_user');
    
    // Test connection
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('\n📋 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check menu_categories table
    try {
      const categoriesResult = await client.query('SELECT COUNT(*) FROM menu_categories');
      console.log(`\n📊 menu_categories: ${categoriesResult.rows[0].count} rows`);
      
      const categoriesSample = await client.query('SELECT * FROM menu_categories LIMIT 3');
      console.log('Sample categories:');
      categoriesSample.rows.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id})`);
      });
    } catch (err) {
      console.error('❌ Error querying menu_categories:', err.message);
    }
    
    // Check menu_items table
    try {
      const itemsResult = await client.query('SELECT COUNT(*) FROM menu_items');
      console.log(`\n📊 menu_items: ${itemsResult.rows[0].count} rows`);
      
      const itemsSample = await client.query('SELECT * FROM menu_items LIMIT 3');
      console.log('Sample items:');
      itemsSample.rows.forEach(item => {
        console.log(`  - ${item.name} (ID: ${item.id}, Price: $${item.price})`);
      });
    } catch (err) {
      console.error('❌ Error querying menu_items:', err.message);
    }
    
    // Test the exact query from the API
    try {
      console.log('\n🔍 Testing API query...');
      const apiQuery = `
        SELECT id, name, description, display_order, is_active, created_at, updated_at
        FROM menu_categories 
        WHERE is_active = true 
        ORDER BY display_order ASC, name ASC
      `;
      
      const apiResult = await client.query(apiQuery);
      console.log(`✓ API query successful: ${apiResult.rows.length} categories found`);
      apiResult.rows.forEach(cat => {
        console.log(`  - ${cat.name} (Active: ${cat.is_active})`);
      });
    } catch (err) {
      console.error('❌ API query failed:', err.message);
    }
    
    client.release();
    console.log('\n✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();