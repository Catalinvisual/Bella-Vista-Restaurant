const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateMenuImages() {
  const client = await pool.connect();
  
  try {
    console.log('Updating menu items with image URLs...');
    
    // Define image URLs for each menu item
    const imageUpdates = [
      { name: 'Caesar Salad', url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop' },
      { name: 'Bruschetta', url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop' },
      { name: 'Grilled Salmon', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop' },
      { name: 'Beef Tenderloin', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
      { name: 'Vegetarian Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop' },
      { name: 'Chocolate Lava Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop' },
      { name: 'Tiramisu', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop' },
      { name: 'Fresh Orange Juice', url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop' },
      { name: 'Craft Beer', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop' },
      { name: 'Garden Salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop' }
    ];
    
    // Update each menu item with its image URL
    for (const item of imageUpdates) {
      const result = await client.query(
        'UPDATE menu_items SET image_url = $1 WHERE name = $2 AND image_url IS NULL',
        [item.url, item.name]
      );
      console.log(`Updated ${item.name}: ${result.rowCount} rows affected`);
    }
    
    // Verify the updates
    const updatedItems = await client.query(
      'SELECT name, image_url FROM menu_items WHERE image_url IS NOT NULL ORDER BY name'
    );
    
    console.log('\nUpdated menu items with images:');
    updatedItems.rows.forEach(item => {
      console.log(`- ${item.name}: ${item.image_url}`);
    });
    
    console.log('\n✅ Menu images updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating menu images:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateMenuImages();