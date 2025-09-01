const { Pool } = require('pg');
require('dotenv').config();

// Use the same database configuration as the main app
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addMissingPaymentFields() {
  const client = await pool.connect();
  
  try {
    console.log('Checking and adding missing payment fields to orders table...');
    
    // Check which columns exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('payment_method', 'payment_status', 'payment_intent_id', 'pickup_time')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('Existing columns:', existingColumns);
    
    // Add missing columns
    const columnsToAdd = [];
    
    if (!existingColumns.includes('payment_method')) {
      columnsToAdd.push('ADD COLUMN payment_method VARCHAR(50) DEFAULT \'cash_on_delivery\'');
    }
    
    if (!existingColumns.includes('payment_status')) {
      columnsToAdd.push('ADD COLUMN payment_status VARCHAR(50) DEFAULT \'pending\'');
    }
    
    if (!existingColumns.includes('payment_intent_id')) {
      columnsToAdd.push('ADD COLUMN payment_intent_id VARCHAR(255)');
    }
    
    if (!existingColumns.includes('pickup_time')) {
      columnsToAdd.push('ADD COLUMN pickup_time TIMESTAMP');
    }
    
    if (columnsToAdd.length > 0) {
      const alterQuery = `ALTER TABLE orders ${columnsToAdd.join(', ')}`;
      console.log('Executing:', alterQuery);
      await client.query(alterQuery);
      console.log('✓ Successfully added missing columns');
    } else {
      console.log('✓ All required columns already exist');
    }
    
    // Also check order_items table structure
    const checkOrderItems = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
    `);
    
    console.log('Order items columns:', checkOrderItems.rows.map(row => row.column_name));
    
    console.log('\nPayment fields check completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingPaymentFields().catch(console.error);