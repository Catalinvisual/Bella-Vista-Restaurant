import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Grid,
  InputLabel,
} from '@mui/material';

const CustomTimePicker = ({ value, onChange, label, error, helperText }) => {
  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr12 = `${hour}:${minute.toString().padStart(2, '0')}`;
        const hour24AM = hour === 12 ? 0 : hour;
        const hour24PM = hour === 12 ? 12 : hour + 12;
        const timeStr24AM = `${hour24AM.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const timeStr24PM = `${hour24PM.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        times.push({ display: `${timeStr12} AM`, value: timeStr24AM });
        times.push({ display: `${timeStr12} PM`, value: timeStr24PM });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <FormControl fullWidth error={error} variant="outlined">
      <InputLabel shrink>{label || 'Select Time'}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        label={label || 'Select Time'}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 200,
            },
          },
        }}
        sx={{
          height: '56px',
          backgroundColor: 'white',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.87)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? '#d32f2f' : '#1976d2',
          },
        }}
      >
        <MenuItem value="" disabled>
          <em>Select time</em>
        </MenuItem>
        {timeOptions.map((time) => (
          <MenuItem key={time.value} value={time.value}>
            {time.display}
          </MenuItem>
        ))}
      </Select>
      {error && helperText && (
        <Typography
          variant="caption"
          sx={{
            color: '#d32f2f',
            fontSize: '0.75rem',
            marginTop: '3px',
            marginLeft: '14px',
          }}
        >
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

export default CustomTimePicker;