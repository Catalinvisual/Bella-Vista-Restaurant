const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'restaurant_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const createReservationsTable = async () => {
  try {
    console.log('Creating reservations table...');
    
    // Create reservations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          guests INTEGER NOT NULL CHECK (guests > 0 AND guests <= 20),
          reservation_date DATE NOT NULL,
          reservation_time TIME NOT NULL,
          special_requests TEXT,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Reservations table created successfully!');
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reservations_datetime ON reservations(reservation_date, reservation_time)');
    
    console.log('Indexes created successfully!');
    
    // Create trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_reservations_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // Create trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
      CREATE TRIGGER update_reservations_updated_at
          BEFORE UPDATE ON reservations
          FOR EACH ROW
          EXECUTE FUNCTION update_reservations_updated_at()
    `);
    
    console.log('Trigger created successfully!');
    console.log('Reservations table setup completed!');
    
  } catch (error) {
    console.error('Error creating reservations table:', error);
  } finally {
    await pool.end();
  }
};

createReservationsTable();