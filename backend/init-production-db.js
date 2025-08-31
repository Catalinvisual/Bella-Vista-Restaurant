const { Pool } = require('pg');

// Production database configuration
const pool = new Pool({
  user: 'bella_user',
  host: 'dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com',
  database: 'bella_vista_db_dwub',
  password: 'W6KwW991u2Pt8wfyrDsx6ZbpJU5LlxyM',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeProductionDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to production database...');
    
    // First, let's check if tables exist
    try {
      const tablesCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('menu_categories', 'menu_items', 'users')
      `);
      console.log('Existing tables:', tablesCheck.rows.map(row => row.table_name));
    } catch (error) {
      console.log('Error checking tables:', error.message);
    }
    
    // Check if data already exists
    try {
      const categoriesCheck = await client.query('SELECT COUNT(*) FROM menu_categories');
      const itemsCheck = await client.query('SELECT COUNT(*) FROM menu_items');
      
      console.log(`Current categories: ${categoriesCheck.rows[0].count}`);
      console.log(`Current menu items: ${itemsCheck.rows[0].count}`);
      
      if (parseInt(categoriesCheck.rows[0].count) === 0) {
        console.log('Inserting menu categories...');
        await client.query(`
          INSERT INTO menu_categories (name, description, display_order) VALUES
          ('Appetizers', 'Start your meal with our delicious appetizers', 1),
          ('Main Courses', 'Our signature main dishes', 2),
          ('Desserts', 'Sweet endings to your perfect meal', 3),
          ('Beverages', 'Refreshing drinks and beverages', 4),
          ('Salads', 'Fresh and healthy salad options', 5)
        `);
        console.log('Menu categories inserted successfully!');
      }
      
      if (parseInt(itemsCheck.rows[0].count) === 0) {
        console.log('Inserting menu items...');
        await client.query(`
          INSERT INTO menu_items (name, description, price, category_id, is_featured, is_available, preparation_time, calories) VALUES
          ('Caesar Salad', 'Fresh romaine lettuce with parmesan cheese, croutons, and our signature Caesar dressing', 12.99, 1, true, true, 10, 320),
          ('Bruschetta', 'Toasted bread topped with fresh tomatoes, basil, and mozzarella', 9.99, 1, false, true, 8, 180),
          ('Grilled Salmon', 'Fresh Atlantic salmon grilled to perfection with lemon herb seasoning', 24.99, 2, true, true, 20, 450),
          ('Beef Tenderloin', 'Premium beef tenderloin cooked to your preference with garlic mashed potatoes', 32.99, 2, true, true, 25, 580),
          ('Vegetarian Pasta', 'Penne pasta with seasonal vegetables in a light tomato basil sauce', 18.99, 2, false, true, 15, 420),
          ('Chocolate Lava Cake', 'Warm chocolate cake with a molten center, served with vanilla ice cream', 8.99, 3, true, true, 12, 520),
          ('Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 7.99, 3, false, true, 5, 380),
          ('Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, 4, false, true, 2, 110),
          ('Craft Beer', 'Local craft beer selection', 6.99, 4, false, true, 1, 150),
          ('Greek Salad', 'Fresh mixed greens with feta cheese, olives, and Mediterranean dressing', 13.99, 5, false, true, 8, 280)
        `);
        console.log('Menu items inserted successfully!');
      }
      
      // Final verification
      const finalCategoriesCheck = await client.query('SELECT COUNT(*) FROM menu_categories');
      const finalItemsCheck = await client.query('SELECT COUNT(*) FROM menu_items');
      const featuredItemsCheck = await client.query('SELECT COUNT(*) FROM menu_items WHERE is_featured = true');
      
      console.log('\nDatabase initialization complete!');
      console.log(`Total categories: ${finalCategoriesCheck.rows[0].count}`);
      console.log(`Total menu items: ${finalItemsCheck.rows[0].count}`);
      console.log(`Featured items: ${featuredItemsCheck.rows[0].count}`);
      
    } catch (error) {
      console.error('Error during data operations:', error.message);
      console.error('Full error:', error);
    }
    
  } catch (error) {
    console.error('Error connecting to production database:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeProductionDatabase();