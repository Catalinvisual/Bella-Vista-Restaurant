const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkReservations() {
  try {
    console.log('Checking reservations in local database...');
    
    // Check if reservations table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations'
      );
    `);
    
    console.log('Reservations table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Check table schema
      const schema = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable schema:');
      schema.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type}`);
      });
      
      // Count reservations
      const count = await pool.query('SELECT COUNT(*) as count FROM reservations');
      console.log(`\nTotal reservations: ${count.rows[0].count}`);
      
      // Get sample reservations
      const reservations = await pool.query('SELECT * FROM reservations LIMIT 5');
      console.log('\nSample reservations:');
      reservations.rows.forEach(reservation => {
        console.log(reservation);
      });
    }
    
  } catch (error) {
    console.error('Error checking reservations:', error);
  } finally {
    await pool.end();
  }
}

checkReservations();