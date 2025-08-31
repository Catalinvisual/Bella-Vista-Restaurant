const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function addCustomerFields() {
  const client = await pool.connect();
  
  try {
    console.log('Adding customer fields to orders table...');
    
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('customer_email', 'customer_name', 'customer_phone')
    `;
    
    const existingColumns = await client.query(checkQuery);
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    
    const columnsToAdd = [];
    if (!existingColumnNames.includes('customer_email')) {
      columnsToAdd.push('ADD COLUMN customer_email VARCHAR(255)');
    }
    if (!existingColumnNames.includes('customer_name')) {
      columnsToAdd.push('ADD COLUMN customer_name VARCHAR(255)');
    }
    if (!existingColumnNames.includes('customer_phone')) {
      columnsToAdd.push('ADD COLUMN customer_phone VARCHAR(20)');
    }
    
    if (columnsToAdd.length > 0) {
      const alterQuery = `ALTER TABLE orders ${columnsToAdd.join(', ')}`;
      await client.query(alterQuery);
      console.log(`Successfully added columns: ${columnsToAdd.join(', ')}`);
    } else {
      console.log('All customer fields already exist in orders table');
    }
    
  } catch (error) {
    console.error('Error adding customer fields:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addCustomerFields();