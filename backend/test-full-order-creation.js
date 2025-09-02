const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Testing full order creation process in production database...');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function testFullOrderCreation() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== Testing Full Order Creation Process ===');
    
    // Simulate the exact request data
    const requestData = {
      items: [{ menu_item_id: 10, quantity: 1 }],
      order_type: 'delivery',
      delivery_address: '123 Test Street, Amsterdam, Netherlands',
      payment_method: 'cash_on_delivery',
      customer_info: {
        full_name: 'Test User',
        phone: '+31612345678',
        email: 'test@example.com'
      }
    };
    
    const { items, delivery_address, special_instructions, order_type = 'delivery', customer_info, pickup_time } = requestData;
    const user_id = 9; // Guest user ID
    const phone_number = requestData.phone_number || customer_info?.phone || null;
    
    console.log('\n1. Request data validation:');
    console.log('- user_id:', user_id);
    console.log('- phone_number:', phone_number);
    console.log('- delivery_address:', delivery_address);
    console.log('- order_type:', order_type);
    console.log('- special_instructions:', special_instructions);
    console.log('- pickup_time:', pickup_time);
    
    await client.query('BEGIN');
    
    // Step 1: Verify menu items
    console.log('\n2. Verifying menu items...');
    const menuItemIds = items.map(item => item.menu_item_id);
    const menuItemsQuery = `
      SELECT id, name, price, is_available 
      FROM menu_items 
      WHERE id = ANY($1) AND is_active = true
    `;
    const menuItemsResult = await client.query(menuItemsQuery, [menuItemIds]);
    
    if (menuItemsResult.rows.length !== menuItemIds.length) {
      console.log('❌ Menu items validation failed');
      await client.query('ROLLBACK');
      return;
    }
    
    console.log('✅ Menu items validated:', menuItemsResult.rows.map(item => `${item.name} (€${item.price})`));
    
    // Step 2: Calculate totals
    console.log('\n3. Calculating totals...');
    let total_amount = 0;
    const validatedItems = items.map(orderItem => {
      const menuItem = menuItemsResult.rows.find(mi => mi.id === orderItem.menu_item_id);
      const itemTotal = parseFloat(menuItem.price) * orderItem.quantity;
      total_amount += itemTotal;
      
      return {
        menu_item_id: orderItem.menu_item_id,
        quantity: orderItem.quantity,
        price: parseFloat(menuItem.price),
        total: itemTotal
      };
    });
    
    const delivery_fee = order_type === 'delivery' ? 3.99 : 0;
    const tax_amount = total_amount * 0.08; // 8% tax
    const final_total = total_amount + delivery_fee + tax_amount;
    
    console.log(`- total_amount: €${total_amount.toFixed(2)}`);
    console.log(`- delivery_fee: €${delivery_fee.toFixed(2)}`);
    console.log(`- tax_amount: €${tax_amount.toFixed(2)}`);
    console.log(`- final_total: €${final_total.toFixed(2)}`);
    
    // Step 3: Create order with exact query from routes/orders.js
    console.log('\n4. Creating order...');
    const orderQuery = `
      INSERT INTO orders (
        user_id, total_amount, tax_amount, delivery_fee, final_total,
        order_type, status, delivery_address, phone_number, special_instructions,
        pickup_time, payment_method, payment_status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const payment_method = 'cash_on_delivery';
    const payment_status = 'pending';
    
    console.log('Order query parameters:');
    const orderParams = [
      user_id, total_amount, tax_amount, delivery_fee, final_total,
      order_type, delivery_address, phone_number, special_instructions,
      pickup_time || null, payment_method, payment_status
    ];
    
    orderParams.forEach((param, index) => {
      console.log(`  $${index + 1}: ${param} (${typeof param})`);
    });
    
    const orderResult = await client.query(orderQuery, orderParams);
    const order = orderResult.rows[0];
    console.log(`✅ Order created with ID: ${order.id}`);
    
    // Step 4: Create order items
    console.log('\n5. Creating order items...');
    const orderItemsQuery = `
      INSERT INTO order_items (order_id, menu_item_id, quantity, price, total)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    for (const item of validatedItems) {
      console.log(`Adding item: ${item.menu_item_id} x${item.quantity} @ €${item.price} = €${item.total}`);
      await client.query(orderItemsQuery, [
        order.id, item.menu_item_id, item.quantity, item.price, item.total
      ]);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Order creation test completed successfully!');
    
    // Clean up test order
    console.log('\n6. Cleaning up test order...');
    await client.query('DELETE FROM order_items WHERE order_id = $1', [order.id]);
    await client.query('DELETE FROM orders WHERE id = $1', [order.id]);
    console.log('✅ Test order cleaned up');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during order creation test:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Error constraint:', error.constraint);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testFullOrderCreation();