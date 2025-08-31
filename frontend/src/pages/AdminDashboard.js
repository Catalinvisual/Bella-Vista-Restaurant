import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  Switch,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import {
  Restaurant,
  People,
  ShoppingCart,
  Add,
  Edit,
  Delete,
  TrendingUp,
  PhotoCamera,
  Image,
  EventNote,
} from '@mui/icons-material';
import { Checkbox } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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

const AdminDashboard = () => {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'menu', 'user', 'order', 'reservation'
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    menuItems: 0,
    totalReservations: 0,
  });
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
    is_featured: false,
    label: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitting, setSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [reservationStatus, setReservationStatus] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAllOrders, setSelectAllOrders] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard statistics
        const statsResponse = await axios.get('/admin/dashboard/stats');
        setStats(statsResponse.data);
        
        // Fetch recent orders
         const ordersResponse = await axios.get('/admin/orders?limit=10');
         const ordersData = ordersResponse.data.orders || [];
         setOrders(ordersData.sort((a, b) => b.id - a.id));
        
        // Fetch menu items
        const menuResponse = await axios.get('/menu/items');
        setMenuItems(menuResponse.data.items || []);
        
        // Fetch customers
        const customersResponse = await axios.get('/admin/users?role=customer&limit=10');
        setCustomers(customersResponse.data.users || []);
        
        // Fetch categories
        const categoriesResponse = await axios.get('/menu/categories');
        setCategories(categoriesResponse.data.categories || []);
        
        // Fetch reservations
         const reservationsResponse = await axios.get('/admin/reservations');
         const reservationsData = reservationsResponse.data.reservations || [];
         setReservations(reservationsData.sort((a, b) => b.id - a.id));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setSelectedItem(item);
    if (type === 'menu' && item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        category_id: item.category_id || '',
        image_url: item.image_url || '',
        is_available: item.is_available !== undefined ? item.is_available : true,
        is_featured: item.is_featured !== undefined ? item.is_featured : false,
        label: item.label || ''
      });
      setImagePreview(item.image_url || '');
    } else if (type === 'menu') {
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_available: true,
        is_featured: false,
        label: ''
      });
      setImagePreview('');
    } else if (type === 'order' && item) {
      setOrderStatus(item.status || '');
    } else if (type === 'reservation' && item) {
      setReservationStatus(item.status || '');
    }
    setImageFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setDialogType('');
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      image_url: '',
      is_available: true,
      is_featured: false,
      label: ''
    });
    setImageFile(null);
    setImagePreview('');
    setOrderStatus('');
    setReservationStatus('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmitOrderStatus = async () => {
    try {
      setSubmitting(true);
      
      await axios.patch(`/orders/${selectedItem.id}/status`, {
        status: orderStatus
      });
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedItem.id 
            ? { ...order, status: orderStatus }
            : order
        )
      );
      
      setSnackbar({
        open: true,
        message: 'Order status updated successfully',
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating order status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update order status',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReservationStatus = async () => {
    try {
      setSubmitting(true);
      
      await axios.patch(`/admin/reservations/${selectedItem.id}/status`, {
        status: reservationStatus
      });
      
      // Update the reservation in the local state
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === selectedItem.id 
            ? { ...reservation, status: reservationStatus }
            : reservation
        )
      );
      
      setSnackbar({
        open: true,
        message: 'Reservation status updated successfully',
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating reservation status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update reservation status',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Order selection handlers
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAllOrders = () => {
    if (selectAllOrders) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
    setSelectAllOrders(!selectAllOrders);
  };

  // Update selectAllOrders state when selectedOrders changes
  useEffect(() => {
    setSelectAllOrders(selectedOrders.length === orders.length && orders.length > 0);
  }, [selectedOrders, orders]);

  const handleSubmitMenuItem = async () => {
    try {
      setSubmitting(true);
      
      let imageUrl = formData.image_url;
      
      // Upload image if a new file was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      const submitData = {
        ...formData,
        image_url: imageUrl,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id)
      };
      
      if (selectedItem) {
        // Update existing item
        await axios.put(`/menu/items/${selectedItem.id}`, submitData);
        setSnackbar({ open: true, message: 'Menu item updated successfully!', severity: 'success' });
      } else {
        // Create new item
        await axios.post('/menu/items', submitData);
        setSnackbar({ open: true, message: 'Menu item created successfully!', severity: 'success' });
      }
      
      // Refresh menu items
      const menuResponse = await axios.get('/menu/items');
      setMenuItems(menuResponse.data.items || []);
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving menu item:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to save menu item', 
        severity: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await axios.delete(`/menu/items/${itemId}`);
        setSnackbar({ open: true, message: 'Menu item deleted successfully!', severity: 'success' });
        
        // Refresh menu items
        const menuResponse = await axios.get('/menu/items');
        setMenuItems(menuResponse.data.items || []);
      } catch (error) {
        console.error('Error deleting menu item:', error);
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Failed to delete menu item', 
          severity: 'error' 
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'preparing':
        return 'primary';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Box sx={{ order: { xs: 2, sm: 1 } }}>
            <Typography color="text.secondary" gutterBottom variant="h6" sx={{
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }
            }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              color,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            color, 
            opacity: 0.7,
            order: { xs: 1, sm: 2 },
            '& svg': {
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard data...
        </Typography>
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
        Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={12} sm={6} lg={2.4}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCart fontSize="large" />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <StatCard
            title="Revenue"
            value={`€${stats.totalRevenue.toFixed(2)}`}
            icon={<TrendingUp fontSize="large" />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <StatCard
            title="Customers"
            value={stats.totalCustomers}
            icon={<People fontSize="large" />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <StatCard
            title="Menu Items"
            value={stats.menuItems}
            icon={<Restaurant fontSize="large" />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <StatCard
            title="Reservations"
            value={stats.totalReservations}
            icon={<EventNote fontSize="large" />}
            color={theme.palette.secondary.main}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minHeight: { xs: 48, sm: 72 },
              flexDirection: { xs: 'column', sm: 'column' },
              gap: { xs: 0.5, sm: 1 }
            },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1rem', sm: '1.5rem' }
            }
          }}
        >
          <Tab label="Orders" icon={<ShoppingCart />} />
          <Tab label="Menu Items" icon={<Restaurant />} />
          <Tab label="Customers" icon={<People />} />
          <Tab label="Reservations" icon={<EventNote />} />
        </Tabs>
      </Paper>

      {/* Orders Tab */}
      {currentTab === 0 && (
        <Paper sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: { xs: 1.5, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>
              Recent Orders
            </Typography>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 800, md: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectAllOrders}
                      onChange={handleSelectAllOrders}
                      indeterminate={selectedOrders.length > 0 && selectedOrders.length < orders.length}
                    />
                  </TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} selected={selectedOrders.includes(order.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                      />
                    </TableCell>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{order.user?.name || order.customer_name || 'N/A'}</TableCell>
                    <TableCell>
                      {order.items?.map(item => `${item.name} (${item.quantity})`).join(', ') || 'N/A'}
                    </TableCell>
                    <TableCell>€{parseFloat(order.final_total || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleOpenDialog('order', order)}>
                        <Edit fontSize="small" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Menu Items Tab */}
      {currentTab === 1 && (
        <Paper sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: { xs: 1.5, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>
              Menu Items
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog('menu')}
              size={{ xs: 'small', sm: 'medium' }}
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 2, sm: 3 }
              }}
            >
              Add Item
            </Button>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 1000, md: 800 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 80 }}>Image</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Name</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Category</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Label</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Price</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Featured</TableCell>
                  <TableCell sx={{ minWidth: 120, position: 'sticky', right: 0, backgroundColor: 'background.paper', zIndex: 1 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Avatar
                        src={getImageUrl(item.image_url)}
                        alt={item.name}
                        sx={{ width: 50, height: 50 }}
                        variant="rounded"
                      >
                        <Image />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {item.description?.substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{item.category_name || item.category}</TableCell>
                    <TableCell>
                      {item.label && (
                        <Chip
                          label={item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                          size="small"
                          sx={{
                            backgroundColor: 
                              item.label === 'new' ? '#4caf50' :
                              item.label === 'promotion' ? '#ff9800' :
                              item.label === 'sold' ? '#f44336' :
                              item.label === 'popular' ? '#9c27b0' :
                              item.label === 'limited' ? '#2196f3' : '#757575',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>€{parseFloat(item.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.is_available ? 'Available' : 'Unavailable'}
                        color={item.is_available ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.is_featured ? 'Featured' : 'Regular'}
                        color={item.is_featured ? 'primary' : 'default'}
                        size="small"
                        variant={item.is_featured ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell sx={{ position: 'sticky', right: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
                      <Button size="small" onClick={() => handleOpenDialog('menu', item)} sx={{ mr: 1 }}>
                        <Edit fontSize="small" />
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDeleteMenuItem(item.id)}>
                        <Delete fontSize="small" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Customers Tab */}
      {currentTab === 2 && (
        <Paper sx={{ p: { xs: 1, sm: 2 } }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}>
            Customers
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 600, md: 500 } }}>
              <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Orders</TableCell>
                    <TableCell>Total Spent</TableCell>
                    <TableCell>Join Date</TableCell>
                  </TableRow>
                </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.full_name || customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.total_orders || 0}</TableCell>
                    <TableCell>€{parseFloat(customer.total_spent || 0).toFixed(2)}</TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Reservations Tab */}
      {currentTab === 3 && (
        <Paper sx={{ p: { xs: 1, sm: 2 } }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}>
            Reservations
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 800, md: 700 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Guests</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>#{reservation.id}</TableCell>
                    <TableCell>{reservation.name}</TableCell>
                    <TableCell>{reservation.email}</TableCell>
                    <TableCell>{reservation.phone}</TableCell>
                    <TableCell>{reservation.guests}</TableCell>
                    <TableCell>{new Date(reservation.reservation_date).toLocaleDateString()}</TableCell>
                    <TableCell>{reservation.reservation_time}</TableCell>
                    <TableCell>
                      <Chip
                        label={reservation.status}
                        color={reservation.status === 'confirmed' ? 'success' : reservation.status === 'pending' ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleOpenDialog('reservation', reservation)}>
                        <Edit fontSize="small" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit' : 'Add'} {dialogType === 'menu' ? 'Menu Item' : dialogType === 'order' ? 'Order' : 'Item'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'menu' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Name"
                fullWidth
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
              
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category_id}
                  label="Category"
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Price"
                type="number"
                fullWidth
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
              
              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
              
              <FormControl fullWidth>
                <InputLabel>Label</InputLabel>
                <Select
                  value={formData.label}
                  label="Label"
                  onChange={(e) => handleInputChange('label', e.target.value)}
                >
                  <MenuItem value="">No Label</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="promotion">Promotion</MenuItem>
                  <MenuItem value="sold">Sold Out</MenuItem>
                  <MenuItem value="popular">Popular</MenuItem>
                  <MenuItem value="limited">Limited Time</MenuItem>
                </Select>
              </FormControl>
              
              {/* Image Upload Section */}
              <Box sx={{ border: '1px dashed #ccc', borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Product Image</Typography>
                
                {imagePreview && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Avatar
                      src={getImageUrl(imagePreview)}
                      alt="Preview"
                      sx={{ width: 120, height: 120, mx: 'auto' }}
                      variant="rounded"
                    >
                      <Image />
                    </Avatar>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    size="small"
                  >
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  
                  {imagePreview && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        handleInputChange('image_url', '');
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Recommended: 400x300px, JPG or PNG, max 5MB
                </Typography>
              </Box>
              
              {/* Additional Options */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_available}
                      onChange={(e) => handleInputChange('is_available', e.target.checked)}
                    />
                  }
                  label="Available for Order"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    />
                  }
                  label="Featured Item"
                />
              </Box>
            </Box>
          )}
          {dialogType === 'order' && (
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="preparing">Preparing</MenuItem>
                  <MenuItem value="ready">Ready</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          {dialogType === 'reservation' && (
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={reservationStatus}
                  onChange={(e) => setReservationStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={dialogType === 'menu' ? handleSubmitMenuItem : dialogType === 'order' ? handleSubmitOrderStatus : dialogType === 'reservation' ? handleSubmitReservationStatus : handleCloseDialog}
            disabled={submitting || (dialogType === 'menu' && (!formData.name || !formData.description || !formData.price || !formData.category_id))}
          >
            {submitting ? <CircularProgress size={20} /> : (selectedItem ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default AdminDashboard;