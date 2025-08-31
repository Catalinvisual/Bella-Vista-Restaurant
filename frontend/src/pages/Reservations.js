import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  useTheme,
  CircularProgress,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import CustomTimePicker from '../components/CustomTimePicker';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Reservations = () => {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');



  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      date: null,
      time: null,
      guests: 2,
      special_requests: '',
    },
  });

  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const reservationData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        guests: data.guests,
        reservation_date: data.date, // HTML5 date input already returns YYYY-MM-DD format
        reservation_time: data.time, // HTML5 time input already returns HH:MM format
        special_requests: data.special_requests,
      };

      await axios.post('/reservations', reservationData);

      setSuccess(true);
      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to make reservation');
    } finally {
      setLoading(false);
    }
  };

  const guestOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
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
          Make a Reservation
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ 
            mb: { xs: 3, sm: 4 }, 
            textAlign: 'center',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Reserve your table for an unforgettable dining experience
        </Typography>

        {success && (
          <Alert severity="success" sx={{ 
            width: '100%', 
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}>
            Reservation submitted successfully! We'll contact you to confirm.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ 
            width: '100%', 
            mb: { xs: 2, sm: 3 },
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
            <Grid 
              container 
              spacing={3}
              sx={{ 
                maxWidth: '600px',
                margin: '0 auto',
                '& .MuiGrid-item': {
                  display: 'flex',
                  alignItems: 'stretch'
                }
              }}
            >
              {/* Row 1: Full Name and Email */}
              <Grid item xs={12} sm={6}>
                 <TextField
                   fullWidth
                   label="Full Name"
                   variant="outlined"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  variant="outlined"
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
                    '& .MuiOutlinedInput-root': {
                      height: '56px'
                    }
                  }}
                />
              </Grid>

              {/* Row 2: Phone and Number of Guests */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  variant="outlined"
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[+]?[1-9]?[0-9]{7,15}$/,
                      message: 'Invalid phone number',
                    },
                  })}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.guests}>
                  <InputLabel>Number of Guests</InputLabel>
                  <Select
                    label="Number of Guests"
                    {...register('guests', {
                      required: 'Number of guests is required',
                    })}
                    defaultValue={2}
                    sx={{
                      height: '56px'
                    }}
                  >
                    {guestOptions.map((num) => (
                      <MenuItem key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.guests && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.guests.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Row 3: Date and Time */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reservation Date"
                  type="date"
                  variant="outlined"
                  {...register('date', {
                    required: 'Date is required',
                  })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0],
                  }}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ width: '100%' }}>
                  <CustomTimePicker
                    label="Reservation Time"
                    value={watch('time')}
                    onChange={(value) => setValue('time', value)}
                    error={!!errors.time}
                    helperText={errors.time?.message}
                  />
                  <input
                    type="hidden"
                    {...register('time', {
                      required: 'Time is required',
                    })}
                  />
                </Box>
              </Grid>

              {/* Row 4: Special Requests */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Special Requests (Optional)"
                  multiline
                  rows={4}
                  variant="outlined"
                  {...register('special_requests')}
                  placeholder="Any special dietary requirements, celebration details, or seating preferences..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      minHeight: '120px'
                    }
                  }}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{
                    height: '56px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    backgroundColor: theme.palette.primary.main,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      boxShadow: 'none'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Make Reservation'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
      </Paper>
    </Container>
  );
};

export default Reservations;