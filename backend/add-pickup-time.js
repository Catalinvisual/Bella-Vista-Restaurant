const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addPickupTimeColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding pickup_time column to orders table...');
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'pickup_time'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('pickup_time column already exists');
      return;
    }
    
    // Add pickup_time column
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN pickup_time TIMESTAMP
    `);
    
    console.log('Successfully added pickup_time column to orders table');
    
  } catch (error) {
    console.error('Error adding pickup_time column:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addPickupTimeColumn();