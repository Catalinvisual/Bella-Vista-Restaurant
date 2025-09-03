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

async function addTestReservations() {
  try {
    console.log('Adding test reservations to production database...');
    
    // Check current reservations count
    const countBefore = await pool.query('SELECT COUNT(*) as count FROM reservations');
    console.log(`Current reservations count: ${countBefore.rows[0].count}`);
    
    // Add test reservations
    const testReservations = [
      {
        guest_name: 'John Smith',
        guest_email: 'john.smith@email.com',
        guest_phone: '+1-555-0101',
        party_size: 4,
        reservation_date: '2024-01-25',
        reservation_time: '19:00:00',
        status: 'confirmed',
        special_requests: 'Window table preferred'
      },
      {
        guest_name: 'Maria Garcia',
        guest_email: 'maria.garcia@email.com',
        guest_phone: '+1-555-0102',
        party_size: 2,
        reservation_date: '2024-01-26',
        reservation_time: '20:30:00',
        status: 'pending',
        special_requests: 'Anniversary dinner'
      },
      {
        guest_name: 'David Johnson',
        guest_email: 'david.johnson@email.com',
        guest_phone: '+1-555-0103',
        party_size: 6,
        reservation_date: '2024-01-27',
        reservation_time: '18:00:00',
        status: 'confirmed',
        special_requests: 'Business dinner'
      }
    ];
    
    for (const reservation of testReservations) {
      await pool.query(`
        INSERT INTO reservations (
          guest_name, guest_email, guest_phone, party_size,
          reservation_date, reservation_time, status, special_requests
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        reservation.guest_name,
        reservation.guest_email,
        reservation.guest_phone,
        reservation.party_size,
        reservation.reservation_date,
        reservation.reservation_time,
        reservation.status,
        reservation.special_requests
      ]);
      
      console.log(`Added reservation for ${reservation.guest_name}`);
    }
    
    // Check final count
    const countAfter = await pool.query('SELECT COUNT(*) as count FROM reservations');
    console.log(`Final reservations count: ${countAfter.rows[0].count}`);
    
    // Show sample reservations
    const sample = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC LIMIT 5');
    console.log('\nRecent reservations:');
    sample.rows.forEach(reservation => {
      console.log(`- ${reservation.customer_name} (${reservation.party_size} guests) - ${reservation.reservation_date} ${reservation.reservation_time} - ${reservation.status}`);
    });
    
  } catch (error) {
    console.error('Error adding test reservations:', error);
  } finally {
    await pool.end();
  }
}

addTestReservations();