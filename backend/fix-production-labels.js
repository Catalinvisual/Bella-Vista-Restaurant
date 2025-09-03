const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixProductionLabels() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to production database to fix label values...');
    
    // Get all menu items with their categories
    const items = await client.query(`
      SELECT mi.id, mi.name, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      ORDER BY mi.id
    `);
    
    console.log('Found menu items:', items.rows.length);
    
    // Update each item with appropriate label based on category
    for (const item of items.rows) {
      let label = '';
      
      // Assign labels based on category and item characteristics
      switch (item.category_name) {
        case 'Appetizers':
          label = 'starter';
          break;
        case 'Main Courses':
          if (item.name.toLowerCase().includes('vegetarian')) {
            label = 'vegetarian';
          } else if (item.name.toLowerCase().includes('salmon') || item.name.toLowerCase().includes('fish')) {
            label = 'seafood';
          } else if (item.name.toLowerCase().includes('beef') || item.name.toLowerCase().includes('meat')) {
            label = 'meat';
          } else {
            label = 'main';
          }
          break;
        case 'Desserts':
          label = 'sweet';
          break;
        case 'Beverages':
          if (item.name.toLowerCase().includes('beer') || item.name.toLowerCase().includes('wine')) {
            label = 'alcoholic';
          } else {
            label = 'beverage';
          }
          break;
        case 'Salads':
          label = 'healthy';
          break;
        default:
          label = 'special';
      }
      
      // Update the item with the new label
      await client.query(
        'UPDATE menu_items SET label = $1 WHERE id = $2',
        [label, item.id]
      );
      
      console.log(`Updated ${item.name} with label: ${label}`);
    }
    
    // Verify the updates
    const updatedItems = await client.query(`
      SELECT id, name, label, category_id
      FROM menu_items
      ORDER BY id
    `);
    
    console.log('\nUpdated menu items with labels:');
    updatedItems.rows.forEach(item => {
      console.log(`- ${item.name}: ${item.label}`);
    });
    
    console.log('\n✅ Production label fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing production labels:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixProductionLabels();