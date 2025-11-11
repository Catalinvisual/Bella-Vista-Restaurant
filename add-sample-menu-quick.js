const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Quick sample menu items for immediate use
const quickMenuItems = [
  // Appetizers
  {
    category_name: 'Appetizers',
    items: [
      {
        name: 'Bruschetta Classica',
        description: 'Toasted artisan bread topped with fresh Roma tomatoes, basil, garlic, and extra virgin olive oil',
        price: 9.99,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 8,
        calories: 180,
        allergens: ['Gluten', 'Dairy'],
        dietary_info: ['Vegetarian']
      },
      {
        name: 'Calamari Fritti',
        description: 'Crispy fried squid rings served with house-made marinara sauce and lemon wedges',
        price: 13.99,
        image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop',
        is_featured: false,
        preparation_time: 12,
        calories: 320,
        allergens: ['Seafood', 'Gluten'],
        dietary_info: []
      }
    ]
  },
  // Main Courses
  {
    category_name: 'Main Courses',
    items: [
      {
        name: 'Grilled Atlantic Salmon',
        description: 'Fresh salmon fillet grilled with lemon herb butter, served with seasonal vegetables and wild rice',
        price: 26.99,
        image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 22,
        calories: 480,
        allergens: ['Seafood', 'Dairy'],
        dietary_info: ['Gluten-Free']
      },
      {
        name: 'Chicken Marsala',
        description: 'Tender chicken breast sautéed with mushrooms in rich Marsala wine sauce, served over linguine',
        price: 21.99,
        image_url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 25,
        calories: 520,
        allergens: ['Gluten', 'Dairy'],
        dietary_info: []
      }
    ]
  },
  // Pasta
  {
    category_name: 'Pasta & Risotto',
    items: [
      {
        name: 'Fettuccine Alfredo',
        description: 'Fresh egg pasta in rich cream sauce with aged Parmigiano-Reggiano and cracked black pepper',
        price: 17.99,
        image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 15,
        calories: 650,
        allergens: ['Gluten', 'Dairy', 'Eggs'],
        dietary_info: ['Vegetarian']
      },
      {
        name: 'Seafood Risotto',
        description: 'Creamy Arborio rice with shrimp, scallops, mussels, and saffron in white wine broth',
        price: 24.99,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 28,
        calories: 580,
        allergens: ['Seafood', 'Dairy'],
        dietary_info: ['Gluten-Free']
      }
    ]
  },
  // Pizza
  {
    category_name: 'Pizza',
    items: [
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with San Marzano tomatoes, fresh mozzarella, basil, and olive oil',
        price: 16.99,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 15,
        calories: 820,
        allergens: ['Gluten', 'Dairy'],
        dietary_info: ['Vegetarian']
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Traditional pizza with tomato sauce, mozzarella, and spicy pepperoni slices',
        price: 18.99,
        image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop',
        is_featured: false,
        preparation_time: 15,
        calories: 950,
        allergens: ['Gluten', 'Dairy'],
        dietary_info: []
      }
    ]
  },
  // Salads
  {
    category_name: 'Salads',
    items: [
      {
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce with parmesan cheese, croutons, and our signature Caesar dressing',
        price: 12.99,
        image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 8,
        calories: 320,
        allergens: ['Dairy', 'Gluten', 'Eggs'],
        dietary_info: []
      },
      {
        name: 'Greek Salad',
        description: 'Fresh mixed greens with feta cheese, Kalamata olives, tomatoes, cucumbers, and oregano',
        price: 13.99,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
        is_featured: false,
        preparation_time: 7,
        calories: 280,
        allergens: ['Dairy'],
        dietary_info: ['Vegetarian', 'Gluten-Free']
      }
    ]
  },
  // Desserts
  {
    category_name: 'Desserts',
    items: [
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream',
        price: 8.99,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 5,
        calories: 380,
        allergens: ['Dairy', 'Gluten', 'Eggs'],
        dietary_info: ['Vegetarian']
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla gelato',
        price: 9.99,
        image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 12,
        calories: 520,
        allergens: ['Dairy', 'Gluten', 'Eggs'],
        dietary_info: ['Vegetarian']
      }
    ]
  },
  // Beverages
  {
    category_name: 'Beverages',
    items: [
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed California oranges',
        price: 5.99,
        image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop',
        is_featured: false,
        preparation_time: 2,
        calories: 110,
        allergens: [],
        dietary_info: ['Vegan', 'Gluten-Free']
      },
      {
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and foam art',
        price: 4.99,
        image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop',
        is_featured: true,
        preparation_time: 3,
        calories: 120,
        allergens: ['Dairy'],
        dietary_info: ['Vegetarian', 'Gluten-Free']
      }
    ]
  }
];

async function addSampleMenuQuick() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting quick menu setup...');
    
    await client.query('BEGIN');
    
    let totalItems = 0;
    
    for (const categoryData of quickMenuItems) {
      // Check if category exists, if not create it
      let categoryResult = await client.query(
        'SELECT id FROM menu_categories WHERE name = $1',
        [categoryData.category_name]
      );
      
      let categoryId;
      if (categoryResult.rows.length === 0) {
        // Create category
        const insertResult = await client.query(
          'INSERT INTO menu_categories (name, description, display_order, is_active) VALUES ($1, $2, $3, true) RETURNING id',
          [categoryData.category_name, `${categoryData.category_name} description`, 1]
        );
        categoryId = insertResult.rows[0].id;
        console.log(`✅ Created category: ${categoryData.category_name}`);
      } else {
        categoryId = categoryResult.rows[0].id;
      }
      
      // Insert items for this category
      for (const item of categoryData.items) {
        await client.query(
          `INSERT INTO menu_items (
            name, description, price, category_id, image_url, 
            is_available, is_featured, preparation_time, calories,
            allergens, dietary_info, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, $10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            item.name,
            item.description,
            item.price,
            categoryId,
            item.image_url,
            item.is_featured,
            item.preparation_time,
            item.calories,
            item.allergens,
            item.dietary_info
          ]
        );
        totalItems++;
        console.log(`  🍴 Added: ${item.name}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n🎉 Quick menu setup complete!`);
    console.log(`   Added ${totalItems} menu items across ${quickMenuItems.length} categories`);
    console.log(`\n✨ Your restaurant is ready to serve!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding quick menu:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addSampleMenuQuick().catch(console.error);