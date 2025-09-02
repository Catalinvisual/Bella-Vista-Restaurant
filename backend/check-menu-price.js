const { Pool } = require('pg');

const pool = new Pool({
  user: 'bella_user',
  host: 'dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com',
  database: 'bella_vista_db_dwub',
  password: 'W6KwW991u2Pt8wfyrDsx6ZbpJU5LlxyM',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkMenuPrice() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT id, name, price FROM menu_items WHERE id = 1');
    console.log('Menu item 1:', result.rows[0]);
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkMenuPrice();