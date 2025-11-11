import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  useTheme,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Restaurant,
  LocalDining,
  DeliveryDining,
  Star,
  FormatQuote,
  ShoppingCart,
  CheckCircle,
  Email,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import AnimatedSection from '../components/AnimatedSection';
import axios from 'axios';
import { getApiUrl } from '../utils/api';

// Configure axios
axios.defaults.baseURL = getApiUrl();
axios.defaults.withCredentials = true;

const Home = () => {
  const theme = useTheme();
  const { addToCart } = useCart();
  
  // Static popular dishes for presentation
  const staticPopularDishes = [
    {
      id: 'popular-1',
      name: 'Margherita Pizza',
      description: 'Traditional Italian pizza with fresh mozzarella, tomato sauce, and basil leaves on a crispy thin crust',
      price: 12.99,
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iMTIwIiBmaWxsPSIjRkY2MzQ3Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMTUiIGZpbGw9IiNGRkYiLz4KPGNpcmNsZSBjeD0iMjUwIiBjeT0iMTAwIiByPSIxNSIgZmlsbD0iI0ZGRiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjE1IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjIwMCIgcj0iMTUiIGZpbGw9IiNGRkYiLz4KPGNpcmNsZSBjeD0iMjUwIiBjeT0iMjAwIiByPSIxNSIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4=',
      is_available: true
    },
    {
      id: 'popular-2',
      name: 'Chicken Alfredo Pasta',
      description: 'Fettuccine pasta tossed in rich parmesan cream sauce with grilled chicken breast and fresh parsley',
      price: 14.99,
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxNTAiIHJ4PSIxMDAiIHJ5PSI2MCIgZmlsbD0iI0ZGRDhEMyIgc3Ryb2tlPSIjRkY2MzQ3IiBzdHJva2Utd2lkdGg9IjMiLz4KPGVsbGlwc2UgY3g9IjE1MCIgY3k9IjEyMCIgcng9IjIwIiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjEyMCIgcng9IjIwIiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjE4MCIgcng9IjIwIiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjE1MCIgY3k9IjE4MCIgcng9IjIwIiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjE4MCIgcng9IjIwIiByeT0iMTUiIGZpbGw9IiNGRkY4RDMiLz4KPC9zdmc+',
      is_available: true
    },
    {
      id: 'popular-3',
      name: 'Fresh Caesar Salad',
      description: 'Crisp romaine lettuce with parmesan cheese, croutons, and our signature Caesar dressing',
      price: 8.99,
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIxNTAiIHJ4PSIxNDAiIHJ5PSIxMDAiIGZpbGw9IiM5MEVFOTAiLz4KPGVsbGlwc2UgY3g9IjE1MCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGVsbGlwc2UgY3g9IjE3MCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGVsbGlwc2UgY3g9IjIzMCIgY3k9IjE4MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPC9zdmc+',
      is_available: true
    },
    {
      id: 'popular-4',
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with a molten center, served with vanilla ice cream',
      price: 7.99,
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZEQjlGIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiM4QjQ1MTMiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI2MCIgZmlsbD0iIzNFMjcyMyIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMTAiIHI9IjgiIGZpbGw9IiNGRkYiLz4KPGNpcmNsZSBjeD0iMjQwIiBjeT0iMTEwIiByPSI4IiBmaWxsPSIjRkZGIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE5MCIgcj0iOCIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4=',
      is_available: true
    },
    {
      id: 'popular-5',
      name: 'Vegetarian Garden Pizza',
      description: 'Fresh vegetable medley with bell peppers, mushrooms, olives, and mozzarella on tomato basil sauce',
      price: 12.99,
      image_url: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 width%3D%22400%22 height%3D%22300%22 viewBox%3D%220 0 400 300%22%3E%3Crect width%3D%22400%22 height%3D%22300%22 fill%3D%22%23FFDB9F%22/%3E%3Ccircle cx%3D%22200%22 cy%3D%22150%22 r%3D%22120%22 fill%3D%22%23FF6347%22 stroke%3D%22%23CC4E39%22 stroke-width%3D%223%22/%3E%3Ccircle cx%3D%22160%22 cy%3D%22120%22 r%3D%2215%22 fill%3D%22%23FF4500%22/%3E%3Ccircle cx%3D%22240%22 cy%3D%22120%22 r%3D%2215%22 fill%3D%22%23FF4500%22/%3E%3Ccircle cx%3D%22200%22 cy%3D%22160%22 r%3D%2215%22 fill%3D%22%23FF4500%22/%3E%3Crect x%3D%22150%22 y%3D%22180%22 width%3D%2220%22 height%3D%2220%22 fill%3D%22%2390EE90%22/%3E%3Crect x%3D%22230%22 y%3D%22180%22 width%3D%2220%22 height%3D%2220%22 fill%3D%22%2390EE90%22/%3E%3Ccircle cx%3D%22180%22 cy%3D%22190%22 r%3D%228%22 fill%3D%22%23FFD700%22/%3E%3Ccircle cx%3D%22220%22 cy%3D%22190%22 r%3D%228%22 fill%3D%22%23FFD700%22/%3E%3C/svg%3E',
      is_available: true
    },
    {
      id: 'popular-6',
      name: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta with creamy egg sauce, pancetta, parmesan, and black pepper',
      price: 13.99,
      image_url: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 width%3D%22400%22 height%3D%22300%22 viewBox%3D%220 0 400 300%22%3E%3Crect width%3D%22400%22 height%3D%22300%22 fill%3D%22%23FFF8DC%22/%3E%3Cellipse cx%3D%22200%22 cy%3D%22150%22 rx%3D%22140%22 ry%3D%22100%22 fill%3D%22%23FFEBCD%22/%3E%3Cpath d%3D%22M120 120 Q200 100 280 120 Q200 140 120 120%22 stroke%3D%22%23FFD700%22 stroke-width%3D%228%22 fill%3D%22none%22/%3E%3Cpath d%3D%22M130 140 Q200 120 270 140 Q200 160 130 140%22 stroke%3D%22%23FFD700%22 stroke-width%3D%228%22 fill%3D%22none%22/%3E%3Cpath d%3D%22M140 160 Q200 140 260 160 Q200 180 140 160%22 stroke%3D%22%23FFD700%22 stroke-width%3D%228%22 fill%3D%22none%22/%3E%3Cpath d%3D%22M150 180 Q200 160 250 180 Q200 200 150 180%22 stroke%3D%22%23FFD700%22 stroke-width%3D%228%22 fill%3D%22none%22/%3E%3Ccircle cx%3D%22160%22 cy%3D%22130%22 r%3D%225%22 fill%3D%22%23FF6347%22/%3E%3Ccircle cx%3D%22240%22 cy%3D%22150%22 r%3D%225%22 fill%3D%22%23FF6347%22/%3E%3Ccircle cx%3D%22180%22 cy%3D%22170%22 r%3D%225%22 fill%3D%22%23FF6347%22/%3E%3C/svg%3E',
      is_available: true
    },
    {
      id: 'popular-7',
      name: 'BBQ Bacon Burger',
      description: 'Juicy beef patty with crispy bacon, tangy BBQ sauce, cheddar cheese, and onion rings',
      price: 13.99,
      image_url: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 width%3D%22400%22 height%3D%22300%22 viewBox%3D%220 0 400 300%22%3E%3Crect width%3D%22400%22 height%3D%22300%22 fill%3D%22%23FFDB9F%22/%3E%3Crect x%3D%2280%22 y%3D%2270%22 width%3D%22240%22 height%3D%2230%22 fill%3D%22%23D4A56B%22 rx%3D%2215%22/%3E%3Crect x%3D%2280%22 y%3D%22100%22 width%3D%22240%22 height%3D%2220%22 fill%3D%22%23FF6347%22 rx%3D%2210%22/%3E%3Crect x%3D%2280%22 y%3D%22120%22 width%3D%22240%22 height%3D%2220%22 fill%3D%22%2390EE90%22 rx%3D%2210%22/%3E%3Crect x%3D%2280%22 y%3D%22140%22 width%3D%22240%22 height%3D%2220%22 fill%3D%22%23FF6347%22 rx%3D%2210%22/%3E%3Crect x%3D%2280%22 y%3D%22160%22 width%3D%22240%22 height%3D%2230%22 fill%3D%22%23D4A56B%22 rx%3D%2215%22/%3E%3Ccircle cx%3D%22120%22 cy%3D%22110%22 r%3D%226%22 fill%3D%22%23FFF%22/%3E%3Ccircle cx%3D%22160%22 cy%3D%22110%22 r%3D%226%22 fill%3D%22%23FFF%22/%3E%3Ccircle cx%3D%22200%22 cy%3D%22110%22 r%3D%226%22 fill%3D%22%23FFF%22/%3E%3Ccircle cx%3D%22240%22 cy%3D%22110%22 r%3D%226%22 fill%3D%22%23FFF%22/%3E%3C/svg%3E',
      is_available: true
    },
    {
      id: 'popular-8',
      name: 'Tiramisu Classic',
      description: 'Traditional Italian dessert with coffee-soaked ladyfingers, mascarpone cream, and cocoa',
      price: 7.99,
      image_url: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 width%3D%22400%22 height%3D%22300%22 viewBox%3D%220 0 400 300%22%3E%3Crect width%3D%22400%22 height%3D%22300%22 fill%3D%22%23FFDB9F%22/%3E%3Crect x%3D%22120%22 y%3D%2280%22 width%3D%22160%22 height%3D%22140%22 fill%3D%22%23F5DEB3%22 rx%3D%2210%22/%3E%3Crect x%3D%22130%22 y%3D%2290%22 width%3D%22140%22 height%3D%2220%22 fill%3D%22%238B4513%22/%3E%3Crect x%3D%22130%22 y%3D%22120%22 width%3D%22140%22 height%3D%2220%22 fill%3D%22%23FFF%22/%3E%3Crect x%3D%22130%22 y%3D%22150%22 width%3D%22140%22 height%3D%2220%22 fill%3D%22%238B4513%22/%3E%3Crect x%3D%22130%22 y%3D%22180%22 width%3D%22140%22 height%3D%2220%22 fill%3D%22%23FFF%22/%3E%3Crect x%3D%22120%22 y%3D%22220%22 width%3D%22160%22 height%3D%2220%22 fill%3D%22%23D2691E%22/%3E%3C/svg%3E',
      is_available: true
    },
    {
      id: 'popular-6',
      name: 'Iced Caramel Latte',
      description: 'Rich espresso with cold milk, caramel syrup, and whipped cream over ice',
      price: 5.99,
      image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGRkYwIi8+CjxyZWN0IHg9IjE1MCIgeT0iNDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjIwIiBmaWxsPSIjRkZGIiByeD0iMTUiIHN0cm9rZT0iIzhCNjM0NyIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxyZWN0IHg9IjE1MCIgeT0iMjAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjOEY0NjI2Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMjIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRkZGIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSI4MCIgcng9IjI1IiByeT0iNDAiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjEzMCIgcng9IjIwIiByeT0iMzAiIGZpbGw9IiNGRkY4RDMiLz4KPGVsbGlwc2UgY3g9IjIwMCIgY3k9IjE3MCIgcng9IjE1IiByeT0iMjAiIGZpbGw9IiNGRkY4RDMiLz4KPC9zdmc+',
      is_available: true
    }
  ];

  const [popularDishes, setPopularDishes] = useState(staticPopularDishes);
  const [loading, setLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const features = [
    {
      icon: <Restaurant fontSize="large" />,
      title: 'Fresh Ingredients',
      description: 'We source the finest, freshest ingredients from local farms and trusted suppliers.',
    },
    {
      icon: <LocalDining fontSize="large" />,
      title: 'Expert Chefs',
      description: 'Our experienced chefs craft each dish with passion and culinary expertise.',
    },
    {
      icon: <DeliveryDining fontSize="large" />,
      title: 'Fast Delivery',
      description: 'Enjoy our delicious meals delivered hot and fresh to your doorstep.',
    },
    {
      icon: <Star fontSize="large" />,
      title: '5-Star Experience',
      description: 'We provide exceptional service and an unforgettable dining experience.',
    },
  ];

  // Handle add to cart
  const handleAddToCart = (dish) => {
    addToCart({
      id: dish.id,
      name: dish.name,
      price: parseFloat(dish.price),
      image_url: dish.image_url,
      quantity: 1
    });
  };

  // Handle newsletter subscription
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'error'
      });
      return;
    }

    setNewsletterLoading(true);
    try {
      const response = await axios.post('newsletter/subscribe', {
        email: newsletterEmail
      });
      
      setSnackbar({
        open: true,
        message: 'Successfully subscribed! Check your email for a welcome message with your 15% discount code.',
        severity: 'success'
      });
      setNewsletterEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch featured items from API
  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/menu/featured');
        setPopularDishes(response.data.items || staticPopularDishes);
      } catch (err) {
        console.error('Error fetching featured items:', err);
        // Use staticPopularDishes defined above as fallback
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedItems();
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `
          linear-gradient(135deg, rgba(248, 245, 240, 0.95) 0%, rgba(245, 240, 235, 0.95) 50%, rgba(240, 235, 230, 0.95) 100%),
          radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(160, 82, 45, 0.1) 0%, transparent 50%),
          url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="0.5" fill="%23d4af37" opacity="0.1"/><circle cx="75" cy="75" r="0.3" fill="%23cd853f" opacity="0.1"/><circle cx="50" cy="10" r="0.4" fill="%23daa520" opacity="0.1"/><circle cx="10" cy="60" r="0.3" fill="%23b8860b" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="%23d2691e" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>')
        `,
        backgroundSize: 'cover, 400px 400px, 300px 300px, 100px 100px',
        backgroundPosition: 'center, top left, bottom right, 0 0',
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat, repeat',
        backgroundAttachment: 'fixed, scroll, scroll, scroll'
      }}
    >
      {/* Hero Section */}
      <AnimatedSection animation="fadeIn" duration={1.2}>
        <Box
          sx={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: { xs: '60vh', sm: '65vh', md: '70vh' },
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center',
          }}
        >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.75rem' }
            }}
          >
            Welcome to Bella Vista
          </Typography>
          <Typography
            variant="h5"
            component="p"
            gutterBottom
            sx={{ 
              mb: 4, 
              opacity: 0.9,
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              px: { xs: 2, sm: 0 }
            }}
          >
            Experience culinary excellence with our authentic flavors and warm hospitality
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            px: { xs: 2, sm: 0 }
          }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/menu"
              sx={{
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                px: 4,
                py: 1.5,
              }}
            >
              View Menu
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/reservations"
              sx={{
                borderColor: 'white',
                color: 'white',
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.primary.main,
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                },
                px: 4,
                py: 1.5,
              }}
            >
              Make Reservation
            </Button>
          </Box>
        </Container>
        </Box>
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection animation="fadeInUp" duration={0.8}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ 
              mb: { xs: 4, sm: 5, md: 6 }, 
              fontWeight: 'bold', 
              color: theme.palette.secondary.main,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
            }}
          >
            Why Choose Us
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ justifyContent: 'center' }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <AnimatedSection 
                  animation="fadeInUp" 
                  delay={index * 0.2} 
                  duration={0.6}
                  threshold={0.2}
                >
                  <Box
                    sx={{
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: { xs: 2, sm: 2.5, md: 3 },
                      borderRadius: 2,
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                  >
                <Box
                  sx={{
                    color: theme.palette.primary.main,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: '100%'
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: '250px'
                  }}
                >
                  {feature.description}
                </Typography>
                  </Box>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </AnimatedSection>

      {/* Popular Dishes Section */}
      <AnimatedSection animation="fadeInUp" duration={0.8}>
        <Box sx={{ backgroundColor: '#f8f9fa', py: { xs: 4, sm: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              component="h2"
              textAlign="center"
              gutterBottom
              sx={{ 
                mb: { xs: 4, sm: 5, md: 6 }, 
                fontWeight: 'bold', 
                color: theme.palette.secondary.main,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
              }}
            >
              Popular Dishes
            </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
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
              {popularDishes.map((dish, index) => (
                <Box 
                  key={dish.id || index}
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
                    // Desktop: 1200px+ - 4 products per row
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
                  <AnimatedSection 
                    animation="scaleIn" 
                    delay={index * 0.15} 
                    duration={0.6}
                    threshold={0.1}
                  >
                    <ProductCard
                      item={dish}
                      onAddToCart={handleAddToCart}
                      showAddToCart={true}
                    />
                  </AnimatedSection>
                </Box>
              ))}
            </Box>
          )}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/menu"
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                },
                px: 4,
                py: 1.5,
              }}
            >
              View Full Menu
            </Button>
          </Box>
        </Container>
        </Box>
      </AnimatedSection>

      {/* Customer Testimonials Section */}
      <AnimatedSection animation="fadeInUp" duration={0.8}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ 
              mb: { xs: 4, sm: 5, md: 6 }, 
              fontWeight: 'bold', 
              color: theme.palette.secondary.main,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
            }}
          >
            What Our Customers Say
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
            {[
              {
                 name: "Sarah Johnson",
                 review: "Absolutely amazing food and service! The pasta was perfectly cooked and the atmosphere was so welcoming. Will definitely be back!",
                 rating: 5,
                 image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
               },
              {
                name: "Michael Chen",
                review: "Best Italian restaurant in town! The pizza was authentic and the staff was incredibly friendly. Highly recommend the tiramisu!",
                rating: 5,
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
              },
              {
                name: "Emily Rodriguez",
                review: "Perfect for date night! The ambiance is romantic and the food is exceptional. The seafood risotto was the best I've ever had.",
                rating: 5,
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
              }
            ].map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <AnimatedSection 
                  animation="fadeInUp" 
                  delay={index * 0.2} 
                  duration={0.7}
                  threshold={0.2}
                >
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: { xs: 2, sm: 2.5, md: 3 },
                      borderRadius: 2,
                      backgroundColor: 'white',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                  >
                <FormatQuote
                  sx={{
                    fontSize: 40,
                    color: theme.palette.primary.main,
                    mb: 2,
                    transform: 'rotate(180deg)'
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{
                    fontStyle: 'italic',
                    mb: 3,
                    color: 'text.secondary',
                    lineHeight: 1.6
                  }}
                >
                  "{testimonial.review}"
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2
                  }}
                >
                  <Box
                    component="img"
                    src={testimonial.image}
                    alt={testimonial.name}
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `3px solid ${theme.palette.primary.main}`
                    }}
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color: theme.palette.secondary.main
                      }}
                    >
                      {testimonial.name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          sx={{
                            color: '#FFD700',
                            fontSize: 18
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
                  </Box>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </AnimatedSection>

      {/* How It Works Section */}
      <AnimatedSection animation="fadeInUp" duration={0.8}>
        <Box sx={{ backgroundColor: theme.palette.background.default, py: { xs: 4, sm: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              component="h2"
              textAlign="center"
              gutterBottom
              sx={{ 
                mb: { xs: 4, sm: 5, md: 6 }, 
                fontWeight: 'bold', 
                color: theme.palette.secondary.main,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
              }}
            >
              How It Works
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
              {[
                {
                  icon: <Restaurant fontSize="large" />,
                  title: "Choose",
                  description: "Browse our delicious menu and select your favorite dishes",
                  step: "01"
                },
                {
                  icon: <ShoppingCart fontSize="large" />,
                  title: "Order",
                  description: "Place your order online or call us for pickup/delivery",
                  step: "02"
                },
                {
                  icon: <CheckCircle fontSize="large" />,
                  title: "Enjoy",
                  description: "Relax and enjoy your freshly prepared meal",
                  step: "03"
                }
              ].map((step, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <AnimatedSection 
                    animation="scaleIn" 
                    delay={index * 0.2} 
                    duration={0.6}
                    threshold={0.2}
                  >
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: { xs: 2, sm: 2.5, md: 3 },
                        position: 'relative',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.05)',
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    >
                  <Typography
                    variant="h1"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: 20,
                      fontSize: '4rem',
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                      opacity: 0.1,
                      zIndex: 0
                    }}
                  >
                    {step.step}
                  </Typography>
                  <Box
                    sx={{
                      color: theme.palette.primary.main,
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.secondary.main,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {step.description}
                  </Typography>
                    </Box>
                  </AnimatedSection>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </AnimatedSection>

      {/* Newsletter/Promo Section */}
      <AnimatedSection animation="fadeInUp" duration={0.8}>
        <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
          <Box
            sx={{
              textAlign: 'center',
              p: { xs: 3, sm: 4, md: 6 },
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
          <Email sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
            }}
          >
            Subscribe for Exclusive Offers
          </Typography>
          <Typography
            variant="h6"
            sx={{ 
              mb: 4, 
              opacity: 0.9,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
            }}
          >
            Get 15% off your first order when you subscribe to our newsletter!
          </Typography>
          <Box
            component="form"
            sx={{
              display: 'flex',
              gap: 2,
              maxWidth: 400,
              mx: 'auto',
              flexDirection: { xs: 'column', sm: 'row' }
            }}
            onSubmit={handleNewsletterSubmit}
          >
            <Box
              component="input"
              type="email"
              placeholder="Enter your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              disabled={newsletterLoading}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 1,
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                '&::placeholder': {
                  color: 'text.secondary'
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={newsletterLoading}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                px: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {newsletterLoading ? <CircularProgress size={20} color="inherit" /> : 'Subscribe'}
            </Button>
          </Box>
          <Typography
            variant="body2"
            sx={{ mt: 3, opacity: 0.8 }}
          >
            Join over 1,000 happy customers and never miss our special offers!
          </Typography>
        </Box>
      </Container>
      </AnimatedSection>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Home;