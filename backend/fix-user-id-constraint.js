const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bella_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function fixUserIdConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('Checking orders table user_id constraint...');
    
    // Check current constraint
    const constraintCheck = await client.query(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.table_name = 'orders' 
        AND kcu.column_name = 'user_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    console.log('Current user_id constraints:', constraintCheck.rows);
    
    // Check if user_id column allows NULL
    const columnCheck = await client.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_id'
    `);
    
    console.log('Current user_id column info:', columnCheck.rows);
    
    if (columnCheck.rows.length > 0 && columnCheck.rows[0].is_nullable === 'NO') {
      console.log('\nFixing user_id constraint to allow NULL values...');
      
      // Drop existing foreign key constraint
      if (constraintCheck.rows.length > 0) {
        const constraintName = constraintCheck.rows[0].constraint_name;
        console.log(`Dropping constraint: ${constraintName}`);
        await client.query(`ALTER TABLE orders DROP CONSTRAINT ${constraintName}`);
      }
      
      // Modify column to allow NULL
      console.log('Modifying user_id column to allow NULL...');
      await client.query(`ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL`);
      
      // Re-add foreign key constraint with ON DELETE SET NULL
      console.log('Adding new foreign key constraint with ON DELETE SET NULL...');
      await client.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
      `);
      
      console.log('✓ Successfully updated user_id constraint to allow NULL values');
    } else {
      console.log('✓ user_id column already allows NULL values');
    }
    
    // Verify the changes
    const verifyCheck = await client.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_id'
    `);
    
    console.log('\nVerification - user_id column info after changes:', verifyCheck.rows);
    
  } catch (error) {
    console.error('Error fixing user_id constraint:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixUserIdConstraint()
  .then(() => {
    console.log('\nDatabase constraint fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database constraint fix failed:', error);
    process.exit(1);
  });