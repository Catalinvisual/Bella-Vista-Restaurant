// API configuration utility
const getApiUrl = () => {
  // Always use the environment variable if available, otherwise fallback to localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const getBaseUrl = () => {
  // Always use the environment variable if available, otherwise fallback to localhost
  return process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
};

export { getApiUrl, getBaseUrl };