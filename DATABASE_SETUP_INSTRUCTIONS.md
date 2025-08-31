# Database Connection Setup Instructions

## Current Issue
The Bella Vista Restaurant API is experiencing database connection failures (500 errors) because the production environment variables contain placeholder values instead of actual database credentials.

## Root Cause
The `.env.production` file contains placeholder database credentials that need to be replaced with actual values from your Render PostgreSQL service.

## Solution Steps

### 1. Get Database Credentials from Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to your PostgreSQL service (bella_vista_db)
3. Click on the "Connect" tab
4. Copy the "External Database URL" and individual connection details

### 2. Update Environment Variables
Replace the placeholder values in `backend/.env.production` with your actual credentials:

```env
# Replace these with actual values from Render:
DATABASE_URL=postgresql://bella_vista_db_user:YOUR_ACTUAL_PASSWORD@dpg-ctlhqjbtq21c73a8pu40-a.oregon-postgres.render.com/bella_vista_db
DB_HOST=dpg-ctlhqjbtq21c73a8pu40-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=bella_vista_db
DB_USER=bella_vista_db_user
DB_PASSWORD=YOUR_ACTUAL_PASSWORD
```

### 3. Set Environment Variables in Render
Alternatively (and more securely), set these as environment variables directly in your Render web service:

1. Go to your Render web service dashboard
2. Navigate to "Environment" tab
3. Add the following environment variables:
   - `DB_HOST`: Your PostgreSQL host
   - `DB_PORT`: 5432
   - `DB_NAME`: bella_vista_db
   - `DB_USER`: Your database username
   - `DB_PASSWORD`: Your database password
   - `DATABASE_URL`: Full connection string

### 4. Deploy and Test
After updating the credentials:
1. Commit and push changes (if using .env.production)
2. Or trigger a redeploy (if using Render environment variables)
3. Test the API endpoints:
   - Health check: `https://bella-vista-restaurant.onrender.com/api/health`
   - Database test: `https://bella-vista-restaurant.onrender.com/api/db-test`
   - Menu categories: `https://bella-vista-restaurant.onrender.com/api/menu/categories`

## Code Changes Made

### Updated Files:
- `backend/server.js`: Modified to use individual DB parameters with SSL
- `backend/debug-server.js`: Updated all database connections to use individual parameters
- `backend/.env.production`: Added instructions for credential replacement

### Database Connection Configuration:
The code now prioritizes individual database connection parameters over DATABASE_URL and includes proper SSL configuration for production:

```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});
```

## Next Steps
1. Obtain actual database credentials from Render
2. Update environment variables
3. Redeploy the application
4. Verify API endpoints are working
5. Test the complete restaurant application functionality

## Security Note
For production applications, it's recommended to use Render's environment variables feature rather than storing credentials in `.env.production` files to avoid accidentally committing sensitive information to version control.