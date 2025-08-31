const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to check environment variables
app.get('/api/debug/env', (req, res) => {
  res.json({
    DB_HOST: process.env.DB_HOST || 'not set',
    DB_NAME: process.env.DB_NAME || 'not set',
    DB_USER: process.env.DB_USER || 'not set',
    DB_PORT: process.env.DB_PORT || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set'
  });
});

// Test database connection endpoint
app.get('/api/debug/db-test', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    
    res.json({
      status: 'success',
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      code: error.code
    });
  }
});

app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log('Environment variables:');
  console.log('- DB_HOST:', process.env.DB_HOST || 'not set');
  console.log('- DB_NAME:', process.env.DB_NAME || 'not set');
  console.log('- DB_USER:', process.env.DB_USER || 'not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
});