import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  Menu as MenuIcon,
  Restaurant,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartItemsCount, toggleCart } = useCart();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Cart', path: '/cart' },
  ];

  return (
    <AppBar position="sticky" sx={{ backgroundColor: theme.palette.primary.main }}>
      <Toolbar>
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            component={Link}
            to="/"
            sx={{ mr: 1 }}
          >
            <Restaurant fontSize="large" />
          </IconButton>
          
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            Bella Vista
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {menuItems.map((item) => (
              <Button
                key={item.label}
                color="inherit"
                component={Link}
                to={item.path}
                sx={{ fontWeight: 500 }}
              >
                {item.label}
              </Button>
            ))}
            
            {/* Cart Icon */}
            <IconButton color="inherit" onClick={toggleCart}>
              <Badge badgeContent={getCartItemsCount()} color="secondary">
                <ShoppingCart />
              </Badge>
            </IconButton>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleProfileMenuOpen}
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleMenuClose}>
                    Welcome, {user?.name || user?.email}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      navigate('/orders');
                      handleMenuClose();
                    }}
                  >
                    My Orders
                  </MenuItem>
                  {user?.role === 'admin' && (
                    <MenuItem
                      onClick={() => {
                        navigate('/admin');
                        handleMenuClose();
                      }}
                    >
                      Admin Dashboard
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  sx={{ fontWeight: 500 }}
                >
                  Login
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/register"
                  sx={{ fontWeight: 500 }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        )}

        {/* Mobile Menu */}
        {isMobile && (
          <>
            <IconButton color="inherit" onClick={toggleCart}>
              <Badge badgeContent={getCartItemsCount()} color="secondary">
                <ShoppingCart />
              </Badge>
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleMobileMenuOpen}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  transform: 'scale(1.1)',
                  transition: 'all 0.3s ease'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon sx={{ fontSize: '2rem' }} />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: '#F5F5F5',
                  color: '#2C2C2C',
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  border: '2px solid #FFD700'
                }
              }}
            >
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <MenuItem
                    key={item.label}
                    onClick={() => {
                      navigate(item.path);
                      handleMenuClose();
                    }}
                    sx={{
                      color: '#2C2C2C',
                      fontSize: '1.1rem',
                      fontWeight: isActive ? 'bold' : 'normal',
                      backgroundColor: isActive ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
                      borderLeft: isActive ? '4px solid #FFD700' : '4px solid transparent',
                      borderBottom: isActive ? '2px solid #FFD700' : '2px solid transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.2)',
                        borderLeft: '4px solid #FFD700',
                        transform: 'translateX(4px)',
                        transition: 'all 0.3s ease'
                      },
                      transition: 'all 0.3s ease',
                      py: 1.5,
                      px: 2
                    }}
                  >
                    {item.label}
                  </MenuItem>
                );
              })}
              {isAuthenticated ? (
                 [
                   <MenuItem 
                     key="profile" 
                     onClick={handleMenuClose}
                     sx={{
                       color: '#2C2C2C',
                       fontSize: '1.1rem',
                       backgroundColor: 'rgba(255, 215, 0, 0.1)',
                       borderTop: '1px solid rgba(255, 215, 0, 0.5)',
                       '&:hover': {
                         backgroundColor: 'rgba(255, 215, 0, 0.2)',
                         transform: 'translateX(4px)',
                         transition: 'all 0.3s ease'
                       },
                       transition: 'all 0.3s ease',
                       py: 1.5,
                       px: 2
                     }}
                   >
                     {user?.name || user?.email}
                   </MenuItem>,
                   <MenuItem
                     key="orders"
                     onClick={() => {
                       navigate('/orders');
                       handleMenuClose();
                     }}
                     sx={{
                       color: '#2C2C2C',
                       fontSize: '1.1rem',
                       fontWeight: location.pathname === '/orders' ? 'bold' : 'normal',
                       backgroundColor: location.pathname === '/orders' ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
                       borderLeft: location.pathname === '/orders' ? '4px solid #FFD700' : '4px solid transparent',
                       borderBottom: location.pathname === '/orders' ? '2px solid #FFD700' : '2px solid transparent',
                       '&:hover': {
                         backgroundColor: 'rgba(255, 215, 0, 0.2)',
                         borderLeft: '4px solid #FFD700',
                         transform: 'translateX(4px)',
                         transition: 'all 0.3s ease'
                       },
                       transition: 'all 0.3s ease',
                       py: 1.5,
                       px: 2
                     }}
                   >
                     My Orders
                   </MenuItem>,
                   user?.role === 'admin' && (
                     <MenuItem
                       key="admin"
                       onClick={() => {
                         navigate('/admin');
                         handleMenuClose();
                       }}
                       sx={{
                         color: '#2C2C2C',
                         fontSize: '1.1rem',
                         fontWeight: location.pathname === '/admin' ? 'bold' : 'normal',
                         backgroundColor: location.pathname === '/admin' ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
                         borderLeft: location.pathname === '/admin' ? '4px solid #FFD700' : '4px solid transparent',
                         borderBottom: location.pathname === '/admin' ? '2px solid #FFD700' : '2px solid transparent',
                         '&:hover': {
                           backgroundColor: 'rgba(255, 215, 0, 0.2)',
                           borderLeft: '4px solid #FFD700',
                           transform: 'translateX(4px)',
                           transition: 'all 0.3s ease'
                         },
                         transition: 'all 0.3s ease',
                         py: 1.5,
                         px: 2
                       }}
                     >
                       Admin Dashboard
                     </MenuItem>
                   ),
                   <MenuItem 
                     key="logout" 
                     onClick={handleLogout}
                     sx={{
                        color: '#D32F2F',
                        fontSize: '1.1rem',
                        borderTop: '1px solid rgba(255, 215, 0, 0.5)',
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
                          transform: 'translateX(4px)',
                          transition: 'all 0.3s ease'
                        },
                        transition: 'all 0.3s ease',
                        py: 1.5,
                        px: 2
                      }}
                   >
                     Logout
                   </MenuItem>,
                 ]
               ) : (
                 [
                   <MenuItem
                     key="login"
                     onClick={() => {
                       navigate('/login');
                       handleMenuClose();
                     }}
                     sx={{
                       color: '#2C2C2C',
                       fontSize: '1.1rem',
                       fontWeight: location.pathname === '/login' ? 'bold' : 'normal',
                       backgroundColor: location.pathname === '/login' ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
                       borderLeft: location.pathname === '/login' ? '4px solid #FFD700' : '4px solid transparent',
                       borderBottom: location.pathname === '/login' ? '2px solid #FFD700' : '2px solid transparent',
                       borderTop: '1px solid rgba(255, 215, 0, 0.5)',
                       '&:hover': {
                         backgroundColor: 'rgba(255, 215, 0, 0.2)',
                         borderLeft: '4px solid #FFD700',
                         transform: 'translateX(4px)',
                         transition: 'all 0.3s ease'
                       },
                       transition: 'all 0.3s ease',
                       py: 1.5,
                       px: 2
                     }}
                   >
                     Login
                   </MenuItem>,
                   <MenuItem
                     key="register"
                     onClick={() => {
                       navigate('/register');
                       handleMenuClose();
                     }}
                     sx={{
                       color: '#2C2C2C',
                       fontSize: '1.1rem',
                       fontWeight: location.pathname === '/register' ? 'bold' : 'normal',
                       backgroundColor: location.pathname === '/register' ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
                       borderLeft: location.pathname === '/register' ? '4px solid #FFD700' : '4px solid transparent',
                       borderBottom: location.pathname === '/register' ? '2px solid #FFD700' : '2px solid transparent',
                       '&:hover': {
                         backgroundColor: 'rgba(255, 215, 0, 0.2)',
                         borderLeft: '4px solid #FFD700',
                         transform: 'translateX(4px)',
                         transition: 'all 0.3s ease'
                       },
                       transition: 'all 0.3s ease',
                       py: 1.5,
                       px: 2
                     }}
                   >
                     Register
                   </MenuItem>,
                 ]
               )}
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;