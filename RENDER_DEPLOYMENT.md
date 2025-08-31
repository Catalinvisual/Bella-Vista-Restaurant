# Restaurant App Deployment Guide - Render

This guide will help you deploy your restaurant application to Render with PostgreSQL database, Node.js backend, and React frontend while maintaining local development functionality.

## Prerequisites

- Git repository (GitHub, GitLab, or Bitbucket)
- Render account (free tier available)
- Your project should be pushed to a Git repository

## Project Structure Overview

```
restaurant/
├── backend/          # Node.js/Express API
├── frontend/         # React application
├── database_schema.sql
└── RENDER_DEPLOYMENT.md
```

## Step 1: Prepare Your Repository

### 1.1 Create .gitignore files

Ensure you have proper `.gitignore` files:

**Root .gitignore:**
```
node_modules/
.env
*.log
.DS_Store
uploads/
```

**Backend .gitignore:**
```
node_modules/
.env
uploads/
*.log
```

**Frontend .gitignore:**
```
node_modules/
.env
build/
*.log
```

### 1.2 Push to Git Repository

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 2: Deploy PostgreSQL Database

### 2.1 Create PostgreSQL Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `restaurant-db`
   - **Database**: `restaurant`
   - **User**: `restaurant_user`
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 15 (recommended)
   - **Plan**: Free (or paid for production)

4. Click "Create Database"
5. **Save the connection details** (you'll need them later):
   - Internal Database URL
   - External Database URL
   - PSQL Command

### 2.2 Initialize Database Schema

1. Use the PSQL command from Render dashboard:
```bash
psql -h <hostname> -U <username> -d <database> -p <port>
```

2. Copy and paste your `database_schema.sql` content to create tables

## Step 3: Deploy Backend (Node.js API)

### 3.1 Prepare Backend for Production

Update `backend/package.json` to include start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 3.2 Update Backend Environment Configuration

Modify `backend/server.js` to handle production environment:

```javascript
const PORT = process.env.PORT || 5000;

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
```

### 3.3 Create Backend Service on Render

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name**: `restaurant-backend`
   - **Environment**: `Node`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

### 3.4 Set Backend Environment Variables

In the Render backend service settings, add these environment variables:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-render-postgresql-internal-url>
JWT_SECRET=<your-jwt-secret>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
EMAIL_USER=<your-email>
EMAIL_PASS=<your-email-password>
FRONTEND_URL=<will-be-set-after-frontend-deployment>
```

5. Click "Create Web Service"
6. **Save the backend URL** (e.g., `https://restaurant-backend.onrender.com`)

## Step 4: Deploy Frontend (React App)

### 4.1 Prepare Frontend for Production

Update `frontend/package.json` build script:

```json
{
  "scripts": {
    "build": "react-scripts build",
    "start": "serve -s build -l 3000"
  },
  "dependencies": {
    "serve": "^14.0.0"
  }
}
```

### 4.2 Update Frontend Environment Configuration

Create `frontend/.env.production`:

```
REACT_APP_API_URL=<your-render-backend-url>
REACT_APP_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
```

Update API calls in your React app to use environment variable:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### 4.3 Create Frontend Service on Render

1. Go to Render Dashboard
2. Click "New +" → "Static Site"
3. Connect your Git repository
4. Configure:
   - **Name**: `restaurant-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

### 4.4 Set Frontend Environment Variables

In the Render frontend service settings, add:

```
REACT_APP_API_URL=<your-render-backend-url>
REACT_APP_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
```

5. Click "Create Static Site"
6. **Save the frontend URL** (e.g., `https://restaurant-frontend.onrender.com`)

## Step 5: Update Backend with Frontend URL

1. Go to your backend service on Render
2. Update the `FRONTEND_URL` environment variable with your frontend URL
3. The service will automatically redeploy

## Step 6: Configure Custom Domain (Optional)

### 6.1 For Frontend (Static Site)
1. Go to your frontend service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `www.yourrestaurant.com`)
4. Follow DNS configuration instructions

### 6.2 For Backend API
1. Go to your backend service settings
2. Click "Custom Domains"
3. Add your API subdomain (e.g., `api.yourrestaurant.com`)
4. Update frontend environment variables accordingly

## Step 7: Maintain Local Development

### 7.1 Local Environment Files

Keep your local `.env` files:

**backend/.env (local):**
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_local
JWT_SECRET=your-local-jwt-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
EMAIL_USER=your-email
EMAIL_PASS=your-email-password
FRONTEND_URL=http://localhost:3000
```

**frontend/.env (local):**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### 7.2 Local Development Commands

```bash
# Start local backend
cd backend
npm run dev

# Start local frontend (in another terminal)
cd frontend
npm start
```

## Step 8: Database Migration and Seeding

### 8.1 Production Database Setup

Connect to your Render PostgreSQL and run:

```sql
-- Your database schema from database_schema.sql
-- Add any seed data if needed
```

### 8.2 File Upload Configuration

For production file uploads, consider using:
- Cloudinary
- AWS S3
- Render's persistent disk (paid plans)

Update your upload middleware accordingly.

## Step 9: Monitoring and Logs

### 9.1 View Logs
- Backend logs: Render Dashboard → Your backend service → Logs
- Frontend logs: Render Dashboard → Your frontend service → Logs
- Database logs: Render Dashboard → Your database → Logs

### 9.2 Health Checks

Add health check endpoint to your backend:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

## Step 10: SSL and Security

Render automatically provides:
- SSL certificates
- HTTPS redirects
- DDoS protection

Ensure your app uses HTTPS in production:

```javascript
// In production, ensure secure cookies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  // Set secure cookie options
}
```

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check build logs for missing dependencies
2. **Database Connection**: Verify DATABASE_URL format
3. **CORS Errors**: Ensure FRONTEND_URL is correctly set
4. **Environment Variables**: Double-check all required variables are set
5. **File Uploads**: Configure persistent storage for production

### Useful Commands:

```bash
# Check service status
curl https://your-backend-url.onrender.com/health

# View database connection
psql $DATABASE_URL
```

## Cost Optimization

### Free Tier Limitations:
- Services sleep after 15 minutes of inactivity
- 750 hours/month total across all services
- Limited bandwidth and storage

### Recommendations:
- Use paid plans for production
- Implement proper caching
- Optimize images and assets
- Monitor usage in Render dashboard

## Deployment Checklist

- [ ] Repository pushed to Git
- [ ] PostgreSQL database created and configured
- [ ] Backend service deployed with correct environment variables
- [ ] Frontend service deployed with correct environment variables
- [ ] Database schema imported
- [ ] CORS configured properly
- [ ] SSL working (HTTPS)
- [ ] Custom domains configured (if applicable)
- [ ] Local development still working
- [ ] File uploads configured for production
- [ ] Monitoring and logging set up

## Support

For issues:
1. Check Render documentation
2. Review service logs
3. Verify environment variables
4. Test API endpoints
5. Check database connections

Your restaurant app should now be live on Render while maintaining local development capabilities!