const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Checking guest user in production database...');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkGuestUser() {
  try {
    console.log('\nConnecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Check for guest user
    const guestQuery = `
      SELECT id, full_name, email, role 
      FROM users 
      WHERE email = 'guest@bellavista.com' OR id = 9
      ORDER BY id
    `;
    
    const guestResult = await client.query(guestQuery);
    console.log('\n=== Guest User Check ===');
    if (guestResult.rows.length > 0) {
      guestResult.rows.forEach(user => {
        console.log(`✅ User ID ${user.id}: ${user.full_name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log('❌ No guest user found');
    }
    
    // Check all users
    const allUsersQuery = `
      SELECT id, full_name, email, role, created_at 
      FROM users 
      ORDER BY id
      LIMIT 10
    `;
    
    const allUsersResult = await client.query(allUsersQuery);
    console.log('\n=== All Users (first 10) ===');
    allUsersResult.rows.forEach(user => {
      console.log(`ID ${user.id}: ${user.full_name} (${user.email}) - Role: ${user.role} - Created: ${user.created_at}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking guest user:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  } finally {
    await pool.end();
  }
}

checkGuestUser();