const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

// Use production database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'bella_user',
  host: process.env.DB_HOST || 'dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com',
  database: process.env.DB_NAME || 'bella_vista_db_dwub',
  password: process.env.DB_PASSWORD || 'W6KwW991u2Pt8wfyrDsx6ZbpJU5LlxyM',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function addMissingPaymentFields() {
  const client = await pool.connect();
  
  try {
    console.log('Checking and adding missing payment fields to production orders table...');
    
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
      console.log('Successfully added missing columns:', columnsToAdd);
    } else {
      console.log('All payment fields already exist in the orders table.');
    }
    
    // Verify the table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nCurrent orders table structure:');
    tableStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
    });
    
    console.log('\nPayment fields check completed successfully!');
    
  } catch (error) {
    console.error('Error adding payment fields:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addMissingPaymentFields()
  .then(() => {
    console.log('Production payment fields migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Production payment fields migration failed:', error);
    process.exit(1);
  });