import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material';
import {
  Instagram,
  Facebook,
} from '@mui/icons-material';

// TikTok icon component (since it's not in MUI icons)
const TikTokIcon = () => (
  <Box
    sx={{
      width: 48,
      height: 48,
      borderRadius: '50%',
      backgroundColor: 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="white"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z"/>
    </svg>
  </Box>
);

const Footer = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#4B1E1E',
        color: '#F5E9DC',
        py: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, sm: 4, md: 6 }} sx={{ justifyContent: 'center', alignItems: 'flex-start' }}>
          {/* Quick Links */}
          <Grid item xs={6} sm={6} md={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#FFFFFF' }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Link
                  href="/"
                  color="inherit"
                  underline="hover"
                  sx={{ 
                    display: 'block',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#D4AF37',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Home
                </Link>
                <Link
                  href="/menu"
                  color="inherit"
                  underline="hover"
                  sx={{ 
                    display: 'block',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Menu
                </Link>
                <Link
                  href="/cart"
                  color="inherit"
                  underline="hover"
                  sx={{ 
                    display: 'block',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Cart
                </Link>
                <Link
                  href="/login"
                  color="inherit"
                  underline="hover"
                  sx={{ 
                    display: 'block',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Login
                </Link>
              </Box>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={6} sm={6} md={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'rgba(255, 255, 255, 0.9)' }}>
                Contact Us
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Phone fontSize="small" sx={{ color: '#D4AF37' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                    +1 (555) 123-4567
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Email fontSize="small" sx={{ color: '#D4AF37' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                    info@bellavista.com
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Hours */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'rgba(255, 255, 255, 0.9)' }}>
                Hours
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, lineHeight: 1.6 }}>
                  Monday - Thursday
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: 'rgba(245, 233, 220, 0.8)', mb: 1 }}>
                  11:00 AM - 10:00 PM
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, lineHeight: 1.6 }}>
                  Friday - Saturday
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                  11:00 AM - 11:00 PM
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, lineHeight: 1.6 }}>
                  Sunday
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: 'rgba(245, 233, 220, 0.8)' }}>
                  12:00 PM - 9:00 PM
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Location Map */}
          <Grid item xs={12} sm={12} md={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 'bold', 
                mb: { xs: 2, sm: 3 }, 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
              }}>
                Find Us
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: { xs: 150, sm: 180, md: 180 },
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '3px solid rgba(245, 233, 220, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                  }
                }}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d38394.4!2d5.7480!3d52.7108!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c7b7fb8b4c8b4d%3A0x4003acf000000000!2sEmmeloord%2C%20Netherlands!5e0!3m2!1sen!2sus!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Bella Vista Restaurant Location"
                />
              </Box>
            </Box>
          </Grid>

          {/* Social Media */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'rgba(255, 255, 255, 0.9)' }}>
                Follow Us
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: { xs: 1.5, sm: 2 }, 
                flexWrap: 'wrap',
                px: { xs: 2, sm: 0 }
              }}>
                <IconButton
                  component="a"
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'white',
                    backgroundColor: '#E4405F',
                    border: '2px solid #E4405F',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#D4AF37',
                      color: '#4B1E1E',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 20px rgba(212, 175, 55, 0.5)'
                    }
                  }}
                >
                  <Instagram />
                </IconButton>
                <IconButton
                  component="a"
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'white',
                    backgroundColor: '#1877F2',
                    border: '2px solid #1877F2',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#D4AF37',
                      color: '#4B1E1E',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 20px rgba(212, 175, 55, 0.5)'
                    }
                  }}
                >
                  <Facebook />
                </IconButton>
                <IconButton
                  component="a"
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(245, 233, 220, 0.1)',
                    border: '2px solid rgba(245, 233, 220, 0.2)',
                    transition: 'all 0.3s ease',
                    padding: 0,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    '&:hover': {
                      backgroundColor: '#D4AF37',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 20px rgba(212, 175, 55, 0.5)',
                      '& .tiktok-icon': {
                        backgroundColor: '#4B1E1E',
                        '& svg': {
                          fill: '#D4AF37'
                        }
                      }
                    }
                  }}
                >
                  <Box
                    className="tiktok-icon"
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <svg
                      width={window.innerWidth < 600 ? "20" : "24"}
                      height={window.innerWidth < 600 ? "20" : "24"}
                      viewBox="0 0 24 24"
                      fill="white"
                      style={{ transition: 'fill 0.3s ease' }}
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z"/>
                    </svg>
                  </Box>
                </IconButton>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box
          sx={{
            mt: { xs: 3, sm: 4 },
            pt: { xs: 1.5, sm: 2 },
            borderTop: '1px solid rgba(245, 233, 220, 0.2)',
            textAlign: 'center',
          }}
        >
          <Typography 
            variant="body2"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            © {new Date().getFullYear()} Bella Vista Restaurant. All rights reserved.
          </Typography>
          <Typography 
            variant="body2"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Created by{' '}
            <Link 
              href="https://www.haplogic.com" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ 
                color: '#D4AF37',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              HapLogic
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;