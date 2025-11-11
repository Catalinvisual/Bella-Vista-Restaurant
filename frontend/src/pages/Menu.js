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
  alpha,
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

  // Ensure page starts from top after refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        
        // Static categories for presentation
        const staticCategories = ['All', 'Pizza', 'Pasta', 'Salads', 'Burgers', 'Desserts', 'Beverages'];
        
        try {
          // Try to fetch categories from API
          const categoriesResponse = await axios.get('/menu/categories');
          const fetchedCategories = ['All', ...categoriesResponse.data.categories
            .filter(cat => cat.name && typeof cat.name === 'string')
            .map(cat => cat.name)];
          
          // Merge static categories with API categories
          const mergedCategories = [...new Set([...staticCategories, ...fetchedCategories])];
          setCategories(mergedCategories);
        } catch (catError) {
          // If categories fetch fails, use static categories
          console.warn('Failed to fetch categories from API, using static categories');
          setCategories(staticCategories);
        }
        
        try {
          // Fetch menu items
          const itemsResponse = await axios.get('/menu/items');
          const menuItems = itemsResponse.data.items || [];
          setMenuItems(menuItems);
          
          apiTimer.end({ itemCount: menuItems.length });
          
          // Store in cache
          const menuData = {
            categories: staticCategories,
            items: menuItems
          };
          apiCache.set(cacheKey, menuData);
        } catch (itemsError) {
          // If items fetch fails, just use empty array (static items will be used)
          console.warn('Failed to fetch menu items from API, using static items only');
          setMenuItems([]);
          apiTimer.end({ itemCount: 0 });
          timer.end({ source: 'api', itemCount: 0 });
        }
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

  // Static fictional menu items for presentation
  const staticMenuItems = [
    // PIZZA CATEGORY
    {
      id: 'static-pizza-1',
      name: 'Classic Margherita Pizza',
      description: 'Traditional Italian pizza with fresh mozzarella, tomato sauce, and basil leaves on a crispy thin crust',
      price: 12.99,
      category_name: 'Pizza',
      image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23FDB813"/><circle cx="200" cy="150" r="120" fill="%23FF6347"/><circle cx="150" cy="100" r="15" fill="white"/><circle cx="250" cy="100" r="15" fill="white"/><circle cx="200" cy="200" r="15" fill="white"/><circle cx="150" cy="200" r="15" fill="white"/><circle cx="250" cy="200" r="15" fill="white"/></svg>',
      is_available: true
    },
    {
      id: 'static-pizza-2',
      name: 'Pepperoni Supreme Pizza',
      description: 'Classic pizza loaded with spicy pepperoni, mozzarella cheese, and our special tomato sauce',
      price: 14.99,
      category_name: 'Pizza',
      image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23FDB813"/><circle cx="200" cy="150" r="120" fill="%23FF6347"/><circle cx="150" cy="100" r="12" fill="%23FF3333"/><circle cx="250" cy="100" r="12" fill="%23FF3333"/><circle cx="200" cy="200" r="12" fill="%23FF3333"/><circle cx="150" cy="200" r="12" fill="%23FF3333"/><circle cx="250" cy="200" r="12" fill="%23FF3333"/><circle cx="170" cy="120" r="10" fill="white"/><circle cx="230" cy="120" r="10" fill="white"/><circle cx="200" cy="170" r="10" fill="white"/></svg>',
      is_available: true
    },
    {
      id: 'static-pizza-3',
      name: 'Vegetarian Garden Pizza',
      description: 'Healthy pizza with bell peppers, mushrooms, olives, onions, and fresh tomatoes',
      price: 13.99,
      category_name: 'Pizza',
      image_url: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 width%3D%22400%22 height%3D%22300%22 viewBox%3D%220 0 400 300%22%3E%3Crect width%3D%22400%22 height%3D%22300%22 fill%3D%22%23FFDB9F%22/%3E%3Ccircle cx%3D%22200%22 cy%3D%22150%22 r%3D%22120%22 fill%3D%22%23FF6347%22 stroke%3D%22%23CC4E39%22 stroke-width%3D%223%22/%3E%3Ccircle cx%3D%22160%22 cy%3D%22120%22 r%3D%2215%22 fill%3D%22%23FF4500%22/%3E%3Ccircle cx%3D%22240%22 cy%3D%22120%22 r%3D%2215%22 fill%3D%22%23FF4500%22/%3E%3Ccircle cx%3D%22200%22 cy%3D%22160%22 r%3D%2215%22 fill%3D%22%23FF4500%22/%3E%3Crect x%3D%22150%22 y%3D%22180%22 width%3D%2220%22 height%3D%2220%22 fill%3D%22%2390EE90%22/%3E%3Crect x%3D%22230%22 y%3D%22180%22 width%3D%2220%22 height%3D%2220%22 fill%3D%22%2390EE90%22/%3E%3Ccircle cx%3D%22180%22 cy%3D%22190%22 r%3D%228%22 fill%3D%22%23FFD700%22/%3E%3Ccircle cx%3D%22220%22 cy%3D%22190%22 r%3D%228%22 fill%3D%22%23FFD700%22/%3E%3C/svg%3E',
      is_available: true
    },
    // PASTA CATEGORY
    {
      id: 'static-pasta-1',
      name: 'Creamy Chicken Alfredo',
      description: 'Fettuccine pasta tossed in rich parmesan cream sauce with grilled chicken breast and fresh parsley',
      price: 14.99,
      category_name: 'Pasta',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxNTAiIHJ4PSIxMDAiIHJ5PSI2MCIgZmlsbD0iI0ZGRDhEMyIgc3Ryb2tlPSIjRkY2MzQ3IiBzdHJva2Utd2lkdGg9IjMiLz4KPGVsbGlwc2UgY3g9IjE1MCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPC9zdmc+',
      is_available: true
    },
    {
      id: 'static-pasta-2',
      name: 'Spaghetti Carbonara',
      description: 'Traditional Italian pasta with crispy bacon, egg, parmesan cheese, and black pepper',
      price: 13.99,
      category_name: 'Pasta',
      image_url: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 width%3D%22400%22 height%3D%22300%22 viewBox%3D%220 0 400 300%22%3E%3Crect width%3D%22400%22 height%3D%22300%22 fill%3D%22%23FFF8DC%22/%3E%3Cellipse cx%3D%22200%22 cy%3D%22150%22 rx%3D%22140%22 ry%3D%22100%22 fill%3D%22%23FFEBCD%22/%3E%3Cpath d%3D%22M120 120 Q200 100 280 120 Q200 140 120 120%22 stroke%3D%22%23FFD700%22 stroke-width%3D%228%22 fill%3D%22none%22/%3E%3Cpath d%3D%22M130 140 Q200 120 270 140 Q200 160 130 140%22 stroke%3D%22%23FFD700%22 stroke-width%3D%228%22 fill%3D%22none%22/%3E%3Cpath d%3D%22M140 160 Q200 140 260 160 Q200 180 140 160%22 stroke%3D%22%23FFD700%22 stroke-width%3D%228%22 fill%3D%22none%22/%3E%3Cpath d%3D%22M150 180 Q200 160 250 180 Q200 200 150 180%22 stroke%3D%22%23FFD700%22 stroke-width%3D%228%22 fill%3D%22none%22/%3E%3Ccircle cx%3D%22160%22 cy%3D%22130%22 r%3D%225%22 fill%3D%22%23FF6347%22/%3E%3Ccircle cx%3D%22240%22 cy%3D%22150%22 r%3D%225%22 fill%3D%22%23FF6347%22/%3E%3Ccircle cx%3D%22180%22 cy%3D%22170%22 r%3D%225%22 fill%3D%22%23FF6347%22/%3E%3C/svg%3E',
      is_available: true
    },
    {
      id: 'static-pasta-3',
      name: 'Seafood Linguine',
      description: 'Fresh linguine pasta with mixed seafood in white wine and garlic sauce',
      price: 16.99,
      category_name: 'Pasta',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxNTAiIHJ4PSIxMjAiIHJ5PSI4MCIgZmlsbD0iI0ZGRDhEMyIgc3Ryb2tlPSIjRkY2MzQ3IiBzdHJva2Utd2lkdGg9IjMiLz4KPGVsbGlwc2UgY3g9IjE1MCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMTAiIGZpbGw9IiNGRjYzNDciLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMTAiIGZpbGw9IiNGRjYzNDciLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMTAiIGZpbGw9IiNGRjYzNDciLz4KPGNpcmNsZSBjeD0iMTcwIiBjeT0iMTUwIiByPSI2IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjIzMCIgY3k9IjE1MCIgcj0iNiIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4=',
      is_available: true
    },
    // SALADS CATEGORY
    {
      id: 'static-salad-1',
      name: 'Fresh Caesar Salad',
      description: 'Crisp romaine lettuce with parmesan cheese, croutons, and our signature Caesar dressing',
      price: 8.99,
      category_name: 'Salads',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxNTAiIHJ4PSIxNDAiIHJ5PSIxMDAiIGZpbGw9IiM5MEVFOTAiLz4KPGVsbGlwc2UgY3g9IjE1MCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGVsbGlwc2UgY3g9IjE3MCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGVsbGlwc2UgY3g9IjIzMCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPC9zdmc+',
      is_available: true
    },
    {
      id: 'static-salad-2',
      name: 'Greek Village Salad',
      description: 'Fresh tomatoes, cucumbers, red onions, olives, and feta cheese with olive oil dressing',
      price: 9.99,
      category_name: 'Salads',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxNTAiIHJ4PSIxNDAiIHJ5PSIxMDAiIGZpbGw9IiM5MEVFOTAiLz4KPHJlY3QgeD0iMTcwIiB5PSIxMjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI0ZGNjM0NyIgcng9IjUiLz4KPHJlY3QgeD0iMjEwIiB5PSIxMjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI0ZGNjM0NyIgcng9IjUiLz4KPHJlY3QgeD0iMTUwIiB5PSIxNzAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI0ZGRiIgcng9IjUiLz4KPHJlY3QgeD0iMjMwIiB5PSIxNzAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI0ZGRiIgcng9IjUiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTAwIiByPSIxMiIgZmlsbD0iIzhCNjM0NyIvPgo8L3N2Zz4=',
      is_available: true
    },
    {
      id: 'static-salad-3',
      name: 'Avocado Quinoa Bowl',
      description: 'Nutritious quinoa with ripe avocado, cherry tomatoes, corn, and lime vinaigrette',
      price: 11.99,
      category_name: 'Salads',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxNTAiIHJ4PSIxNDAiIHJ5PSIxMDAiIGZpbGw9IiM5MEVFOTAiLz4KPGVsbGlwc2UgY3g9IjE3MCIgY3k9IjEyMCIgcng9IjIwIiByeT0iMjUiIGZpbGw9IiM5MEVFOTAiLz4KPGVsbGlwc2UgY3g9IjIzMCIgY3k9IjEyMCIgcng9IjIwIiByeT0iMjUiIGZpbGw9IiM5MEVFOTAiLz4KPGNpcmNsZSBjeD0iMTUwIiBjeT0iMTcwIiByPSIxNSIgZmlsbD0iI0ZGRiIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzAiIHI9IjE1IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE5MCIgcj0iMTUiIGZpbGw9IiNGRkYiLz4KPC9zdmc+',
      is_available: true
    },
    // BURGERS CATEGORY
    {
      id: 'static-burger-1',
      name: 'Gourmet Beef Burger',
      description: 'Juicy beef patty with lettuce, tomato, onion, cheese, and our special sauce on a toasted bun',
      price: 11.99,
      category_name: 'Burgers',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxyZWN0IHg9IjgwIiB5PSI4MCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0Q0QTU2QiIgcng9IjE1Ii8+CjxyZWN0IHg9IjgwIiB5PSIxMTAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRjYzNDciIHJ4PSIxMCIvPgo8cmVjdCB4PSI4MCIgeT0iMTMwIiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjOTBFRTkwIiByeD0iMTAiLz4KPHJlY3QgeD0iODAiIHk9IjE1MCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0Q0QTU2QiIgcng9IjE1Ii8+CjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEyMCIgcj0iNiIgZmlsbD0iI0ZGRiIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMjAiIHI9IjYiIGZpbGw9IiNGRkYiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTIwIiByPSI2IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjI0MCIgY3k9IjEyMCIgcj0iNiIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4=',
      is_available: true
    },
    {
      id: 'static-burger-2',
      name: 'BBQ Bacon Burger',
      description: 'Beef patty with crispy bacon, BBQ sauce, cheddar cheese, onion rings, and pickles',
      price: 13.99,
      category_name: 'Burgers',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxyZWN0IHg9IjgwIiB5PSI3MCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0Q0QTU2QiIgcng9IjE1Ii8+CjxyZWN0IHg9IjgwIiB5PSIxMDAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRjYzNDciIHJ4PSIxMCIvPgo8cmVjdCB4PSI4MCIgeT0iMTIwIiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjOTBFRTkwIiByeD0iMTAiLz4KPHJlY3QgeD0iODAiIHk9IjE0MCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSIyMCIgZmlsbD0iI0ZGNjM0NyIgcng9IjEwIi8+CjxyZWN0IHg9IjgwIiB5PSIxNjAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMzAiIGZpbGw9IiNENEE1NkIiIHJ4PSIxNSIvPgo8Y2lyY2xlIGN4PSIxMjAiIGN5PSIxMTAiIHI9IjYiIGZpbGw9IiNGRkYiLz4KPGNpcmNsZSBjeD0iMTYwIiBjeT0iMTEwIiByPSI2IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjExMCIgcj0iNiIgZmlsbD0iI0ZGRiIvPgo8Y2lyY2xlIGN4PSIyNDAiIGN5PSIxMTAiIHI9IjYiIGZpbGw9IiNGRkYiLz4KPC9zdmc+',
      is_available: true
    },
    {
      id: 'static-burger-3',
      name: 'Mushroom Swiss Burger',
      description: 'Beef patty with sautéed mushrooms, Swiss cheese, caramelized onions, and garlic mayo',
      price: 12.99,
      category_name: 'Burgers',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxyZWN0IHg9IjgwIiB5PSI3NSIgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0Q0QTU2QiIgcng9IjE1Ii8+CjxyZWN0IHg9IjgwIiB5PSIxMDUiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRjYzNDciIHJ4PSIxMCIvPgo8cmVjdCB4PSI4MCIgeT0iMTI1IiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjOTBFRTkwIiByeD0iMTAiLz4KPHJlY3QgeD0iODAiIHk9IjE0NSIgd2lkdGg9IjI0MCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzhCNjM0NyIgcng9IjEwIi8+CjxyZWN0IHg9IjgwIiB5PSIxNjUiIHdpZHRoPSIyNDAiIGhlaWdodD0iMzAiIGZpbGw9IiNENEE1NkIiIHJ4PSIxNSIvPgo8Y2lyY2xlIGN4PSIxMzAiIGN5PSIxMzUiIHI9IjgiIGZpbGw9IiM4QjYzNDciLz4KPGNpcmNsZSBjeD0iMTcwIiBjeT0iMTM1IiByPSI4IiBmaWxsPSIjOEI2MzQ3Ii8+CjxjaXJjbGUgY3g9IjIxMCIgY3k9IjEzNSIgcj0iOCIgZmlsbD0iIzhCNjM0NyIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxMzUiIHI9IjgiIGZpbGw9IiM4QjYzNDciLz4KPC9zdmc+',
      is_available: true
    },
    // DESSERTS CATEGORY
    {
      id: 'static-dessert-1',
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with a molten center, served with vanilla ice cream',
      price: 7.99,
      category_name: 'Desserts',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiM4QjQ1MTMiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI2MCIgZmlsbD0iIzNFMjcyMyIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMTAiIHI9IjgiIGZpbGw9IiNGRkYiLz4KPGNpcmNsZSBjeD0iMjQwIiBjeT0iMTEwIiByPSI4IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE5MCIgcj0iOCIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4=',
      is_available: true
    },
    {
      id: 'static-dessert-2',
      name: 'Tiramisu Classic',
      description: 'Traditional Italian dessert with coffee-soaked ladyfingers and mascarpone cream',
      price: 6.99,
      category_name: 'Desserts',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxyZWN0IHg9IjgwIiB5PSI4MCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzhCNjM0NyIgcng9IjUiLz4KPHJlY3QgeD0iODAiIHk9IjEyMCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI0ZGRiIgcng9IjUiLz4KPHJlY3QgeD0iODAiIHk9IjE2MCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzhCNjM0NyIgcng9IjUiLz4KPHJlY3QgeD0iODAiIHk9IjIwMCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI0ZGRiIgcng9IjUiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iMTAwIiByPSI4IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjEwMCIgcj0iOCIgZmlsbD0iI0ZGRiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxMDAiIHI9IjgiIGZpbGw9IiNGRkYiLz4KPGNpcmNsZSBjeD0iMjQwIiBjeT0iMTAwIiByPSI4IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjI4MCIgY3k9IjEwMCIgcj0iOCIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4=',
      is_available: true
    },
    {
      id: 'static-dessert-3',
      name: 'Fresh Fruit Tart',
      description: 'Buttery tart crust filled with vanilla cream and topped with seasonal fresh fruits',
      price: 8.99,
      category_name: 'Desserts',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiNGRkY4RDMiIHN0cm9rZT0iI0RkQTU2QiIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjEyMCIgcj0iMTIiIGZpbGw9IiNGRjMzMzMiLz4KPGNpcmNsZSBjeD0iMjQwIiBjeT0iMTIwIiByPSIxMiIgZmlsbD0iI0ZGNzUwMCIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNjAiIHI9IjEyIiBmaWxsPSIjOTBFRTkwIi8+CjxjaXJjbGUgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTIiIGZpbGw9IiNGRkYiLz4KPGNpcmNsZSBjeD0iMjQwIiBjeT0iMTgwIiByPSIxMiIgZmlsbD0iI0ZGRiIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxODAiIHI9IjEyIiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjI0MCIgY3k9IjE4MCIgcj0iMTIiIGZpbGw9IiNGRkYiLz4KPC9zdmc+',
      is_available: true
    },
    // BEVERAGES CATEGORY
    {
      id: 'static-beverage-1',
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice with pulp, served chilled',
      price: 4.99,
      category_name: 'Beverages',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxyZWN0IHg9IjE1MCIgeT0iNjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkZGIiByeD0iMTUiIHN0cm9rZT0iI0ZGOEEwMCIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxMDAiIHJ4PSIzMCIgcnk9IjUwIiBmaWxsPSIjRkZBOjAwIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxNTAiIHJ4PSIyNSIgcnk9IjQwIiBmaWxsPSIjRkY5NTAwIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIyMDAiIHJ4PSIyMCIgcnk9IjMwIiBmaWxsPSIjRkY4QTAwIi8+Cjwvc3ZnPg==',
      is_available: true
    },
    {
      id: 'static-beverage-2',
      name: 'Iced Caramel Latte',
      description: 'Rich espresso with cold milk, caramel syrup, and whipped cream over ice',
      price: 5.99,
      category_name: 'Beverages',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxyZWN0IHg9IjE1MCIgeT0iNDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjIwIiBmaWxsPSIjRkZGIiByeD0iMTUiIHN0cm9rZT0iIzhCNjM0NyIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxyZWN0IHg9IjE1MCIgeT0iMjAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjOEY0NjI2Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMjIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRkZGIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSI4MCIgcng9IjI1IiByeT0iNDAiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjEzMCIgcng9IjIwIiByeT0iMzAiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjE3MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkY4RDMiLz4KPC9zdmc+',
      is_available: true
    },
    {
      id: 'static-beverage-3',
      name: 'Strawberry Smoothie',
      description: 'Fresh strawberries blended with yogurt, honey, and ice for a refreshing drink',
      price: 6.99,
      category_name: 'Beverages',
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxyZWN0IHg9IjE1MCIgeT0iNDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjIwIiBmaWxsPSIjRkZGIiByeD0iMTUiIHN0cm9rZT0iI0ZGMzMzMyIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxyZWN0IHg9IjE1MCIgeT0iMjAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRkY2MzQ3Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMjIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRkZGIi8+CjxlbGxpcHNlIGN4PSIxODAiIGN5PSI4MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRjMzMzMiLz4KPGVsbGlwc2UgY3g9IjIyMCIgY3k9IjEwMCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRjMzMzMiLz4KPGVsbGlwc2UgY3g9IjE2MCIgY3k9IjE0MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRjMzMzMiLz4KPGVsbGlwc2UgY3g9IjI0MCIgY3k9IjE2MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRjMzMzMiLz4KPC9zdmc+',
      is_available: true
    }
  ];

  // Group menu items by category
  const groupedItems = useMemo(() => {
    const grouped = {};
    
    // Add static items first
    staticMenuItems.forEach(item => {
      if (!grouped[item.category_name]) {
        grouped[item.category_name] = [];
      }
      grouped[item.category_name].push(item);
    });
    
    // Add API items if available
    categories.forEach(category => {
      if (category === 'All') {
        return;
      } else {
        const filteredItems = menuItems.filter(item => {
          const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
          
          if (selectedCategory === 0) {
            return item.category_name === category && matchesSearch;
          } else {
            return item.category_name === category && 
                   category === categories[selectedCategory] && 
                   matchesSearch;
          }
        });
        
        if (filteredItems.length > 0) {
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category] = [...grouped[category], ...filteredItems];
        }
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
          {/* Error message removed for live presentation */}
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      {/* Category Tabs - Sticky Full Width - Positioned above Our Menu title */}
      <Box 
        sx={{ 
          position: 'sticky',
          top: 64, // Height of main header only
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
                minWidth: { xs: 'auto', sm: 120 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 3
              }
            }}
          >
            {categories.map((category, index) => (
              <Tab key={index} label={category} />
            ))}
          </Tabs>
        </Container>
      </Box>

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
                      // Medium Mobile: 480px-600px - 1 product per row  
                      '@media (min-width: 480px) and (max-width: 600px)': {
                        width: '100%'
                      },
                      // Medium Mobile: 600px-767px - 2 products per row  
                      '@media (min-width: 600px) and (max-width: 767px)': {
                        width: '50%'
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