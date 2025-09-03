const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAdmin() {
  try {
    const result = await pool.query("SELECT id, email, role FROM users WHERE role = 'admin'");
    console.log('Admin users:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('No admin users found. Creating one...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const insertResult = await pool.query(
        `INSERT INTO users (full_name, email, password, role, is_active, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, email, role`,
        ['Admin User', 'admin@bellavista.com', hashedPassword, 'admin']
      );
      
      console.log('Admin user created:', insertResult.rows[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkAdmin();