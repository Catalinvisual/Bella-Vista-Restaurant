// API configuration utility
const getApiUrl = () => {
  // In production, use relative URLs since backend serves the frontend
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  // In development, use the full URL
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const getBaseUrl = () => {
  // In production, use relative URLs since backend serves the frontend
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  // In development, use the full URL without /api
  return process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
};

export { getApiUrl, getBaseUrl };