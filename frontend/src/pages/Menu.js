import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [activeCategory, setActiveCategory] = useState(0); // For scroll highlighting
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [categories, setCategories] = useState(['All']);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance monitoring
  const { recordMetric } = usePerformanceMonitor('Menu');
  
  // Refs for category sections
  const categoryRefs = useRef({});
  const observerRef = useRef(null);

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

  // Group menu items by category
  const groupedItems = useMemo(() => {
    const grouped = {};
    categories.forEach(category => {
      if (category === 'All') {
        // For 'All' category, we don't create a separate group
        // Instead, we'll show all categories with their items
        return;
      } else {
        // Filter items based on search and whether 'All' is selected
        const filteredItems = menuItems.filter(item => {
          const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
          
          if (selectedCategory === 0) {
            // 'All' is selected - show all items in their respective categories
            return item.category_name === category && matchesSearch;
          } else {
            // Specific category is selected - only show items from that category
            return item.category_name === category && 
                   category === categories[selectedCategory] && 
                   matchesSearch;
          }
        });
        
        grouped[category] = filteredItems;
      }
    });
    return grouped;
  }, [menuItems, categories, searchTerm, selectedCategory]);

  // Intersection Observer for automatic category switching
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryName = entry.target.getAttribute('data-category');
            const categoryIndex = categories.findIndex(cat => cat === categoryName);
            if (categoryIndex !== -1) {
              // Always update activeCategory for highlighting
              setActiveCategory(categoryIndex);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0.1
      }
    );

    // Observe all category sections
    Object.values(categoryRefs.current).forEach(ref => {
      if (ref) {
        observerRef.current.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [categories, selectedCategory]);

  // Scroll to category when tab is clicked
  const scrollToCategory = useCallback((categoryName) => {
    const categoryElement = categoryRefs.current[categoryName];
    if (categoryElement) {
      const offset = 120; // Account for sticky header
      const elementPosition = categoryElement.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleAddToCart = useCallback((item) => {
    addToCart(item);
    setSnackbar({ open: true, message: `${item.name} added to cart!` });
  }, [addToCart]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar({ open: false, message: '' });
  }, []);

  const handleCategoryChange = useCallback((event, newValue) => {
    setSelectedCategory(newValue);
    setActiveCategory(newValue);
    const categoryName = categories[newValue];
    if (categoryName) {
      scrollToCategory(categoryName);
    }
  }, [categories, scrollToCategory]);

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
    <Box>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 0 }}>
        {/* Header */}
        <Typography
          variant="h3"
          component="h1"
          textAlign="center"
          sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.secondary.main }}
        >
          Our Menu
        </Typography>

        {/* Search */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
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
      </Container>

      {/* Category Tabs - Sticky Full Width */}
      <Box 
        sx={{ 
          position: 'sticky',
          top: 64, // Height of the header/navbar - will stick to main header when scrolling
          zIndex: 100,
          backgroundColor: 'white',
          py: { xs: 1, sm: 2 },
          mt: 0,
          mb: 0, 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        <Container maxWidth="lg">
          <Tabs
            value={selectedCategory === 0 ? activeCategory : selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              width: '100%',
              maxWidth: '100%',
              '& .MuiTabs-flexContainer': {
                justifyContent: { xs: 'flex-start', md: 'center' }
              },
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: '80px', sm: '120px' },
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1.5 },
                whiteSpace: 'nowrap'
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
                color: theme.palette.primary.main
              },
              '& .MuiTabs-indicator': {
                height: { xs: 2, sm: 3 }
              }
            }}
          >
            {categories.map((category, index) => (
              <Tab key={category} label={category && typeof category === 'string' ? category : 'Unknown'} />
            ))}
          </Tabs>
        </Container>
      </Box>

      {/* Menu Items by Category */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {categories.map((category) => {
          const categoryItems = groupedItems[category] || [];
          
          // Skip 'All' category in the display since we show individual categories
          if (category === 'All') return null;
          
          // When 'All' is selected (selectedCategory === 0), show all categories for intersection observer
          // When specific category is selected, only show that category
          if (selectedCategory !== 0 && selectedCategory !== categories.findIndex(cat => cat === category)) {
            return null;
          }
          
          // Skip empty categories when searching
          if (categoryItems.length === 0 && searchTerm) return null;
          
          return (
            <Box
              key={category}
              ref={(el) => {
                if (el) {
                  categoryRefs.current[category] = el;
                }
              }}
              data-category={category}
              sx={{ mb: 4 }}
            >
              {/* Category Title */}
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  mb: 3,
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {category}
              </Typography>
              
              {/* Category Items */}
              {categoryItems.length > 0 && (
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
                  {categoryItems.map((item) => (
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
              )}
            </Box>
          );
        })}

        {Object.values(groupedItems).every(items => items.length === 0) && (
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