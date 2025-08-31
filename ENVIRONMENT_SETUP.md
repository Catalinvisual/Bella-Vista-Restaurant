# Environment Setup Guide

This guide explains how to configure the Bella Vista Restaurant application for both local development and production deployment on Render.

## Environment Files Structure

### Backend Environment Files
- `.env` - Default development configuration
- `.env.development` - Local development settings
- `.env.production` - Production settings for Render

### Frontend Environment Files
- `.env` - Default development configuration
- `.env.development` - Local development settings
- `.env.production` - Production settings for Render

## Local Development Setup

1. **Backend**: Uses `.env` file with local PostgreSQL database
2. **Frontend**: Uses `.env` file pointing to `http://localhost:5000/api`

## Production Deployment on Render

### Backend Service Environment Variables
Set these in your Render backend service dashboard:

```
DB_HOST=dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=bella_vista_db_dwub
DB_USER=bella_user
DB_PASSWORD=W6KwW991u2Pt8wfyrDsx6ZbpJU5LlxyM
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://bella-vista-restaurant-1.onrender.com
SESSION_SECRET=your-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-key-change-in-production
GOOGLE_CLIENT_ID=1023213204153-hjb7g9k8f40fbftmi237cugepq3r1prh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://bella-vista-restaurant.onrender.com/api/auth/google/callback
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### Frontend Service Environment Variables
Set these in your Render frontend service dashboard:

```
REACT_APP_API_URL=https://bella-vista-restaurant.onrender.com/api
REACT_APP_GOOGLE_CLIENT_ID=1023213204153-hjb7g9k8f40fbftmi237cugepq3r1prh.apps.googleusercontent.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

## Key Features

### Dynamic CORS Configuration
The server now supports multiple origins and automatically allows development origins when `NODE_ENV=development`.

### Enhanced Security Headers
Content Security Policy is configured to work with both local and production domains.

### Environment-Specific Settings
Each environment has its own configuration file for easy management.

## Deployment Steps

1. **Commit all changes** to your repository
2. **Push to GitHub** (triggers auto-deployment if connected)
3. **Set environment variables** in Render dashboard for both services
4. **Redeploy services** if needed
5. **Test the application** in both environments

## Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` matches your actual frontend domain
- Check that both domains are listed in `corsOrigins` array

### Database Connection
- Verify all database credentials are correct
- Ensure `NODE_ENV` is set to `production` in Render

### API Calls Failing
- Check `REACT_APP_API_URL` points to correct backend URL
- Verify backend service is running and accessible