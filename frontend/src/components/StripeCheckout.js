import React, { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  useTheme
} from '@mui/material';
import { Lock, CreditCard } from '@mui/icons-material';
import axios from 'axios';
import { getApiUrl } from '../utils/api';

// Configure axios
axios.defaults.baseURL = getApiUrl();
axios.defaults.withCredentials = true;

// Add request interceptor to include JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Load Stripe (use your publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef');

const CheckoutForm = ({ cartItems, total, deliveryData, pickupData, orderType, onSuccess, onError, clientSecret, testMode = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!testMode && (!stripe || !elements)) {
      return;
    }

    // Check if Payment Element is mounted and ready (skip for test mode)
    if (!testMode && elements) {
      const paymentElement = elements.getElement('payment');
      if (!paymentElement) {
        setError('Payment form is not ready. Please wait a moment and try again.');
        return;
      }
    }

    setLoading(true);
    setError('');

    // Check if this is a test mode payment
    const isTestMode = clientSecret && clientSecret.includes('pi_test_');
    
    let paymentIntent;
    let stripeError = null;
    
    if (isTestMode) {
      // Test mode: Simulate successful payment
      paymentIntent = {
        id: clientSecret.split('_secret_')[0],
        status: 'succeeded'
      };
    } else {
      // Real Stripe payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: 'if_required'
      });
      
      stripeError = result.error;
      paymentIntent = result.paymentIntent;
    }

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      try {
        // Create order after successful payment
        let orderData;
        if (orderType === 'delivery') {
          const deliveryAddress = `${deliveryData.street} ${deliveryData.houseNumber}, ${deliveryData.zipCode} ${deliveryData.city}`;
          orderData = {
            payment_intent_id: paymentIntent.id,
            items: cartItems.map(item => ({
              menu_item_id: item.id,
              quantity: item.quantity,
              price: parseFloat(item.price)
            })),
            order_type: 'delivery',
            delivery_address: deliveryAddress,
            special_instructions: deliveryData.description || '',
            customer_info: {
              full_name: deliveryData.fullName,
              phone: deliveryData.phone,
              email: deliveryData.email
            }
          };
        } else {
          orderData = {
            payment_intent_id: paymentIntent.id,
            items: cartItems.map(item => ({
              menu_item_id: item.id,
              quantity: item.quantity,
              price: parseFloat(item.price)
            })),
            order_type: 'pickup',
            pickup_time: pickupData.pickupTime,
            special_instructions: '',
            customer_info: {
              full_name: pickupData.fullName,
              phone: pickupData.phone,
              email: pickupData.email
            }
          };
        }

        const response = await axios.post(`${process.env.REACT_APP_API_URL}/payments/confirm-payment`, orderData);
        
        if (response.data.message === 'Order created successfully') {
          onSuccess(response.data.order);
        } else {
          setError('Order creation failed. Please contact support.');
        }
      } catch (error) {
        console.error('Error creating order:', error);
        
        // Check if it's an authentication error
        if (error.response?.status === 401) {
          setError('Please login to complete your order.');
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          setError('Order creation failed. Please contact support.');
        }
      }
    }

    setLoading(false);
  };

  const paymentElementOptions = {
    layout: 'tabs',
    paymentMethodOrder: ['card', 'ideal', 'link'],
    fields: {
      billingDetails: {
        name: 'auto',
        email: 'auto'
      }
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Lock sx={{ mr: 1, color: theme.palette.success.main }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Secure Payment
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        {testMode ? (
          <Box sx={{ p: 3, border: '2px dashed #ccc', borderRadius: 2, textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              🧪 Test Mode Payment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This is a test payment. No real payment will be processed.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Payment Information
            </Typography>
            <Box 
              sx={{ 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 1,
                '&:focus-within': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }}
            >
              <PaymentElement options={paymentElementOptions} />
            </Box>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Total: €{total.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
            <CreditCard sx={{ mr: 0.5, fontSize: 16 }} />
            <Typography variant="caption">
              Powered by Stripe
            </Typography>
          </Box>
        </Box>
        
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={(testMode ? false : !stripe) || loading || !clientSecret}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Lock />}
          sx={{
            backgroundColor: theme.palette.success.main,
            '&:hover': {
              backgroundColor: theme.palette.success.dark,
            },
            py: 1.5,
          }}
        >
          {loading ? 'Processing...' : testMode ? `Test Pay €${total.toFixed(2)}` : `Pay €${total.toFixed(2)}`}
        </Button>
      </form>
      
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
        Your payment information is secure and encrypted
      </Typography>
    </Paper>
  );
};

const StripeCheckout = ({ cartItems, total, deliveryData, pickupData, orderType, onSuccess, onError }) => {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    const createPaymentIntent = async () => {
      try {
        const response = await axios.post('/payments/create-payment-intent', {
          amount: total,
          currency: 'eur',
          payment_method_types: ['card', 'ideal', 'link']
        });
        setClientSecret(response.data.client_secret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        onError('Failed to initialize payment. Please try again.');
      }
    };

    if (total > 0) {
      createPaymentIntent();
    }
  }, [total, onError]);

  // Check if this is test mode
  const isTestMode = clientSecret && clientSecret.includes('pi_test_');
  
  const options = {
    clientSecret: isTestMode ? 'pi_fake_client_secret_for_test' : clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  if (!clientSecret) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Initializing payment...</Typography>
        </Box>
      </Paper>
    );
  }

  if (isTestMode) {
    // For test mode, render a simplified checkout form without Stripe Elements
    return (
      <CheckoutForm 
        cartItems={cartItems}
        total={total}
        deliveryData={deliveryData}
        pickupData={pickupData}
        orderType={orderType}
        onSuccess={onSuccess}
        onError={onError}
        clientSecret={clientSecret}
        testMode={true}
      />
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        cartItems={cartItems} 
        total={total} 
        deliveryData={deliveryData}
        pickupData={pickupData}
        orderType={orderType}
        onSuccess={onSuccess} 
        onError={onError}
        clientSecret={clientSecret}
        testMode={false}
      />
    </Elements>
  );
};

export default StripeCheckout;