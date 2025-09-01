import React, { useState } from 'react';
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

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await registerUser({
        fullName: data.name,
        email: data.email,
        password: data.password,
        phoneNumber: data.phone,
      });
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
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
          Create Account
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
          Join us and start your culinary journey
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
            label="Full Name"
            margin="normal"
            {...register('name', {
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
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
            label="Phone Number"
            type="tel"
            margin="normal"
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^(\+31|\+32|\+33|\+49|\+44|\+39|\+34|\+351|\+43|\+41|\+45|\+46|\+47|\+358|\+353|\+370|\+371|\+372|\+386|\+385|\+421|\+420|\+48|\+40|\+359|\+30|\+357|\+356|\+352|\+423|\+377|\+378|\+39|0)[0-9\s\-.()]{6,20}$/,
                message: 'Please enter a valid European phone number (e.g., +31 6 12345678 for Netherlands)',
              },
            })}
            error={!!errors.phone}
            helperText={errors.phone?.message}
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
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
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
          
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            margin="normal"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
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
              'Create Account'
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
          onClick={handleGoogleRegister}
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
          <Typography variant="body2" color="text.secondary" sx={{
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}>
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{ 
                color: theme.palette.primary.main, 
                textDecoration: 'none',
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;