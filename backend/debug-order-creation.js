const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Debugging order creation in production database...');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function debugOrderCreation() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== Testing Order Creation Logic ===');
    
    // Test 1: Check menu item exists
    console.log('\n1. Checking menu item ID 10...');
    const menuQuery = 'SELECT id, name, price, is_available FROM menu_items WHERE id = $1';
    const menuResult = await client.query(menuQuery, [10]);
    
    if (menuResult.rows.length === 0) {
      console.log('❌ Menu item 10 not found!');
      return;
    }
    
    const menuItem = menuResult.rows[0];
    console.log(`✅ Menu item found: ${menuItem.name} - €${menuItem.price} - Available: ${menuItem.is_available}`);
    
    if (!menuItem.is_available) {
      console.log('❌ Menu item is not available!');
      return;
    }
    
    // Test 2: Check guest user
    console.log('\n2. Checking guest user...');
    const userQuery = 'SELECT id, full_name, email FROM users WHERE id = 9';
    const userResult = await client.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Guest user not found!');
      return;
    }
    
    const guestUser = userResult.rows[0];
    console.log(`✅ Guest user found: ${guestUser.full_name} (${guestUser.email})`);
    
    // Test 3: Calculate totals
    console.log('\n3. Calculating order totals...');
    const quantity = 1;
    const subtotal = parseFloat(menuItem.price) * quantity;
    const deliveryFee = 2.50; // Standard delivery fee
    const taxRate = 0.21; // 21% VAT
    const taxAmount = (subtotal + deliveryFee) * taxRate;
    const totalAmount = subtotal + deliveryFee + taxAmount;
    
    console.log(`Subtotal: €${subtotal.toFixed(2)}`);
    console.log(`Delivery Fee: €${deliveryFee.toFixed(2)}`);
    console.log(`Tax (21%): €${taxAmount.toFixed(2)}`);
    console.log(`Total: €${totalAmount.toFixed(2)}`);
    
    // Test 4: Try to create order (simulation)
    console.log('\n4. Simulating order creation...');
    
    await client.query('BEGIN');
    
    const orderQuery = `
      INSERT INTO orders (
        user_id, order_type, delivery_address, payment_method, 
        subtotal, delivery_fee, tax_amount, total_amount, status,
        customer_name, customer_email, customer_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, created_at
    `;
    
    const orderValues = [
      9, // user_id (guest)
      'delivery',
      '123 Test Street, Amsterdam, Netherlands',
      'cash_on_delivery',
      subtotal,
      deliveryFee,
      taxAmount,
      totalAmount,
      'pending',
      'Test User',
      'test@example.com',
      '+31612345678'
    ];
    
    const orderResult = await client.query(orderQuery, orderValues);
    const orderId = orderResult.rows[0].id;
    console.log(`✅ Order created with ID: ${orderId}`);
    
    // Test 5: Add order items
    const orderItemQuery = `
      INSERT INTO order_items (order_id, menu_item_id, quantity, price)
      VALUES ($1, $2, $3, $4)
    `;
    
    await client.query(orderItemQuery, [orderId, 10, quantity, menuItem.price]);
    console.log(`✅ Order item added`);
    
    await client.query('COMMIT');
    console.log('\n✅ Order creation test completed successfully!');
    
    // Clean up test order
    console.log('\n5. Cleaning up test order...');
    await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
    await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
    console.log('✅ Test order cleaned up');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during order creation test:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
  } finally {
    client.release();
    await pool.end();
  }
}

debugOrderCreation();