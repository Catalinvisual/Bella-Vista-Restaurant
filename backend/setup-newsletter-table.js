const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupNewsletterTable() {
  try {
    console.log('Setting up newsletter_subscribers table...');
    
    // Create newsletter_subscribers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at TIMESTAMP,
        source VARCHAR(50) DEFAULT 'website',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Newsletter subscribers table created');
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at)
    `);
    
    console.log('✓ Indexes created');
    
    // Create update trigger function if it doesn't exist
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_newsletter_subscribers_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // Create trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
      CREATE TRIGGER update_newsletter_subscribers_updated_at
          BEFORE UPDATE ON newsletter_subscribers
          FOR EACH ROW
          EXECUTE FUNCTION update_newsletter_subscribers_updated_at()
    `);
    
    console.log('✓ Update trigger created');
    
    // Check if table was created successfully
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'newsletter_subscribers' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n✓ Newsletter subscribers table schema:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n✅ Newsletter table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up newsletter table:', error);
  } finally {
    await pool.end();
  }
}

setupNewsletterTable();