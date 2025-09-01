import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Divider,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, checkAuthStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Handle Google OAuth callback token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const oauthError = urlParams.get('error');
    
    if (oauthError) {
      setError('Google authentication failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token) {
      // Store token and authenticate user
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Check auth status to get user data
      checkAuthStatus().then(() => {
        navigate('/');
      }).catch(() => {
        setError('Authentication failed. Please try again.');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, checkAuthStatus]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.secondary.main,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
            textAlign: 'center'
          }}
        >
          Welcome Back
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ 
            mb: { xs: 2, sm: 3 }, 
            textAlign: 'center',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Sign in to your account to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ 
            width: '100%', 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ width: '100%' }}
        >
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            margin="normal"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              },
              '& .MuiFormHelperText-root': {
                fontSize: { xs: '0.75rem', sm: '0.8125rem' }
              }
            }}
          />
          
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              },
              '& .MuiFormHelperText-root': {
                fontSize: { xs: '0.75rem', sm: '0.8125rem' }
              }
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: { xs: 2, sm: 3 },
              mb: { xs: 1.5, sm: 2 },
              py: { xs: 1.25, sm: 1.5 },
              backgroundColor: theme.palette.primary.main,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
        </Box>

        <Box sx={{ width: '100%', my: { xs: 1.5, sm: 2 } }}>
          <Divider>
            <Typography variant="body2" color="text.secondary" sx={{
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}>
              OR
            </Typography>
          </Divider>
        </Box>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<Google />}
          onClick={handleGoogleLogin}
          sx={{
            py: { xs: 1.25, sm: 1.5 },
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
              color: 'white',
            },
          }}
        >
          Continue with Google
        </Button>

        <Box sx={{ mt: { xs: 2, sm: 3 }, textAlign: 'center' }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            sx={{ 
              color: theme.palette.primary.main, 
              textDecoration: 'none',
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            Forgot your password?
          </Link>
        </Box>

        <Box sx={{ mt: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}>
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/register"
              sx={{ 
                color: theme.palette.primary.main, 
                textDecoration: 'none',
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Sign up here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;