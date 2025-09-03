const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Testing production database connection with SSL...');
console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Use the same configuration as server.js
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
}) : new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  try {
    console.log('Attempting to connect to production database...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to production database!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database query successful:');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    
    // Test if admin user exists
    const adminCheck = await client.query('SELECT id, email, role FROM users WHERE role = $1 LIMIT 1', ['admin']);
    if (adminCheck.rows.length > 0) {
      console.log('✅ Admin user found:', adminCheck.rows[0]);
    } else {
      console.log('⚠️  No admin user found in production database');
    }
    
    // Test menu items count
    const menuCount = await client.query('SELECT COUNT(*) as count FROM menu_items');
    console.log('✅ Menu items in database:', menuCount.rows[0].count);
    
    client.release();
    console.log('\n🎉 Production database connection test completed successfully!');
  } catch (error) {
    console.error('❌ Production database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 This might be a network connectivity issue.');
    } else if (error.message.includes('SSL')) {
      console.error('\n💡 This is an SSL configuration issue.');
    }
  } finally {
    await pool.end();
  }
}

testConnection();