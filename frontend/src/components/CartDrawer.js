import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Divider,
  Badge,
  useTheme,
} from '@mui/material';
import {
  Close,
  Add,
  Remove,
  Delete,
  ShoppingCartCheckout,
  ShoppingCart,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Helper function to get full image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const cleanBaseUrl = baseUrl.replace('/api', '');
  return `${cleanBaseUrl}${imageUrl}`;
};

const CartDrawer = () => {
  const theme = useTheme();
  const {
    isOpen,
    setIsOpen,
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getCartItemsCount,
  } = useCart();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart />
            Cart
            <Badge badgeContent={getCartItemsCount()} color="primary" />
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add some delicious items from our menu!
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/menu"
              onClick={handleClose}
              sx={{
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              Browse Menu
            </Button>
          </Box>
        ) : (
          <>
            {/* Items List */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              <List sx={{ p: 0 }}>
                {cartItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1,
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      }}
                    >
                      <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                        <ListItemAvatar>
                          <Avatar
                            src={getImageUrl(item.image_url) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                            alt={item.name}
                            sx={{ width: 56, height: 56, borderRadius: 1 }}
                            variant="rounded"
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {item.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              €{parseFloat(item.price).toFixed(2)} each
                            </Typography>
                          }
                          sx={{ ml: 2, mr: 1 }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {/* Quantity Controls */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography
                            variant="body2"
                            sx={{
                              minWidth: 30,
                              textAlign: 'center',
                              fontWeight: 'bold',
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1,
                              px: 1,
                              py: 0.25,
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          €{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < cartItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              
              {/* Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Total:
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                  }}
                >
                  €{getCartTotal().toFixed(2)}
                </Typography>
              </Box>
              
              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingCartCheckout />}
                  component={Link}
                  to="/cart"
                  onClick={handleClose}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                    py: 1.5,
                  }}
                >
                  View Cart & Checkout
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  to="/menu"
                  onClick={handleClose}
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
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default CartDrawer;