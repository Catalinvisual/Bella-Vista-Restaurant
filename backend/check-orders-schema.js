const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Checking orders table schema in production database...');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkOrdersSchema() {
  try {
    console.log('\nConnecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Get orders table schema
    const schemaQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `;
    
    const schemaResult = await client.query(schemaQuery);
    console.log('\n=== Orders Table Schema ===');
    schemaResult.rows.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}) default: ${column.column_default || 'none'}`);
    });
    
    // Check a sample order
    const sampleQuery = 'SELECT * FROM orders LIMIT 1';
    const sampleResult = await client.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('\n=== Sample Order ===');
      const order = sampleResult.rows[0];
      Object.keys(order).forEach(key => {
        console.log(`${key}: ${order[key]}`);
      });
    } else {
      console.log('\n=== No orders found ===');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking orders schema:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrdersSchema();