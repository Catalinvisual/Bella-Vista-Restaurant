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
  const [popularDishes, setPopularDishes] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const response = await axios.post('/newsletter/subscribe', {
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
        setPopularDishes(response.data.items || []);
      } catch (err) {
        console.error('Error fetching featured items:', err);
        // Fallback to empty array if API fails
        setPopularDishes([]);
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