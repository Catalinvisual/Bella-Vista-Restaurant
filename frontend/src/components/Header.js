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
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
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
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMenuClose}
            >
              {menuItems.map((item) => (
                <MenuItem
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    handleMenuClose();
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
              {isAuthenticated ? (
                [
                  <MenuItem key="profile" onClick={handleMenuClose}>
                    {user?.name || user?.email}
                  </MenuItem>,
                  <MenuItem
                    key="orders"
                    onClick={() => {
                      navigate('/orders');
                      handleMenuClose();
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
                    >
                      Admin Dashboard
                    </MenuItem>
                  ),
                  <MenuItem key="logout" onClick={handleLogout}>
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
                  >
                    Login
                  </MenuItem>,
                  <MenuItem
                    key="register"
                    onClick={() => {
                      navigate('/register');
                      handleMenuClose();
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