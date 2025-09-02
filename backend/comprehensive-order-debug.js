const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

// Database configuration
const pool = new Pool({
  user: 'bella_user',
  host: 'dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com',
  database: 'bella_vista_db_dwub',
  password: 'W6KwW991u2Pt8wfyrDsx6ZbpJU5LlxyM',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function comprehensiveOrderDebug() {
  const client = await pool.connect();
  
  try {
    console.log('=== COMPREHENSIVE ORDER CREATION DEBUG ===');
    
    // Test data
    const testData = {
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
    
    console.log('1. Testing database connection...');
    const connectionTest = await client.query('SELECT NOW()');
    console.log('✓ Database connected successfully');
    
    console.log('\n2. Testing menu item existence...');
    const menuItemQuery = 'SELECT id, name, price, is_available FROM menu_items WHERE id = $1';
    const menuItemResult = await client.query(menuItemQuery, [testData.items[0].menu_item_id]);
    
    if (menuItemResult.rows.length === 0) {
      console.log('✗ Menu item not found');
      return;
    }
    
    const menuItem = menuItemResult.rows[0];
    console.log('✓ Menu item found:', menuItem);
    
    if (!menuItem.is_available) {
      console.log('✗ Menu item not available');
      return;
    }
    
    console.log('\n3. Testing guest user...');
    const guestUserQuery = 'SELECT id, email FROM users WHERE email = $1';
    const guestUserResult = await client.query(guestUserQuery, ['guest@bellavista.com']);
    
    if (guestUserResult.rows.length === 0) {
      console.log('✗ Guest user not found');
      return;
    }
    
    const guestUser = guestUserResult.rows[0];
    console.log('✓ Guest user found:', guestUser);
    
    console.log('\n4. Testing order creation query...');
    
    await client.query('BEGIN');
    
    // Calculate totals
    const subtotal = menuItem.price * testData.items[0].quantity;
    const taxRate = 0.21;
    const taxAmount = subtotal * taxRate;
    const deliveryFee = testData.order_type === 'delivery' ? 2.50 : 0;
    const finalTotal = subtotal + taxAmount + deliveryFee;
    
    console.log('Calculated totals:', {
      subtotal,
      taxAmount,
      deliveryFee,
      finalTotal
    });
    
    // Test order insertion
    const orderInsertQuery = `
      INSERT INTO orders (
        user_id, total_amount, tax_amount, delivery_fee, final_total,
        order_type, status, delivery_address, phone_number, special_instructions,
        payment_method, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const orderValues = [
      guestUser.id,
      subtotal,
      taxAmount,
      deliveryFee,
      finalTotal,
      testData.order_type,
      'pending',
      testData.delivery_address,
      testData.customer_info.phone,
      null, // special_instructions
      testData.payment_method,
      'pending'
    ];
    
    console.log('\nOrder insert values:', orderValues);
    
    const orderResult = await client.query(orderInsertQuery, orderValues);
    const order = orderResult.rows[0];
    console.log('✓ Order created successfully:', order.id);
    
    console.log('\n5. Testing order items creation...');
    
    const orderItemInsertQuery = `
      INSERT INTO order_items (order_id, menu_item_id, quantity, price, total)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const itemTotal = menuItem.price * testData.items[0].quantity;
    const orderItemValues = [
      order.id,
      testData.items[0].menu_item_id,
      testData.items[0].quantity,
      menuItem.price,
      itemTotal
    ];
    
    console.log('Order item insert values:', orderItemValues);
    
    const orderItemResult = await client.query(orderItemInsertQuery, orderItemValues);
    console.log('✓ Order item created successfully:', orderItemResult.rows[0]);
    
    console.log('\n6. Testing complete order query...');
    
    const completeOrderQuery = `
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'menu_item_name', mi.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = $1
      GROUP BY o.id, u.full_name, u.email
    `;
    
    const completeOrderResult = await client.query(completeOrderQuery, [order.id]);
    const orderWithDetails = completeOrderResult.rows[0];
    console.log('✓ Complete order query successful');
    console.log('Order details:', JSON.stringify(orderWithDetails, null, 2));
    
    await client.query('COMMIT');
    
    console.log('\n7. Cleaning up test order...');
    await client.query('DELETE FROM order_items WHERE order_id = $1', [order.id]);
    await client.query('DELETE FROM orders WHERE id = $1', [order.id]);
    console.log('✓ Test order cleaned up');
    
    console.log('\n=== ALL TESTS PASSED ===');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n=== ERROR OCCURRED ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
  } finally {
    client.release();
    await pool.end();
  }
}

comprehensiveOrderDebug();