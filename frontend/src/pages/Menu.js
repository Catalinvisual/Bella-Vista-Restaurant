import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Button,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import apiCache from '../utils/apiCache';
import performanceMonitor, { usePerformanceMonitor } from '../utils/performanceMonitor';
import { getApiUrl } from '../utils/api';

// Configure axios
axios.defaults.baseURL = getApiUrl();
axios.defaults.withCredentials = true;

const Menu = () => {
  const theme = useTheme();
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [categories, setCategories] = useState(['All']);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance monitoring
  const { recordMetric } = usePerformanceMonitor('Menu');

  // Fetch categories and menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      const timer = performanceMonitor.startTiming('menu-data-fetch');
      
      try {
        setLoading(true);
        setError(null);
        
        // Check cache first
        const cacheKey = 'menu-data';
        const cachedData = apiCache.get(cacheKey);
        
        if (cachedData) {
          setCategories(cachedData.categories);
          setMenuItems(cachedData.items);
          setLoading(false);
          timer.end({ source: 'cache', itemCount: cachedData.items.length });
          return;
        }
        
        // Fetch from API if not in cache
        const apiTimer = performanceMonitor.startTiming('menu-api-calls');
        
        // Fetch categories
        const categoriesResponse = await axios.get('/menu/categories');
        const fetchedCategories = ['All', ...categoriesResponse.data.categories
          .filter(cat => cat.name && typeof cat.name === 'string')
          .map(cat => cat.name)];
        
        // Fetch menu items
        const itemsResponse = await axios.get('/menu/items');
        const menuItems = itemsResponse.data.items || [];
        
        apiTimer.end({ itemCount: menuItems.length });
        
        // Store in cache
        const menuData = {
          categories: fetchedCategories,
          items: menuItems
        };
        apiCache.set(cacheKey, menuData);
        
        setCategories(fetchedCategories);
        setMenuItems(menuItems);
        
        timer.end({ source: 'api', itemCount: menuItems.length });
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError('Failed to load menu items. Please try again later.');
        timer.end({ error: true });
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const filteredItems = useMemo(() => {
    const startTime = performance.now();
    const filtered = menuItems.filter(item => {
      const matchesCategory = selectedCategory === 0 || item.category_name === categories[selectedCategory];
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    const filterTime = performance.now() - startTime;
    recordMetric('filter-operation', { duration: filterTime, resultCount: filtered.length, totalItems: menuItems.length });
    return filtered;
  }, [menuItems, selectedCategory, categories, searchTerm, recordMetric]);

  const handleAddToCart = useCallback((item) => {
    addToCart(item);
    setSnackbar({ open: true, message: `${item.name} added to cart!` });
  }, [addToCart]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar({ open: false, message: '' });
  }, []);

  const handleCategoryChange = useCallback((event, newValue) => {
    setSelectedCategory(newValue);
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  if (loading) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Box sx={{ textAlign: 'center' }}>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Typography
          variant="h3"
          component="h1"
          textAlign="center"
          gutterBottom
          sx={{ mb: 4, fontWeight: 'bold', color: theme.palette.secondary.main }}
        >
          Our Menu
        </Typography>

        {/* Search */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <TextField
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400, width: '100%' }}
          />
        </Box>

        {/* Category Tabs - Sticky */}
        <Box 
          sx={{ 
            position: 'sticky',
            top: 64, // Height of the header/navbar
            zIndex: 100,
            backgroundColor: 'white',
            py: { xs: 1, sm: 2 },
            mb: 4, 
            display: 'flex', 
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="centered"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              width: '100%',
              maxWidth: '100%',
              display: 'flex',
              justifyContent: 'center',
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center'
              },
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: '80px', sm: '120px' },
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1.5 }
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
              '& .MuiTabs-indicator': {
                height: { xs: 2, sm: 3 }
              }
            }}
          >
            {categories.map((category, index) => (
              <Tab key={category} label={category} />
            ))}
          </Tabs>
        </Box>

        {/* Menu Items */}
        <Box 
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            width: '100%',
            margin: 0,
            '& > *': {
              boxSizing: 'border-box'
            }
          }}
        >
          {filteredItems.map((item) => (
            <Box 
              key={item.id}
              sx={{
                // Small Mobile: under 480px - 1 product per row
                width: { xs: '100%' },
                // Medium Mobile: 480px-767px - 1 product per row  
                '@media (min-width: 480px) and (max-width: 767px)': {
                  width: '100%'
                },
                // Small Tablet: 768px-991px - 2 products per row
                '@media (min-width: 768px) and (max-width: 991px)': {
                  width: '50%'
                },
                // Large Tablet/Laptop: 992px-1199px - 3 products per row
                '@media (min-width: 992px) and (max-width: 1199px)': {
                  width: '33.333%'
                },
                // Desktop: 1200px+ - 4-5 products per row (using 4 for consistency)
                '@media (min-width: 1200px)': {
                  width: '25%'
                },
                display: 'flex',
                minWidth: 0,
                padding: { xs: 1, sm: 1.5 },
                '& > *': {
                  width: '100%',
                  minWidth: '100%',
                  maxWidth: '100%',
                  flex: 'none'
                }
              }}
            >
              <ProductCard
                item={item}
                onAddToCart={handleAddToCart}
                showAddToCart={true}
              />
            </Box>
          ))}
        </Box>

        {filteredItems.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No items found matching your search.
            </Typography>
          </Box>
        )}
      </Container>

      {/* Snackbar for cart notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Menu;