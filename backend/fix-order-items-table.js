const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixOrderItemsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Checking and fixing order_items table structure...');
    
    // Check current order_items table structure
    const checkColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `);
    
    console.log('Current order_items columns:');
    checkColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    // Add menu_item_id column if missing
    if (!existingColumns.includes('menu_item_id')) {
      console.log('\nAdding missing menu_item_id column...');
      await client.query(`
        ALTER TABLE order_items 
        ADD COLUMN menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE
      `);
      console.log('✓ Added menu_item_id column');
    } else {
      console.log('✓ menu_item_id column already exists');
    }
    
    // Check if we need to rename price/total columns to match the code
    if (existingColumns.includes('unit_price') && !existingColumns.includes('price')) {
      console.log('\nRenaming unit_price to price...');
      await client.query('ALTER TABLE order_items RENAME COLUMN unit_price TO price');
      console.log('✓ Renamed unit_price to price');
    }
    
    if (existingColumns.includes('total_price') && !existingColumns.includes('total')) {
      console.log('\nRenaming total_price to total...');
      await client.query('ALTER TABLE order_items RENAME COLUMN total_price TO total');
      console.log('✓ Renamed total_price to total');
    }
    
    // Verify final table structure
    const finalStructure = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nFinal order_items table structure:');
    finalStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
    });
    
    console.log('\nOrder items table fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing order_items table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
fixOrderItemsTable()
  .then(() => {
    console.log('Order items table fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Order items table fix failed:', error);
    process.exit(1);
  });