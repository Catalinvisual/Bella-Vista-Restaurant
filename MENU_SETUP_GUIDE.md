# 🍽️ Restaurant Menu Setup Guide

This guide will help you add menu items to your Bella Vista restaurant website.

## Quick Start (Recommended)

For a quick setup with essential menu items, run the quick script:

```bash
cd c:\Catalin\Proiecte fullstack 2025\Bella Vista
node add-sample-menu-quick.js
```

This will add:
- 2 appetizers (Bruschetta, Calamari)
- 2 main courses (Salmon, Chicken Marsala)
- 2 pasta dishes (Fettuccine Alfredo, Seafood Risotto)
- 2 pizzas (Margherita, Pepperoni)
- 2 salads (Caesar, Greek)
- 2 desserts (Tiramisu, Chocolate Lava Cake)
- 2 beverages (Orange Juice, Cappuccino)

Total: 12 menu items across 7 categories

## Full Menu Setup (Comprehensive)

For a complete restaurant menu with 50+ items across 10 categories:

```bash
cd c:\Catalin\Proiecte fullstack 2025\Bella Vista
node add-comprehensive-menu.js
```

This will add:
- **Appetizers** (5 items): Bruschetta, Calamari, Caprese Skewers, etc.
- **Main Courses** (5 items): Salmon, Chicken Marsala, Veal Parmesan, etc.
- **Pasta & Risotto** (5 items): Fettuccine Alfredo, Carbonara, Seafood Risotto, etc.
- **Pizza** (5 items): Margherita, Pepperoni, Quattro Formaggi, etc.
- **Salads** (5 items): Caesar, Greek, Caprese, etc.
- **Seafood** (5 items): Linguine alle Vongole, Grilled Branzino, etc.
- **Steaks & Grills** (5 items): Ribeye, Filet Mignon, Lamb Chops, etc.
- **Desserts** (5 items): Tiramisu, Chocolate Lava Cake, Panna Cotta, etc.
- **Beverages** (5 items): Fresh juices, Italian sodas, coffee drinks, etc.
- **Wines** (5 items): Chianti, Pinot Grigio, Prosecco, etc.

## Features

✅ **High-quality images**: All items include professional food photography
✅ **Detailed descriptions**: Appetizing descriptions in English
✅ **Dietary information**: Vegetarian, vegan, gluten-free, keto options
✅ **Allergen warnings**: Clear allergen information for each item
✅ **Preparation times**: Realistic cooking times for each dish
✅ **Calorie information**: Nutritional data for health-conscious customers
✅ **Featured items**: Marked featured items for highlighting on your menu

## What to Expect

After running either script, your restaurant website will display:
- Beautiful food images for each menu item
- Detailed descriptions in English
- Prices and preparation times
- Dietary and allergen information
- Professional restaurant presentation

## Database Requirements

Make sure your database connection is configured in your `.env` file:
```
DB_HOST=your_database_host
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_PORT=5432
```

## Troubleshooting

If you encounter any issues:
1. Check your database connection
2. Ensure your `.env` file has the correct credentials
3. Make sure your database tables are created (run the database setup scripts first)
4. Check the console output for specific error messages

## Next Steps

After adding menu items:
1. Visit your website to see the new menu
2. Test the ordering functionality
3. Customize any items or add your own photos
4. Set up payment processing if needed

Enjoy your new restaurant menu! 🍕🍝🍷