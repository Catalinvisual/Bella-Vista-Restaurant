import React, { memo, useMemo, useState, useCallback } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Chip
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';

// Helper function to get full image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  // Lasă imaginile SVG inline (data:image/svg+xml) nemodificate
  if (imageUrl.startsWith('data:image/svg+xml')) return imageUrl;
  if (imageUrl.startsWith('http')) return imageUrl;
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const cleanBaseUrl = baseUrl.replace('/api', '');
  return `${cleanBaseUrl}${imageUrl}`;
};

// Helper function to get label color based on label type (matching admin dashboard)
const getLabelColor = (label) => {
  switch (label) {
    case 'new':
      return '#4caf50';  // Green
    case 'promotion':
      return '#ff9800';  // Orange
    case 'sold':
      return '#f44336';  // Red
    case 'popular':
      return '#9c27b0';  // Purple
    case 'limited':
      return '#2196f3';  // Blue
    default:
      return '#757575';  // Gray
  }
};

const ProductCard = memo(({ item, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);



  const imageUrl = useMemo(() => {
    return getImageUrl(item.image_url) || 'https://placehold.co/300x200/f5f5f5/666666?text=No+Image';
  }, [item.image_url]);

  const formattedPrice = useMemo(() => {
    return `€${parseFloat(item.price).toFixed(2)}`;
  }, [item.price]);

  const handleAddToCart = useCallback(() => {
    onAddToCart(item);
  }, [onAddToCart, item]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  return (
    <Card
      sx={{
        height: { xs: '180px', sm: '420px', md: '380px', lg: '360px' },
        width: '100%',
        minWidth: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: { xs: 'row', sm: 'column' },
        // Custom styling for medium mobile screens (480px-600px)
        '@media (min-width: 480px) and (max-width: 599px)': {
          height: '200px',
          flexDirection: 'row'
        },
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }
      }}
    >
      <Box sx={{ 
        position: 'relative', 
        width: { xs: '180px', sm: '100%' }, 
        // Custom width for medium mobile screens
        '@media (min-width: 480px) and (max-width: 599px)': {
          width: '200px'
        },
        flexShrink: 0 
      }}>
        <Box
          sx={{
            width: '100%',
            height: { xs: '180px', sm: '160px', md: '140px', lg: '120px' },
            // Custom height for medium mobile screens
            '@media (min-width: 480px) and (max-width: 599px)': {
              height: '200px'
            },
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {!imageLoaded && !imageError && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          )}
          <CardMedia
            component="img"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
            image={imageUrl}
            alt={item.name}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {/* Only show specific product labels, not category labels */}
          {item.label && ['new', 'promotion', 'sold', 'popular', 'limited'].includes(item.label.toLowerCase()) && (
            <Chip
              label={
                item.label === 'sold' ? 'Sold Out' :
                item.label === 'limited' ? 'Limited Time' :
                item.label.charAt(0).toUpperCase() + item.label.slice(1)
              }
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                backgroundColor: getLabelColor(item.label),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                height: '20px',
                zIndex: 2,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          )}
        </Box>

      </Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        height: { xs: '180px', sm: 'auto' },
        // Custom height for medium mobile screens
        '@media (min-width: 480px) and (max-width: 599px)': {
          height: '200px'
        },
        overflow: 'hidden'
      }}>
        <CardContent sx={{ 
          flexGrow: 1, 
          p: { xs: 1, sm: 1.5 },
          pb: { xs: 0.5, sm: 1 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <Typography
            gutterBottom
            variant="h6"
            component="div"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1.1rem', md: '1rem' },
              fontWeight: 600,
              lineHeight: 1.2,
              mb: { xs: 0.5, sm: 1 },
              display: '-webkit-box',
              WebkitLineClamp: { xs: 1, sm: 2 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {item.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              lineHeight: 1.3,
              mb: { xs: 0.5, sm: 1 },
              display: '-webkit-box',
              WebkitLineClamp: { xs: 3, sm: 2 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexGrow: 1
            }}
          >
            {item.description}
          </Typography>
          <Typography
            variant="h6"
            color="primary"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1rem' },
              mb: 0
            }}
          >
            {formattedPrice}
          </Typography>
        </CardContent>
        <Box sx={{ p: { xs: 1, sm: 1.5 }, pt: 0 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<ShoppingCart sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
            onClick={handleAddToCart}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: { xs: 0.5, sm: 1 },
              px: { xs: 1, sm: 2 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minHeight: { xs: '28px', sm: '36px' }
            }}
          >
            Add to Cart
          </Button>
        </Box>
      </Box>
    </Card>
  );
});

// Add display name for debugging
ProductCard.displayName = 'ProductCard';

export default ProductCard;