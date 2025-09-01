const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const { Pool } = require('pg');
// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const paymentRoutes = require('./routes/payments');
const reservationRoutes = require('./routes/reservations');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection - prioritize individual parameters over DATABASE_URL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bella_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Connected to PostgreSQL database successfully');
    release();
  }
});

// Make pool available to routes
app.locals.db = pool;

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
// Dynamic CSP configuration based on environment
const allowedOrigins = [
  "'self'",
  "http://localhost:3000",
  "http://localhost:5000",
  "https://bella-vista-restaurant.onrender.com",
  "https://bella-vista-restaurant-1.onrender.com",
  "https://bella-vista-backend.onrender.com",
  "https://bella-vista-restaurant-frontend.onrender.com",
  "https://bellavista-restaurant.onrender.com",
  "https://www.google.com",
  "https://accounts.google.com",
  "https://maps.google.com",
  "https://maps.googleapis.com",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://js.stripe.com",
  "https://checkout.stripe.com",
  "https://api.stripe.com",
  "data:",
  "https:"
];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "default-src": ["'self'"],
      "img-src": allowedOrigins,
      "connect-src": allowedOrigins,
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "https://js.stripe.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https:"],
      "frame-src": ["'self'", "https://www.google.com", "https://accounts.google.com", "https://maps.google.com", "https://js.stripe.com", "https://checkout.stripe.com"],
      "font-src": ["'self'", "https:", "data:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('combined'));
// Dynamic CORS configuration
const corsOrigins = [
  'http://localhost:3000',
  'https://bella-vista-restaurant-1.onrender.com',
  'https://bella-vista-restaurant.onrender.com',
  'https://bella-vista-backend.onrender.com',
  // Add more variations to ensure compatibility
  'https://bella-vista-restaurant-frontend.onrender.com',
  'https://bellavista-restaurant.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./config/passport')(passport, pool);

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple test route at root level
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// API Routes - MUST come before static file serving
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reservations', reservationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Restaurant API is running',
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as category_count FROM menu_categories');
    res.json({ 
      status: 'Database connection successful',
      current_time: result.rows[0].current_time,
      category_count: result.rows[0].category_count
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'Database connection failed',
      error: error.message
    });
  }
});

// Backend-only deployment - no static file serving
// All non-API routes return 404
app.get('*', (req, res) => {
  // Only serve API routes and test routes
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/test')) {
    return res.status(404).json({ error: 'Route not found - this is a backend API only' });
  }
  // This shouldn't be reached due to API routes being handled above
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
});

module.exports = app;