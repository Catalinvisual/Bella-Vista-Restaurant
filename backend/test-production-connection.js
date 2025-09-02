const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Testing production database connection...');
console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
console.log('NODE_ENV:', process.env.NODE_ENV);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('\nAttempting database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Basic query successful:', result.rows[0]);
    
    // Test menu items table
    const menuResult = await client.query('SELECT COUNT(*) as count FROM menu_items');
    console.log('✅ Menu items count:', menuResult.rows[0].count);
    
    // Test orders table structure
    const ordersResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);
    console.log('✅ Orders table structure:');
    ordersResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('Host not found - check DB_HOST');
    } else if (error.code === '28P01') {
      console.error('Authentication failed - check DB_USER/DB_PASSWORD');
    } else if (error.code === '3D000') {
      console.error('Database does not exist - check DB_NAME');
    }
  } finally {
    await pool.end();
  }
}

testConnection();