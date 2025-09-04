import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import { CircularProgress, Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './App.css';

// Lazy load page components
const Home = React.lazy(() => import('./pages/Home'));
const Menu = React.lazy(() => import('./pages/Menu'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Reservations = React.lazy(() => import('./pages/Reservations'));

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Custom class name generator to prevent JSS conflicts
let classCounter = 0;
const generateClassName = (rule, styleSheet) => {
  classCounter += 1;
  
  if (process.env.NODE_ENV === 'production') {
    return `mui-${classCounter}`;
  }
  
  if (styleSheet && styleSheet.options.classNamePrefix) {
    const prefix = styleSheet.options.classNamePrefix.replace(/([\[\].#*$><+~=|^:(),"'`\s])/g, '-');
    return `${prefix}-${rule.key}-${classCounter}`;
  }
  
  return `${rule.key}-${classCounter}`;
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#d4af37', // Gold
    },
    secondary: {
      main: '#8b4513', // Saddle Brown
    },
    background: {
      default: '#faf8f3', // Warm white
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="400px"
  >
    <CircularProgress size={40} />
  </Box>
);

function App() {
  return (
    <StyledEngineProvider injectFirst generateClassName={generateClassName}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
      <Elements stripe={stripePromise}>
        <AuthProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <div className="App">
                <Header />
                <CartDrawer />
                <main style={{ minHeight: 'calc(100vh - 140px)' }}>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/menu" element={<Menu />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/reservations" element={<Reservations />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </Elements>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
