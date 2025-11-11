const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Comprehensive menu data with high-quality images and detailed descriptions
const menuCategories = [
  { name: 'Appetizers', description: 'Start your meal with our delicious appetizers', display_order: 1 },
  { name: 'Main Courses', description: 'Our signature main dishes', display_order: 2 },
  { name: 'Pasta & Risotto', description: 'Fresh homemade pasta and creamy risotto dishes', display_order: 3 },
  { name: 'Pizza', description: 'Authentic Italian pizzas baked in our wood-fired oven', display_order: 4 },
  { name: 'Salads', description: 'Fresh and healthy salad options', display_order: 5 },
  { name: 'Seafood', description: 'Fresh seafood selections from local waters', display_order: 6 },
  { name: 'Steaks & Grills', description: 'Premium cuts grilled to perfection', display_order: 7 },
  { name: 'Desserts', description: 'Sweet endings to your perfect meal', display_order: 8 },
  { name: 'Beverages', description: 'Refreshing drinks and beverages', display_order: 9 },
  { name: 'Wines', description: 'Curated selection of fine wines', display_order: 10 }
];

const menuItems = {
  'Appetizers': [
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
    },
    {
      name: 'Caprese Skewers',
      description: 'Fresh mozzarella balls, cherry tomatoes, and basil drizzled with balsamic glaze',
      price: 11.99,
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 5,
      calories: 150,
      allergens: ['Dairy'],
      dietary_info: ['Vegetarian', 'Gluten-Free']
    },
    {
      name: 'Stuffed Mushrooms',
      description: 'Button mushrooms filled with herb cream cheese, breadcrumbs, and parmesan',
      price: 10.99,
      image_url: 'https://images.unsplash.com/photo-1514516870926-20598973e480?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 15,
      calories: 220,
      allergens: ['Dairy', 'Gluten'],
      dietary_info: ['Vegetarian']
    },
    {
      name: 'Shrimp Cocktail',
      description: 'Chilled jumbo shrimp served with classic cocktail sauce and lemon',
      price: 14.99,
      image_url: 'https://images.unsplash.com/photo-1559847844-d724b851b5d1?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 3,
      calories: 140,
      allergens: ['Seafood'],
      dietary_info: ['Gluten-Free', 'Keto']
    }
  ],
  'Main Courses': [
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
    },
    {
      name: 'Veal Parmesan',
      description: 'Breaded veal cutlet topped with marinara sauce and melted mozzarella, served with spaghetti',
      price: 28.99,
      image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 30,
      calories: 680,
      allergens: ['Gluten', 'Dairy'],
      dietary_info: []
    },
    {
      name: 'Eggplant Parmigiana',
      description: 'Layers of breaded eggplant, marinara sauce, and three cheeses, baked to perfection',
      price: 19.99,
      image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 35,
      calories: 420,
      allergens: ['Gluten', 'Dairy'],
      dietary_info: ['Vegetarian']
    },
    {
      name: 'Rack of Lamb',
      description: 'Herb-crusted rack of lamb with rosemary-garlic rub, served with roasted potatoes',
      price: 34.99,
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 35,
      calories: 580,
      allergens: [],
      dietary_info: ['Gluten-Free', 'Keto']
    }
  ],
  'Pasta & Risotto': [
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
      name: 'Spaghetti Carbonara',
      description: 'Classic Roman pasta with pancetta, egg yolks, Pecorino Romano, and fresh black pepper',
      price: 18.99,
      image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 18,
      calories: 720,
      allergens: ['Gluten', 'Dairy', 'Eggs'],
      dietary_info: []
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
    },
    {
      name: 'Penne Arrabbiata',
      description: 'Penne pasta in spicy tomato sauce with garlic, red chili flakes, and fresh basil',
      price: 15.99,
      image_url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 14,
      calories: 480,
      allergens: ['Gluten'],
      dietary_info: ['Vegan']
    },
    {
      name: 'Lobster Ravioli',
      description: 'Handmade ravioli filled with lobster in pink vodka cream sauce',
      price: 27.99,
      image_url: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 22,
      calories: 620,
      allergens: ['Gluten', 'Dairy', 'Seafood', 'Eggs'],
      dietary_info: []
    }
  ],
  'Pizza': [
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
    },
    {
      name: 'Quattro Formaggi',
      description: 'Four-cheese pizza with mozzarella, gorgonzola, parmesan, and fontina',
      price: 19.99,
      image_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 15,
      calories: 780,
      allergens: ['Gluten', 'Dairy'],
      dietary_info: ['Vegetarian']
    },
    {
      name: 'Prosciutto e Funghi',
      description: 'Pizza with tomato sauce, mozzarella, prosciutto ham, and fresh mushrooms',
      price: 20.99,
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 16,
      calories: 880,
      allergens: ['Gluten', 'Dairy'],
      dietary_info: []
    },
    {
      name: 'Vegetariana Pizza',
      description: 'Pizza loaded with seasonal vegetables, tomato sauce, and mozzarella',
      price: 17.99,
      image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 16,
      calories: 720,
      allergens: ['Gluten', 'Dairy'],
      dietary_info: ['Vegetarian']
    }
  ],
  'Salads': [
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
    },
    {
      name: 'Caprese Salad',
      description: 'Fresh mozzarella, ripe tomatoes, and basil with balsamic reduction',
      price: 11.99,
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 5,
      calories: 250,
      allergens: ['Dairy'],
      dietary_info: ['Vegetarian', 'Gluten-Free']
    },
    {
      name: 'Spinach & Strawberry Salad',
      description: 'Baby spinach with fresh strawberries, goat cheese, candied pecans, and balsamic vinaigrette',
      price: 14.99,
      image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 8,
      calories: 340,
      allergens: ['Dairy', 'Nuts'],
      dietary_info: ['Vegetarian', 'Gluten-Free']
    },
    {
      name: 'Antipasto Salad',
      description: 'Mixed greens with Italian meats, cheeses, olives, and roasted vegetables',
      price: 16.99,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 10,
      calories: 420,
      allergens: ['Dairy'],
      dietary_info: ['Gluten-Free']
    }
  ],
  'Seafood': [
    {
      name: 'Linguine alle Vongole',
      description: 'Fresh linguine with Manila clams in white wine garlic sauce',
      price: 23.99,
      image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 20,
      calories: 580,
      allergens: ['Gluten', 'Shellfish'],
      dietary_info: []
    },
    {
      name: 'Grilled Branzino',
      description: 'Whole Mediterranean sea bass grilled with lemon, herbs, and olive oil',
      price: 29.99,
      image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 25,
      calories: 380,
      allergens: ['Seafood'],
      dietary_info: ['Gluten-Free', 'Keto']
    },
    {
      name: 'Seafood Paella',
      description: 'Spanish saffron rice with shrimp, mussels, calamari, and fish',
      price: 32.99,
      image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 35,
      calories: 720,
      allergens: ['Seafood', 'Shellfish'],
      dietary_info: ['Gluten-Free']
    },
    {
      name: 'Shrimp Scampi',
      description: 'Jumbo shrimp sautéed in garlic butter with white wine, served over linguine',
      price: 24.99,
      image_url: 'https://images.unsplash.com/photo-1559847844-d724b851b5d1?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 18,
      calories: 620,
      allergens: ['Seafood', 'Dairy', 'Gluten'],
      dietary_info: []
    },
    {
      name: 'Bouillabaisse',
      description: 'Traditional Provençal fish stew with saffron, fennel, and rouille',
      price: 31.99,
      image_url: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 30,
      calories: 450,
      allergens: ['Seafood', 'Shellfish'],
      dietary_info: ['Gluten-Free']
    }
  ],
  'Steaks & Grills': [
    {
      name: 'Ribeye Steak',
      description: '12oz USDA Prime ribeye with herb butter, served with roasted vegetables',
      price: 38.99,
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 25,
      calories: 780,
      allergens: ['Dairy'],
      dietary_info: ['Gluten-Free', 'Keto']
    },
    {
      name: 'Filet Mignon',
      description: '8oz tenderloin with red wine reduction, served with garlic mashed potatoes',
      price: 42.99,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 30,
      calories: 650,
      allergens: ['Dairy'],
      dietary_info: ['Gluten-Free', 'Keto']
    },
    {
      name: 'Grilled Lamb Chops',
      description: 'Herb-marinated lamb chops with mint chimichurri and roasted root vegetables',
      price: 36.99,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 28,
      calories: 620,
      allergens: [],
      dietary_info: ['Gluten-Free', 'Keto']
    },
    {
      name: 'Pork Osso Buco',
      description: 'Braised pork shank with vegetables, served over saffron risotto',
      price: 29.99,
      image_url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 45,
      calories: 720,
      allergens: ['Dairy'],
      dietary_info: ['Gluten-Free']
    },
    {
      name: 'Mixed Grill Platter',
      description: 'Assortment of grilled meats: sausage, chicken, and beef with chimichurri sauce',
      price: 34.99,
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 35,
      calories: 850,
      allergens: [],
      dietary_info: ['Gluten-Free', 'Keto']
    }
  ],
  'Desserts': [
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
    },
    {
      name: 'Panna Cotta',
      description: 'Silky vanilla custard with mixed berry compote and mint',
      price: 7.99,
      image_url: 'https://images.unsplash.com/photo-1488477181946-2c96a3762b0b?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 8,
      calories: 280,
      allergens: ['Dairy'],
      dietary_info: ['Vegetarian', 'Gluten-Free']
    },
    {
      name: 'Cannoli Siciliani',
      description: 'Crispy pastry tubes filled with sweet ricotta, chocolate chips, and pistachios',
      price: 6.99,
      image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 5,
      calories: 320,
      allergens: ['Dairy', 'Gluten', 'Nuts'],
      dietary_info: ['Vegetarian']
    },
    {
      name: 'Gelato Trio',
      description: 'Selection of three artisanal gelato flavors: vanilla, chocolate, and strawberry',
      price: 8.99,
      image_url: 'https://images.unsplash.com/photo-1488477181946-2c96a3762b0b?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 3,
      calories: 240,
      allergens: ['Dairy'],
      dietary_info: ['Vegetarian', 'Gluten-Free']
    }
  ],
  'Beverages': [
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
      name: 'Italian Soda',
      description: 'Sparkling water with your choice of fruit syrup: strawberry, peach, or raspberry',
      price: 4.99,
      image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 2,
      calories: 80,
      allergens: [],
      dietary_info: ['Vegan', 'Gluten-Free']
    },
    {
      name: 'Espresso',
      description: 'Rich and bold Italian coffee, single or double shot',
      price: 3.99,
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 1,
      calories: 5,
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
    },
    {
      name: 'Limoncello Spritz',
      description: 'Prosecco with limoncello, soda water, and fresh lemon',
      price: 8.99,
      image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 2,
      calories: 180,
      allergens: [],
      dietary_info: ['Vegan', 'Gluten-Free']
    }
  ],
  'Wines': [
    {
      name: 'Chianti Classico',
      description: 'Tuscan red wine with notes of cherry, plum, and spice - 6oz pour',
      price: 12.99,
      image_url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 1,
      calories: 150,
      allergens: [],
      dietary_info: ['Vegan', 'Gluten-Free']
    },
    {
      name: 'Pinot Grigio',
      description: 'Crisp white wine from Northern Italy with citrus and floral notes - 6oz pour',
      price: 11.99,
      image_url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 1,
      calories: 145,
      allergens: [],
      dietary_info: ['Vegan', 'Gluten-Free']
    },
    {
      name: 'Prosecco',
      description: 'Italian sparkling wine, perfect for celebrations - 6oz pour',
      price: 13.99,
      image_url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop',
      is_featured: true,
      preparation_time: 1,
      calories: 120,
      allergens: [],
      dietary_info: ['Vegan', 'Gluten-Free']
    },
    {
      name: 'Barolo',
      description: 'Premium red wine from Piedmont with complex flavors - 6oz pour',
      price: 18.99,
      image_url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 1,
      calories: 155,
      allergens: [],
      dietary_info: ['Vegan', 'Gluten-Free']
    },
    {
      name: 'Moscato d\'Asti',
      description: 'Sweet sparkling wine perfect with dessert - 6oz pour',
      price: 10.99,
      image_url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop',
      is_featured: false,
      preparation_time: 1,
      calories: 130,
      allergens: [],
      dietary_info: ['Vegan', 'Gluten-Free']
    }
  ]
};

async function addComprehensiveMenu() {
  const client = await pool.connect();
  
  try {
    console.log('🍝 Starting comprehensive menu setup...');
    
    await client.query('BEGIN');
    
    // Insert categories
    console.log('📋 Inserting menu categories...');
    const categoryIds = {};
    
    for (const category of menuCategories) {
      const result = await client.query(
        `INSERT INTO menu_categories (name, description, display_order, is_active) 
         VALUES ($1, $2, $3, true) 
         ON CONFLICT (name) DO UPDATE SET 
           description = EXCLUDED.description,
           display_order = EXCLUDED.display_order,
           is_active = true
         RETURNING id`,
        [category.name, category.description, category.display_order]
      );
      categoryIds[category.name] = result.rows[0].id;
      console.log(`✅ Added category: ${category.name}`);
    }
    
    // Insert menu items
    console.log('🍽️ Inserting menu items...');
    let totalItems = 0;
    
    for (const [categoryName, items] of Object.entries(menuItems)) {
      const categoryId = categoryIds[categoryName];
      
      for (const item of items) {
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
        console.log(`  🍴 Added item: ${item.name}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n🎉 Successfully added:`);
    console.log(`   ${menuCategories.length} categories`);
    console.log(`   ${totalItems} menu items`);
    console.log(`\n✨ Your restaurant menu is now ready!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding comprehensive menu:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addComprehensiveMenu().catch(console.error);