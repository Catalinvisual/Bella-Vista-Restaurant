const http = require('http');

// First, let's try to login with a test user
const loginData = JSON.stringify({
  email: 'stripetest@example.com',
  password: 'password123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('Attempting to login with test user...');

const loginReq = http.request(loginOptions, (res) => {
  console.log(`Login Status: ${res.statusCode}`);
  
  let loginResponse = '';
  res.on('data', (chunk) => {
    loginResponse += chunk;
  });
  
  res.on('end', () => {
    console.log('Login Response:', loginResponse);
    
    try {
      const loginResult = JSON.parse(loginResponse);
      
      if (loginResult.token) {
        console.log('Login successful! Testing Stripe payment...');
        testStripePayment(loginResult.token);
      } else {
        console.log('Login failed. Trying to register a test user...');
        registerTestUser();
      }
    } catch (e) {
      console.log('Could not parse login response');
      console.log('Trying to register a test user...');
      registerTestUser();
    }
  });
});

loginReq.on('error', (e) => {
  console.error(`Login request error: ${e.message}`);
});

loginReq.write(loginData);
loginReq.end();

function registerTestUser() {
  const registerData = JSON.stringify({
    fullName: 'Stripe Test User',
    email: 'stripetest@example.com',
    password: 'password123',
    phoneNumber: '+31612345678'
  });

  const registerOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': registerData.length
    }
  };

  console.log('Registering test user...');

  const registerReq = http.request(registerOptions, (res) => {
    console.log(`Register Status: ${res.statusCode}`);
    
    let registerResponse = '';
    res.on('data', (chunk) => {
      registerResponse += chunk;
    });
    
    res.on('end', () => {
      console.log('Register Response:', registerResponse);
      
      try {
        const registerResult = JSON.parse(registerResponse);
        
        if (registerResult.token) {
          console.log('Registration successful! Testing Stripe payment...');
          testStripePayment(registerResult.token);
        } else {
          console.log('Registration failed:', registerResult.message);
        }
      } catch (e) {
        console.log('Could not parse registration response');
      }
    });
  });

  registerReq.on('error', (e) => {
    console.error(`Registration request error: ${e.message}`);
  });

  registerReq.write(registerData);
  registerReq.end();
}

function testStripePayment(token) {
  console.log('Testing Stripe payment with fixed backend logic...');
  
  const paymentData = JSON.stringify({
    payment_intent_id: 'pi_test_1234567890',
    items: [{
      menu_item_id: 1,
      quantity: 2,
      price: 12.99  // This must match the database price
    }],
    order_type: 'delivery',
    delivery_address: '123 Test Street, Test City',
    customer_info: {
      full_name: 'Test User',
      phone: '+31612345678',
      email: 'stripetest@example.com'
    }
  });

  const paymentOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/payments/confirm-payment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': paymentData.length
    }
  };

  console.log('Testing Stripe payment with authentication...');

  const paymentReq = http.request(paymentOptions, (res) => {
    console.log(`Payment Status: ${res.statusCode}`);
    
    let paymentResponse = '';
    res.on('data', (chunk) => {
      paymentResponse += chunk;
    });
    
    res.on('end', () => {
      console.log('Payment Response:', paymentResponse);
      
      try {
        const paymentResult = JSON.parse(paymentResponse);
        console.log('Parsed Payment Response:', JSON.stringify(paymentResult, null, 2));
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Stripe payment test SUCCESSFUL!');
        } else {
          console.log('❌ Stripe payment test failed:', paymentResult.message);
        }
      } catch (e) {
        console.log('Could not parse payment response as JSON');
      }
    });
  });

  paymentReq.on('error', (e) => {
    console.error(`Payment request error: ${e.message}`);
  });

  paymentReq.write(paymentData);
  paymentReq.end();
}