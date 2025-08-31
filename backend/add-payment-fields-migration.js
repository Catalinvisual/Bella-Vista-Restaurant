const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addPaymentFields() {
  const client = await pool.connect();
  
  try {
    console.log('Starting payment fields migration...');
    
    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('payment_method', 'payment_status')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    // Add payment_method column if it doesn't exist
    if (!existingColumns.includes('payment_method')) {
      await client.query(`
        ALTER TABLE orders 
        ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash_on_delivery'
      `);
      console.log('✓ Added payment_method column');
    } else {
      console.log('✓ payment_method column already exists');
    }
    
    // Add payment_status column if it doesn't exist
    if (!existingColumns.includes('payment_status')) {
      await client.query(`
        ALTER TABLE orders 
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending'
      `);
      console.log('✓ Added payment_status column');
    } else {
      console.log('✓ payment_status column already exists');
    }
    
    // Add payment_intent_id column if it doesn't exist (for Stripe payments)
    if (!existingColumns.includes('payment_intent_id')) {
      await client.query(`
        ALTER TABLE orders 
        ADD COLUMN payment_intent_id VARCHAR(255)
      `);
      console.log('✓ Added payment_intent_id column');
    } else {
      console.log('✓ payment_intent_id column already exists');
    }
    
    // Update existing orders to have proper payment fields
    await client.query(`
      UPDATE orders 
      SET payment_method = 'cash_on_delivery', 
          payment_status = 'pending'
      WHERE payment_method IS NULL
    `);
    console.log('✓ Updated existing orders with payment fields');
    
    console.log('\nPayment fields migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  addPaymentFields()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addPaymentFields };