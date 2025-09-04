import React, { memo, useMemo, useState, useCallback } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';

// Helper function to get full image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const cleanBaseUrl = baseUrl.replace('/api', '');
  return `${cleanBaseUrl}${imageUrl}`;
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
        height: { xs: '140px', sm: '420px', md: '380px', lg: '360px' },
        width: '100%',
        minWidth: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: { xs: 'row', sm: 'column' },
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }
      }}
    >
      <Box sx={{ position: 'relative', width: { xs: '140px', sm: '100%' }, flexShrink: 0 }}>
        <Box
          sx={{
            width: '100%',
            height: { xs: '140px', sm: '160px', md: '140px', lg: '120px' },
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
        </Box>

      </Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        height: { xs: '140px', sm: 'auto' },
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
              WebkitLineClamp: { xs: 1, sm: 2 },
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