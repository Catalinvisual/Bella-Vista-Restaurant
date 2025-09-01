const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendOrderConfirmation } = require('../services/emailService');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdef');

// Middleware to check if user is authenticated via JWT
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Create payment intent (with test mode fallback)
router.post('/create-payment-intent', isAuthenticated, [
  body('amount').isFloat({ min: 0.5 }).withMessage('Amount must be at least $0.50'),
  body('currency').optional().isIn(['usd', 'eur']).withMessage('Currency must be USD or EUR'),
  body('payment_method_types').optional().isArray().withMessage('Payment method types must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { 
      amount, 
      currency = 'eur', 
      payment_method_types = ['card']
    } = req.body;
    
    // Test mode: Create a mock payment intent for testing
    if (process.env.NODE_ENV === 'production' && process.env.STRIPE_TEST_MODE === 'true') {
      const testId = `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockPaymentIntent = {
        id: testId,
        client_secret: `${testId}_secret_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(amount * 100),
        currency: currency,
        status: 'requires_payment_method'
      };
      
      return res.json({
        client_secret: mockPaymentIntent.client_secret,
        payment_intent_id: mockPaymentIntent.id,
        test_mode: true
      });
    }
    
    // Filter out payment methods that don't support the currency
    const filteredPaymentMethods = payment_method_types.filter(method => {
      // iDEAL only supports EUR currency
      if (method === 'ideal' && currency !== 'eur') {
        return false;
      }
      return true;
    });
    
    // Convert amount to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(amount * 100);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      payment_method_types: filteredPaymentMethods,
      metadata: {
        user_id: req.user ? req.user.id.toString() : 'guest',
        user_email: req.user ? req.user.email : 'guest@example.com'
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: 'Failed to create payment intent',
      error: error.message 
    });
  }
});

// Confirm payment and create order
router.post('/confirm-payment', isAuthenticated, [
  body('payment_intent_id').notEmpty().withMessage('Payment intent ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.menu_item_id').isInt({ min: 1 }).withMessage('Valid menu item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('delivery_address').optional().trim().isLength({ min: 5 }).withMessage('Delivery address must be at least 5 characters'),
  body('special_instructions').optional().trim(),
  body('customer_info.full_name').optional().trim(),
  body('customer_info.phone').optional().trim(),
  body('customer_info.email').optional().isEmail().withMessage('Please provide a valid email address'),
  body('pickup_time').optional().isISO8601().withMessage('Please provide a valid pickup time'),
  body('order_type').optional().isIn(['delivery', 'pickup']).withMessage('Order type must be delivery or pickup'),
], async (req, res) => {
  const client = await req.app.locals.db.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { payment_intent_id, items, delivery_address, special_instructions, order_type = 'delivery', customer_info, pickup_time } = req.body;
    const user_id = req.user.id;

    // Verify payment intent (with test mode support)
    let paymentIntent;
    let isTestMode = false;
    
    if (payment_intent_id.startsWith('pi_test_')) {
      // Test mode: Mock successful payment
      isTestMode = true;
      paymentIntent = {
        id: payment_intent_id,
        status: 'succeeded',
        amount: items.reduce((total, item) => total + (item.price * item.quantity * 100), 0),
        currency: 'eur'
      };
    } else {
      // Real Stripe payment
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: 'Payment not completed',
          status: paymentIntent.status 
        });
      }
    }

    await client.query('BEGIN');

    // Verify all menu items exist and are available
    const menuItemIds = items.map(item => item.menu_item_id);
    const menuItemsQuery = `
      SELECT id, name, price, is_available 
      FROM menu_items 
      WHERE id = ANY($1) AND is_active = true
    `;
    const menuItemsResult = await client.query(menuItemsQuery, [menuItemIds]);
    
    if (menuItemsResult.rows.length !== menuItemIds.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'One or more menu items not found or inactive' });
    }

    // Check if all items are available
    const unavailableItems = menuItemsResult.rows.filter(item => !item.is_available);
    if (unavailableItems.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Some items are currently unavailable',
        unavailable_items: unavailableItems.map(item => item.name)
      });
    }

    // Calculate total amount
    let total_amount = 0;
    const validatedItems = items.map(orderItem => {
      const menuItem = menuItemsResult.rows.find(mi => mi.id === orderItem.menu_item_id);
      const itemTotal = menuItem.price * orderItem.quantity;
      total_amount += itemTotal;
      
      return {
        menu_item_id: orderItem.menu_item_id,
        quantity: orderItem.quantity,
        price: menuItem.price,
        total: itemTotal
      };
    });

    // Add delivery fee and tax
    const delivery_fee = order_type === 'delivery' ? 3.99 : 0;
    const tax_amount = total_amount * 0.08; // 8% tax (matching orders.js)
    const final_total = total_amount + delivery_fee + tax_amount;

    // Verify the payment amount matches our calculation
    const expectedAmountInCents = Math.round(final_total * 100);
    if (paymentIntent.amount !== expectedAmountInCents) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Payment amount does not match order total' 
      });
    }

    // Create order
    const orderQuery = `
      INSERT INTO orders (
        user_id, total_amount, tax_amount, delivery_fee, final_total,
        order_type, status, delivery_address, special_instructions, pickup_time,
        payment_intent_id, payment_status, customer_email, customer_name, customer_phone,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, $8, $9, $10, 'paid', $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const orderResult = await client.query(orderQuery, [
      user_id, total_amount, tax_amount, delivery_fee, final_total,
      order_type, delivery_address, special_instructions, pickup_time || null, payment_intent_id,
      customer_info?.email || null, customer_info?.full_name || null, customer_info?.phone || null
    ]);

    const order = orderResult.rows[0];

    // Create order items
    const orderItemsQuery = `
      INSERT INTO order_items (order_id, menu_item_id, quantity, price, total)
      VALUES ($1, $2, $3, $4, $5)
    `;

    for (const item of validatedItems) {
      await client.query(orderItemsQuery, [
        order.id, item.menu_item_id, item.quantity, item.price, item.total
      ]);
    }

    await client.query('COMMIT');

    // Fetch complete order with items and user info
    const completeOrderQuery = `
      SELECT 
        o.*,
        COALESCE(o.customer_name, u.full_name) as customer_name,
        COALESCE(o.customer_email, u.email) as customer_email,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'menu_item_name', mi.name,
            'quantity', oi.quantity,
            'price', oi.unit_price,
            'total', oi.total_price
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = $1
      GROUP BY o.id, o.customer_name, o.customer_email, u.full_name, u.email
    `;

    const completeOrderResult = await client.query(completeOrderQuery, [order.id]);
    const orderWithDetails = completeOrderResult.rows[0];

    // Send order confirmation email
    try {
      await sendOrderConfirmation(orderWithDetails);
      console.log('Order confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: orderWithDetails
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming payment and creating order:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // You can add additional logic here to update order status
      // For example, mark the order as confirmed in the database
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Handle failed payment - maybe send notification or update order status
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    const testOrderData = {
      id: 'TEST-123',
      customer_email: req.body.email || 'test@example.com',
      customer_name: 'Test Customer',
      items: [{
        menu_item_name: 'Test Item',
        quantity: 1,
        price: 10.00
      }],
      final_total: 10.00,
      order_type: 'pickup',
      delivery_address: null
    };
    
    console.log('Testing email service with data:', testOrderData);
    await sendOrderConfirmation(testOrderData);
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;