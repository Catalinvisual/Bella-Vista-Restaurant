# Render Deployment Guide

## Service URLs Structure

Your Bella Vista Restaurant application should be deployed with the following URL structure on Render:

- **Frontend Service**: `https://bella-vista-restaurant-1.onrender.com`
- **Backend Service**: `https://bella-vista-backend.onrender.com`

## Environment Variables Setup

### Backend Service Environment Variables

Set these environment variables in your Render backend service dashboard:

```
# Database Configuration (Render PostgreSQL)
DB_HOST=dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=bella_vista_db_dwub
DB_USER=bella_user
DB_PASSWORD=W6KwW991u2Pt8wfyrDsx6ZbpJU5LlxyM

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://bella-vista-restaurant-1.onrender.com

# Session Secret
SESSION_SECRET=your-secret-key-change-in-production

# JWT Secret
JWT_SECRET=your-jwt-secret-key-change-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=1023213204153-hjb7g9k8f40fbftmi237cugepq3r1prh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://bella-vista-backend.onrender.com/api/auth/google/callback

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### Frontend Service Environment Variables

Set these environment variables in your Render frontend service dashboard:

```
# Production API URL
REACT_APP_API_URL=https://bella-vista-backend.onrender.com/api

# Google OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=1023213204153-hjb7g9k8f40fbftmi237cugepq3r1prh.apps.googleusercontent.com

# Stripe Publishable Key (production)
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

## Deployment Steps

### 1. Commit and Push Changes

```bash
git add .
git commit -m "Fix CORS and environment configuration for Render deployment"
git push origin main
```

### 2. Deploy Backend Service

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Set all the backend environment variables listed above
5. Go to "Settings" tab and trigger a manual deploy

### 3. Deploy Frontend Service

1. Go to your Render dashboard
2. Select your frontend service
3. Go to "Environment" tab
4. Set all the frontend environment variables listed above
5. Go to "Settings" tab and trigger a manual deploy

### 4. Update Google OAuth Settings

In your Google Cloud Console:

1. Go to APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add these to Authorized JavaScript origins:
   - `https://bella-vista-restaurant-1.onrender.com`
4. Add these to Authorized redirect URIs:
   - `https://bella-vista-backend.onrender.com/api/auth/google/callback`

## Key Configuration Changes Made

### Backend (server.js)
- Updated CORS origins to include both frontend and backend URLs
- Enhanced Content Security Policy to allow cross-origin requests
- Added support for multiple Render service URLs

### Environment Files
- Created separate `.env.development` and `.env.production` files
- Updated production URLs to match actual Render service names
- Fixed API URL mismatch between frontend and backend

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure frontend URL is in backend CORS origins
2. **API Connection Failed**: Verify `REACT_APP_API_URL` matches backend service URL
3. **Google OAuth Errors**: Check callback URL in Google Console matches backend URL
4. **Database Connection**: Verify all database environment variables are correct

### Testing the Deployment

1. Visit your frontend URL: `https://bella-vista-restaurant-1.onrender.com`
2. Check browser console for any errors
3. Test menu loading functionality
4. Test user authentication
5. Verify API calls are successful

## Important Notes

- Always use HTTPS URLs in production
- Keep environment variables secure and never commit them to version control
- Monitor Render logs for any deployment issues
- Test thoroughly after each deployment

If you encounter any issues, check the Render service logs for detailed error messages.