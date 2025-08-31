const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateGreekSaladImage() {
  const client = await pool.connect();
  
  try {
    console.log('Updating Greek Salad with image URL...');
    
    const greekSaladImageUrl = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop';
    
    const result = await client.query(
      'UPDATE menu_items SET image_url = $1 WHERE name = $2 AND image_url IS NULL',
      [greekSaladImageUrl, 'Greek Salad']
    );
    
    console.log(`Updated Greek Salad: ${result.rowCount} rows affected`);
    
    // Verify the update
    const updatedItem = await client.query(
      'SELECT name, image_url FROM menu_items WHERE name = $1',
      ['Greek Salad']
    );
    
    if (updatedItem.rows.length > 0) {
      console.log('\nGreek Salad updated successfully:');
      console.log(`- Name: ${updatedItem.rows[0].name}`);
      console.log(`- Image URL: ${updatedItem.rows[0].image_url}`);
    }
    
    console.log('\n✅ Greek Salad image updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating Greek Salad image:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateGreekSaladImage();