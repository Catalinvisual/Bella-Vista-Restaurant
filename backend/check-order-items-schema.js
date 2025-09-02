const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Checking order_items table schema in production database...');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkOrderItemsSchema() {
  try {
    console.log('\nConnecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Get order_items table schema
    const schemaQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position
    `;
    
    const schemaResult = await client.query(schemaQuery);
    console.log('\n=== Order Items Table Schema ===');
    schemaResult.rows.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}) default: ${column.column_default || 'none'}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking order_items schema:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrderItemsSchema();