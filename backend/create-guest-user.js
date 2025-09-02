const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Creating guest user for production database...');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function createGuestUser() {
  try {
    console.log('\nConnecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Check if guest user already exists
    const checkQuery = `
      SELECT id, full_name, email, role 
      FROM users 
      WHERE email = 'guest@bellavista.com'
      LIMIT 1
    `;
    
    const existingUser = await client.query(checkQuery);
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Guest user already exists:', existingUser.rows[0]);
      client.release();
      return existingUser.rows[0].id;
    }
    
    // Create guest user with customer role
    const insertQuery = `
      INSERT INTO users (
        full_name, email, role, is_active, email_verified, 
        created_at, updated_at
      )
      VALUES (
        'Guest User', 'guest@bellavista.com', 'customer', true, true,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id, full_name, email, role
    `;
    
    const result = await client.query(insertQuery);
    console.log('✅ Guest user created successfully:', result.rows[0]);
    
    client.release();
    return result.rows[0].id;
    
  } catch (error) {
    console.error('❌ Error creating guest user:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === '23505') {
      console.log('Guest user already exists (unique constraint violation)');
    }
  } finally {
    await pool.end();
  }
}

createGuestUser();