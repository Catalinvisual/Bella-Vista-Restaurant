# Production Troubleshooting Guide

## Issues Identified and Fixed

### 1. API URL Mismatch (CRITICAL - FIXED)

**Problem**: Frontend was trying to connect to wrong backend URL
- Frontend `.env.production`: `https://bella-vista-restaurant.onrender.com/api`
- Backend expected URL: `https://bella-vista-restaurant-1.onrender.com`

**Solution**: Updated frontend `.env.production` to use correct URL:
```
REACT_APP_API_URL=https://bella-vista-restaurant-1.onrender.com/api
```

**Status**: ✅ FIXED - Committed and pushed to GitHub

### 2. Google Maps API Loading Issues

**Problem**: Console shows `Failed to load resource: maps.googleapis.com/2042csp test=true1`

**Analysis**: 
- Google Maps embed in Footer.js is correctly configured
- CSP headers in server.js include all necessary Google domains
- Issue might be related to network connectivity or ad blockers

**CSP Configuration** (Already correct in server.js):
```javascript
"frame-src": ["'self'", "https://www.google.com", "https://accounts.google.com", "https://maps.google.com", "https://js.stripe.com", "https://checkout.stripe.com"]
```

**Status**: ✅ VERIFIED - Configuration is correct

### 3. Admin Dashboard 500 Errors

**Problem**: Admin dashboard showing 500 server errors when fetching data

**Likely Causes**:
1. Backend service not running on Render
2. Database connection issues
3. Environment variables not properly set in Render
4. CORS configuration issues (now fixed with URL correction)

**Next Steps for User**:
1. Check Render backend service status
2. Verify all environment variables are set in Render dashboard
3. Check Render service logs for specific errors
4. Redeploy services after the API URL fix

## Render Deployment Checklist

### Backend Service Verification
1. **Service Status**: Check if backend service is running
2. **Environment Variables**: Verify all variables from `.env.production` are set
3. **Database Connection**: Test PostgreSQL connection
4. **Logs**: Check for startup errors or runtime issues

### Frontend Service Verification
1. **Build Status**: Ensure latest build includes the API URL fix
2. **Environment Variables**: Verify `REACT_APP_API_URL` is correct
3. **Deployment**: Trigger manual redeploy if needed

### Testing Production Endpoints

Test these URLs to verify services:

**Backend Health Check**:
```
https://bella-vista-restaurant-1.onrender.com/api/health
```

**Frontend Access**:
```
https://bella-vista-restaurant-1.onrender.com
```

**API Endpoints to Test**:
- `GET /api/menu/featured` - Menu items
- `GET /api/admin/dashboard` - Dashboard data (requires auth)
- `POST /api/auth/login` - Authentication

## Common Production Issues

### 1. Service Sleeping (Render Free Tier)
- **Problem**: Services sleep after 15 minutes of inactivity
- **Solution**: First request may take 30-60 seconds to wake up
- **Recommendation**: Use paid tier for production

### 2. Environment Variables
- **Problem**: Missing or incorrect environment variables
- **Solution**: Double-check all variables in Render dashboard
- **Critical Variables**: `DATABASE_URL`, `FRONTEND_URL`, `NODE_ENV=production`

### 3. Database Connection
- **Problem**: SSL connection issues or wrong credentials
- **Solution**: Verify `DATABASE_URL` format and SSL settings

### 4. CORS Errors
- **Problem**: Frontend domain not in CORS origins
- **Solution**: Ensure `FRONTEND_URL` matches actual frontend domain

## Monitoring and Debugging

### Render Dashboard
1. Go to https://dashboard.render.com
2. Check both frontend and backend services
3. Review logs for errors
4. Verify environment variables
5. Check deployment history

### Browser Developer Tools
1. Open Network tab
2. Check for failed API requests
3. Look for CORS errors in console
4. Verify correct API URLs are being called

### Database Verification
Connect to production database:
```bash
psql postgresql://bella_user:W6KwW991u2Pt8wfyrDsx6ZbpJU5LlxyM@dpg-d2q1ifmr433s73dq11tg-a.oregon-postgres.render.com/bella_vista_db_dwub
```

## 🚨 CRITICAL: Backend Service Issues on Render - PARTIALLY RESOLVED

**ISSUE IDENTIFIED**: Multiple backend service issues identified:
- API calls to admin endpoints were failing with 500 errors
- Root cause: Admin users endpoint was trying to SELECT a 'username' column that doesn't exist
- Production database schema only has 'full_name', not 'username'
- Local backend works perfectly (confirmed)
- **NEW ISSUE**: API endpoints returning HTML instead of JSON, indicating routing/deployment issue

### Root Cause and Fix:

**Problem**: Database schema mismatch in admin routes
- The admin users endpoint was querying for 'username' column
- Production database users table only has: id, full_name, email, phone_number, role, etc.
- This caused 500 Internal Server Error responses

**Solution Applied**:
- Updated `backend/routes/admin.js` to remove 'username' from SELECT queries
- Now uses only existing columns from the actual database schema
- Committed and pushed fix to trigger automatic Render deployment

### Issues Status:

1. **✅ Database Schema Mismatch**: Fixed column references in admin routes
2. **❌ Backend Service Routing**: API endpoints still returning HTML instead of JSON
3. **❓ Service Configuration**: Needs verification on Render dashboard
4. **✅ Code Fix Deployed**: Database schema fix pushed to GitHub

### Current Status:
- Database schema fix has been applied and deployed
- API endpoints still return HTML instead of JSON responses
- This indicates the backend service on Render may not be properly configured
- Manual intervention required on Render dashboard

### Immediate Actions Required:
1. **Check Render Dashboard**: Verify backend service status and configuration
2. **Service Type**: Ensure it's set to "Web Service" not "Static Site"
3. **Build/Start Commands**: Verify correct commands for backend
4. **Environment Variables**: Confirm all production variables are set
5. **Manual Redeploy**: Trigger fresh deployment if needed

## 🚀 Next Steps

1. **Fix Render Backend Deployment**: Follow the critical steps above
2. **Verify Backend Health**: Test `/api/health` endpoint after redeploy
3. **Check Database Connection**: Test `/api/db-test` endpoint
4. **Test Admin Dashboard**: Verify 500 errors are resolved
5. **Monitor All Services**: Ensure both frontend and backend are running

## Support Resources

- **Render Documentation**: https://render.com/docs
- **Render Support**: https://render.com/support
- **Service Logs**: Available in Render dashboard
- **Database Logs**: Check PostgreSQL service logs

---

**Last Updated**: January 2025
**Status**: API URL mismatch fixed, awaiting service redeployment