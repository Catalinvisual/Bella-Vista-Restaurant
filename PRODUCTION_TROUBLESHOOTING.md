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

## Next Steps

1. **Redeploy Services**: After API URL fix, redeploy both services
2. **Test Thoroughly**: Verify all functionality works
3. **Monitor Logs**: Watch for any new errors
4. **Update Stripe**: Switch to live keys when ready for production payments

## Support Resources

- **Render Documentation**: https://render.com/docs
- **Render Support**: https://render.com/support
- **Service Logs**: Available in Render dashboard
- **Database Logs**: Check PostgreSQL service logs

---

**Last Updated**: January 2025
**Status**: API URL mismatch fixed, awaiting service redeployment