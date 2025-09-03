const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  user: 'bella_user',
  host: 'dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com',
  database: 'bella_vista_db_dwub',
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkProductionSchema() {
  try {
    console.log('Checking production database schema...');
    
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
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\nReservations table schema:');
      schema.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });
      
      // Count reservations
      const count = await pool.query('SELECT COUNT(*) as count FROM reservations');
      console.log(`\nTotal reservations: ${count.rows[0].count}`);
      
      // Get sample reservations if any exist
      if (parseInt(count.rows[0].count) > 0) {
        const reservations = await pool.query('SELECT * FROM reservations LIMIT 3');
        console.log('\nSample reservations:');
        reservations.rows.forEach(reservation => {
          console.log(reservation);
        });
      }
    }
    
    // Also check users table schema for comparison
    const usersSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nUsers table schema for comparison:');
    usersSchema.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error checking production schema:', error);
  } finally {
    await pool.end();
  }
}

checkProductionSchema();