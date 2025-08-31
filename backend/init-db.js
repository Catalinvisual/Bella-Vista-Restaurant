const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Initializing database with sample data...');
    
    // Check if data already exists
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
        ('Garden Salad', 'Mixed greens with cherry tomatoes, cucumbers, and balsamic vinaigrette', 10.99, 5, false, true, 8, 180)
      `);
      console.log('Menu items inserted successfully!');
    }
    
    // Verify the data
    const finalCategoriesCheck = await client.query('SELECT COUNT(*) FROM menu_categories');
    const finalItemsCheck = await client.query('SELECT COUNT(*) FROM menu_items');
    const featuredItemsCheck = await client.query('SELECT COUNT(*) FROM menu_items WHERE is_featured = true');
    
    console.log(`\nDatabase initialization complete!`);
    console.log(`Total categories: ${finalCategoriesCheck.rows[0].count}`);
    console.log(`Total menu items: ${finalItemsCheck.rows[0].count}`);
    console.log(`Featured items: ${featuredItemsCheck.rows[0].count}`);
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();