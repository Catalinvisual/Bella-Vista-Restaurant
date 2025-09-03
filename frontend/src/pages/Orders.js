import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ShoppingCart,
  Receipt,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../utils/api';

// Configure axios
axios.defaults.baseURL = getApiUrl();
axios.defaults.withCredentials = true;

// Add token to requests if available
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Orders = () => {
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('/orders/my-orders');
        setOrders(response.data.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your orders...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Receipt sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          My Orders
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <ShoppingCart sx={{ fontSize: 80, color: theme.palette.grey[400], mb: 2 }} />
          <Typography variant="h5" gutterBottom color="textSecondary">
            No Orders Yet
          </Typography>
          <Typography variant="body1" color="textSecondary">
            You haven't placed any orders yet. Start by browsing our menu!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {orders.map((order) => (
            <Card key={order.id} sx={{ overflow: 'visible' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Order #{order.id}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTime sx={{ fontSize: 16, color: theme.palette.grey[600] }} />
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(order.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={order.status || 'Unknown'}
                      color={getStatusColor(order.status)}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      €{parseFloat(order.final_total || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Order Items:
                </Typography>
                
                {order.items && order.items.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="center">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {item.menu_item_name || item.name}
                              </Typography>
                              {item.description && (
                                <Typography variant="caption" color="textSecondary">
                                  {item.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">€{parseFloat(item.price || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">
                              €{(parseFloat(item.price || 0) * parseInt(item.quantity || 0)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No items found for this order.
                  </Typography>
                )}
                
                {/* Order Total Breakdown */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 300, ml: 'auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">€{parseFloat(order.total_amount || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tax:</Typography>
                    <Typography variant="body2">€{parseFloat(order.tax_amount || 0).toFixed(2)}</Typography>
                  </Box>
                  {order.delivery_fee > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Delivery Fee:</Typography>
                      <Typography variant="body2">€{parseFloat(order.delivery_fee || 0).toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>€{parseFloat(order.final_total || 0).toFixed(2)}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Orders;