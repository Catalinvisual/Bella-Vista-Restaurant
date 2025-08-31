import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Box,
  Paper,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCartCheckout,
  ArrowBack,
  DeliveryDining,
  Storefront,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StripeCheckout from '../components/StripeCheckout';
import axios from 'axios';

// Configure axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

// Helper function to get full image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const cleanBaseUrl = baseUrl.replace('/api', '');
  return `${cleanBaseUrl}${imageUrl}`;
};

const Cart = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paymentMethod, setPaymentMethod] = useState(0); // 0 = stripe, 1 = cash on delivery
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'orderType', 'delivery', 'pickup', or 'payment'
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'
  const [deliveryData, setDeliveryData] = useState({
    fullName: '',
    phone: '',
    email: '',
    street: '',
    houseNumber: '',
    zipCode: '',
    city: '',
    description: ''
  });
  const [pickupData, setPickupData] = useState({
    fullName: '',
    email: '',
    pickupTime: ''
  });
  const [deliveryErrors, setDeliveryErrors] = useState({});

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setSnackbar({ open: true, message: 'Please login to proceed with checkout', severity: 'warning' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (cartItems.length === 0) {
      setSnackbar({ open: true, message: 'Your cart is empty', severity: 'warning' });
      return;
    }

    // Go to order type selection step
    setCheckoutStep('orderType');
  };

  const handleOrderTypeSelection = (type) => {
    setOrderType(type);
    if (type === 'delivery') {
      setCheckoutStep('delivery');
    } else {
      setCheckoutStep('pickup');
    }
  };

  const handlePickupInputChange = (field, value) => {
    setPickupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePickupData = () => {
    const errors = {};
    
    if (!pickupData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!pickupData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(pickupData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!pickupData.pickupTime) {
      errors.pickupTime = 'Please select a pickup time';
    }
    
    setDeliveryErrors(errors); // Reusing the same error state
    return Object.keys(errors).length === 0;
  };

  const handlePickupSubmit = () => {
    if (!isAuthenticated) {
      setSnackbar({ open: true, message: 'Please login to proceed with checkout', severity: 'warning' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    if (validatePickupData()) {
      setPaymentMethod(0); // Set to Stripe payment
      setCheckoutStep('payment');
    }
  };

  const validateDeliveryData = () => {
    const errors = {};
    if (!deliveryData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!deliveryData.phone.trim()) errors.phone = 'Phone number is required';
    if (!deliveryData.email.trim()) errors.email = 'Email address is required';
    if (!deliveryData.street.trim()) errors.street = 'Street is required';
    if (!deliveryData.houseNumber.trim()) errors.houseNumber = 'House number is required';
    if (!deliveryData.zipCode.trim()) errors.zipCode = 'Zip code is required';
    if (!deliveryData.city.trim()) errors.city = 'City is required';
    
    // Email validation
    if (deliveryData.email && !/\S+@\S+\.\S+/.test(deliveryData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setDeliveryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeliverySubmit = () => {
    if (!isAuthenticated) {
      setSnackbar({ open: true, message: 'Please login to proceed with checkout', severity: 'warning' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    if (validateDeliveryData()) {
      setPaymentMethod(0); // Set to Stripe payment
      setCheckoutStep('payment');
    }
  };

  const handleDeliveryInputChange = (field, value) => {
    setDeliveryData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (deliveryErrors[field]) {
      setDeliveryErrors(prev => ({ ...prev, [field]: '' }));
    }
  };



  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleStripeSuccess = (order) => {
    clearCart();
    setCheckoutStep('cart');
    setSnackbar({ open: true, message: 'Payment successful! Order placed.', severity: 'success' });
    setTimeout(() => navigate('/orders'), 2000);
  };

  const handleStripeError = (error) => {
    setSnackbar({ open: true, message: error || 'Payment failed. Please try again.', severity: 'error' });
  };

  const handleCashOnDelivery = async () => {
    if (!isAuthenticated) {
      setSnackbar({ open: true, message: 'Please login to proceed with checkout', severity: 'warning' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (cartItems.length === 0) {
      setSnackbar({ open: true, message: 'Your cart is empty', severity: 'warning' });
      return;
    }

    try {
      setLoading(true);
      
      // Prepare order data for cash on delivery
      let orderData;
      if (orderType === 'delivery') {
        const deliveryAddress = `${deliveryData.street} ${deliveryData.houseNumber}, ${deliveryData.zipCode} ${deliveryData.city}`;
        orderData = {
          items: cartItems.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: parseFloat(item.price)
          })),
          order_type: 'delivery',
          delivery_address: deliveryAddress,
          special_instructions: deliveryData.description || 'Cash on Delivery',
          payment_method: 'cash_on_delivery',
          customer_info: {
            full_name: deliveryData.fullName,
            phone: deliveryData.phone,
            email: deliveryData.email
          }
        };
      } else {
        orderData = {
          items: cartItems.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: parseFloat(item.price)
          })),
          order_type: 'pickup',
          pickup_time: pickupData.pickupTime,
          special_instructions: 'Cash on Pickup',
          payment_method: 'cash_on_delivery',
          customer_info: {
            full_name: pickupData.fullName,
            phone: null,
            email: pickupData.email
          }
        };
      }

      const response = await axios.post('/orders', orderData);
      
      if (response.data.message === 'Order created successfully') {
        clearCart();
        setCheckoutStep('cart');
        // Reset delivery data
        setDeliveryData({
          fullName: '',
          phone: '',
          email: '',
          street: '',
          houseNumber: '',
          zipCode: '',
          city: '',
          description: ''
        });
        setSnackbar({ open: true, message: 'Order placed successfully! Pay cash upon delivery.', severity: 'success' });
        setTimeout(() => navigate('/orders'), 2000);
      }
    } catch (error) {
      console.error('Cash on delivery checkout error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = getCartTotal();
    const tax = subtotal * 0.085;
    const deliveryFee = orderType === 'delivery' ? 3.99 : 0;
    return subtotal + tax + deliveryFee;
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Your Cart is Empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Looks like you haven't added any items to your cart yet.
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/menu"
          startIcon={<ArrowBack />}
          sx={{
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            px: 4,
            py: 1.5,
          }}
        >
          Browse Menu
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ 
          mb: { xs: 2, sm: 3, md: 4 }, 
          fontWeight: 'bold', 
          color: theme.palette.secondary.main,
          fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Shopping Cart
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
        {/* Cart Items */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            {cartItems.map((item) => (
              <Card key={item.id} sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                p: { xs: 1.5, sm: 2 }
              }}>
                <CardMedia
                  component="img"
                  sx={{ 
                    width: { xs: '100%', sm: 120 }, 
                    height: { xs: 200, sm: 120 }, 
                    borderRadius: 1,
                    mb: { xs: 1, sm: 0 }
                  }}
                  image={getImageUrl(item.image_url) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                  alt={item.name}
                />
                <CardContent sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  p: { xs: 1, sm: 2 }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    mb: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                    }}>
                      {item.name}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeFromCart(item.id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ 
                      mb: { xs: 1.5, sm: 2 }, 
                      flexGrow: 1,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    {item.description}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      order: { xs: 2, sm: 1 }
                    }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Remove />
                      </IconButton>
                      <Typography
                        variant="body1"
                        sx={{
                          minWidth: { xs: 35, sm: 40 },
                          textAlign: 'center',
                          fontWeight: 'bold',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          px: { xs: 0.5, sm: 1 },
                          py: 0.5,
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                    
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                        fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                        order: { xs: 1, sm: 2 }
                      }}
                    >
                      €{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ 
            p: { xs: 2, sm: 3 }, 
            position: { xs: 'static', lg: 'sticky' }, 
            top: 20,
            mt: { xs: 2, lg: 0 }
          }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>
              {checkoutStep === 'payment' ? 'Payment Method' : 'Order Summary'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            {checkoutStep === 'payment' && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setCheckoutStep('cart')}
                  sx={{ mb: 2 }}
                  startIcon={<ArrowBack />}
                >
                  Back to Cart
                </Button>
                
                {/* Payment Method Tabs */}
                <Box sx={{ mb: 3 }}>
                  <Tabs
                    value={paymentMethod}
                    onChange={(e, newValue) => setPaymentMethod(newValue)}
                    variant="fullWidth"
                    sx={{
                      '& .MuiTab-root': {
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    <Tab label="Pay with Stripe" />
                    <Tab label="Cash on Delivery" />
                  </Tabs>
                </Box>
              </>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {cartItems.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {item.name} × {item.quantity}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    €{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Subtotal:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                €{getCartTotal().toFixed(2)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Tax (8.5%):</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                €{(getCartTotal() * 0.085).toFixed(2)}
              </Typography>
            </Box>
            
            {orderType === 'delivery' && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Delivery Fee:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  €3.99
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                €{calculateTotal().toFixed(2)}
              </Typography>
            </Box>
            
            {checkoutStep === 'cart' ? (
              // Cart Summary View
              <>
                {!isAuthenticated && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Please <Link to="/login">login</Link> to proceed with checkout
                  </Alert>
                )}
                
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<ShoppingCartCheckout />}
                  onClick={handleCheckout}
                  disabled={!isAuthenticated}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                    py: 1.5,
                    mb: 2,
                  }}
                >
                  Proceed to Checkout
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={clearCart}
                  sx={{
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.error.main,
                      color: 'white',
                    },
                  }}
                >
                  Clear Cart
                </Button>
              </>
            ) : checkoutStep === 'orderType' ? (
              // Order Type Selection
              <>
                <Typography variant="h6" sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontWeight: 'bold',
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}>
                  How would you like to receive your order?
                </Typography>
                
                <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
                  <Grid item xs={12}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer', 
                        border: orderType === 'delivery' ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                        '&:hover': { boxShadow: 3 }
                      }}
                      onClick={() => handleOrderTypeSelection('delivery')}
                    >
                      <CardContent sx={{ 
                        textAlign: 'center', 
                        py: { xs: 2, sm: 3 },
                        px: { xs: 1.5, sm: 2 }
                      }}>
                        <Typography variant="h6" gutterBottom sx={{
                          fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                        }}>
                          🚚 Delivery
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}>
                          Get your order delivered to your address
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          mt: 1, 
                          fontWeight: 'bold',
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}>
                          + €3.99 delivery fee
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer', 
                        border: orderType === 'pickup' ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                        '&:hover': { boxShadow: 3 }
                      }}
                      onClick={() => handleOrderTypeSelection('pickup')}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{
                          fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                        }}>
                          🏪 Pickup
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}>
                          Pick up your order from our restaurant
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          mt: 1, 
                          fontWeight: 'bold', 
                          color: 'green',
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}>
                          No delivery fee
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setCheckoutStep('cart')}
                  startIcon={<ArrowBack />}
                >
                  Back to Cart
                </Button>
              </>
            ) : checkoutStep === 'pickup' ? (
              // Pickup Information Form
              <>
                <Typography variant="h6" sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontWeight: 'bold',
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                }}>
                  Pickup Information
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: { xs: 1.5, sm: 2 }, 
                  mb: { xs: 2, sm: 3 }
                }}>
                  <TextField
                    label="Full Name"
                    value={pickupData.fullName}
                    onChange={(e) => handlePickupInputChange('fullName', e.target.value)}
                    error={!!deliveryErrors.fullName}
                    helperText={deliveryErrors.fullName}
                    required
                    fullWidth
                  />
                  
                  <TextField
                    label="Email Address"
                    type="email"
                    value={pickupData.email}
                    onChange={(e) => handlePickupInputChange('email', e.target.value)}
                    error={!!deliveryErrors.email}
                    helperText={deliveryErrors.email}
                    required
                    fullWidth
                  />
                  
                  <TextField
                    label="Preferred Pickup Time"
                    type="datetime-local"
                    value={pickupData.pickupTime}
                    onChange={(e) => handlePickupInputChange('pickupTime', e.target.value)}
                    error={!!deliveryErrors.pickupTime}
                    helperText={deliveryErrors.pickupTime}
                    required
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, sm: 2 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCheckoutStep('orderType')}
                    sx={{ flex: 1 }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handlePickupSubmit}
                    sx={{
                      flex: 2,
                      backgroundColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    }}
                  >
                    Continue to Payment
                  </Button>
                </Box>
              </>
            ) : checkoutStep === 'delivery' ? (
              // Delivery Information Form
              <>
                <Typography variant="h6" sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontWeight: 'bold',
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                }}>
                  Delivery Information
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: { xs: 1.5, sm: 2 }, 
                  mb: { xs: 2, sm: 3 }
                }}>
                  <TextField
                    label="Full Name"
                    value={deliveryData.fullName}
                    onChange={(e) => handleDeliveryInputChange('fullName', e.target.value)}
                    error={!!deliveryErrors.fullName}
                    helperText={deliveryErrors.fullName}
                    required
                    fullWidth
                  />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Phone Number"
                        value={deliveryData.phone}
                        onChange={(e) => handleDeliveryInputChange('phone', e.target.value)}
                        error={!!deliveryErrors.phone}
                        helperText={deliveryErrors.phone}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email Address"
                        type="email"
                        value={deliveryData.email}
                        onChange={(e) => handleDeliveryInputChange('email', e.target.value)}
                        error={!!deliveryErrors.email}
                        helperText={deliveryErrors.email}
                        required
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        label="Street"
                        value={deliveryData.street}
                        onChange={(e) => handleDeliveryInputChange('street', e.target.value)}
                        error={!!deliveryErrors.street}
                        helperText={deliveryErrors.street}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="House Number"
                        value={deliveryData.houseNumber}
                        onChange={(e) => handleDeliveryInputChange('houseNumber', e.target.value)}
                        error={!!deliveryErrors.houseNumber}
                        helperText={deliveryErrors.houseNumber}
                        required
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Zip Code"
                        value={deliveryData.zipCode}
                        onChange={(e) => handleDeliveryInputChange('zipCode', e.target.value)}
                        error={!!deliveryErrors.zipCode}
                        helperText={deliveryErrors.zipCode}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        label="City"
                        value={deliveryData.city}
                        onChange={(e) => handleDeliveryInputChange('city', e.target.value)}
                        error={!!deliveryErrors.city}
                        helperText={deliveryErrors.city}
                        required
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    label="Description or Special Instructions"
                    value={deliveryData.description}
                    onChange={(e) => handleDeliveryInputChange('description', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Any special delivery instructions, allergies, or comments..."
                    fullWidth
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                   variant="outlined"
                   onClick={() => setCheckoutStep('orderType')}
                   sx={{ flex: 1 }}
                 >
                   Back
                 </Button>
                  <Button
                    variant="contained"
                    onClick={handleDeliverySubmit}
                    sx={{
                      flex: 2,
                      backgroundColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    }}
                  >
                    Continue to Payment
                  </Button>
                </Box>
              </>
            ) : (
              // Payment Methods View
              <>
                {/* Back button */}
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCheckoutStep('delivery')}
                    startIcon={<ArrowBack />}
                    sx={{ textTransform: 'none' }}
                  >
                    Back to Delivery Info
                  </Button>
                </Box>
                
                {/* Conditional rendering based on payment method */}
                {paymentMethod === 0 ? (
                  // Stripe Checkout
                  <Box>
                    <StripeCheckout
                      cartItems={cartItems}
                      total={calculateTotal()}
                      deliveryData={deliveryData}
                      pickupData={pickupData}
                      orderType={orderType}
                      onSuccess={handleStripeSuccess}
                      onError={handleStripeError}
                    />
                    
                    {/* Option to switch to Cash on Delivery */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Prefer to pay with cash?
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => setPaymentMethod(1)}
                        sx={{ textTransform: 'none' }}
                      >
                        Switch to Cash on Delivery
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  // Cash on Delivery
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {orderType === 'delivery' 
                        ? 'Pay with cash when your order is delivered to your door.' 
                        : 'Pay with cash when you pick up your order from the restaurant.'}
                    </Alert>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartCheckout />}
                      onClick={handleCashOnDelivery}
                      disabled={loading}
                      sx={{
                        backgroundColor: theme.palette.secondary.main,
                        '&:hover': {
                          backgroundColor: theme.palette.secondary.dark,
                        },
                        py: 1.5,
                        mb: 2,
                      }}
                    >
                      {loading ? 'Processing...' : orderType === 'delivery' ? 'Order with Cash on Delivery' : 'Order with Cash on Pickup'}
                    </Button>
                    
                    {/* Option to switch back to Stripe */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Want to pay online instead?
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => setPaymentMethod(0)}
                        sx={{ textTransform: 'none' }}
                      >
                        Switch to Stripe Payment
                      </Button>
                    </Box>
                  </>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          component={Link}
          to="/menu"
          startIcon={<ArrowBack />}
          sx={{
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
              color: 'white',
            },
          }}
        >
          Continue Shopping
        </Button>
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart;