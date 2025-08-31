# Bella Vista Restaurant - Deployment Guide

## Prerequisites

### System Requirements
- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### Environment Setup
1. Clone the repository
2. Install dependencies for both frontend and backend
3. Set up PostgreSQL database
4. Configure environment variables

## Local Development Setup

### 1. Database Setup
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE bella_db;
\q

# Run the database schema
psql -U postgres -d bella_db -f database_schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file with the following variables:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bella_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Initialize database with sample data
node init-db.js

# Start backend server
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env file with:
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Start frontend development server
npm start
```

## Production Deployment

### Option 1: Traditional VPS/Server Deployment

#### Backend Deployment
1. **Server Setup**
   ```bash
   # Install Node.js, PostgreSQL, and PM2
   sudo apt update
   sudo apt install nodejs npm postgresql
   npm install -g pm2
   ```

2. **Database Setup**
   ```bash
   sudo -u postgres createdb bella_db
   sudo -u postgres psql bella_db < database_schema.sql
   ```

3. **Application Deployment**
   ```bash
   # Clone and setup backend
   git clone <repository-url>
   cd restaurant/backend
   npm install --production
   
   # Configure production environment variables
   # Update .env with production database credentials
   
   # Start with PM2
   pm2 start server.js --name "bella-backend"
   pm2 startup
   pm2 save
   ```

#### Frontend Deployment
1. **Build for Production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve with Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/restaurant/frontend/build;
           index index.html;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: bella_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database_schema.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: bella_db
      DB_USER: postgres
      DB_PASSWORD: password
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Option 3: Cloud Platform Deployment

#### Heroku Deployment
1. **Backend (Heroku)**
   ```bash
   # Install Heroku CLI and login
   heroku create bella-vista-backend
   heroku addons:create heroku-postgresql:hobby-dev
   
   # Set environment variables
   heroku config:set JWT_SECRET=your_secret
   heroku config:set SESSION_SECRET=your_session_secret
   
   # Deploy
   git subtree push --prefix backend heroku main
   
   # Run database migrations
   heroku pg:psql < database_schema.sql
   ```

2. **Frontend (Netlify/Vercel)**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Environment variables: `REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api`

## Environment Variables Reference

### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bella_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **HTTPS**: Always use HTTPS in production
3. **Database**: Use strong passwords and restrict database access
4. **CORS**: Configure CORS properly for production domains
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Input Validation**: All user inputs are validated on both client and server

## Monitoring and Maintenance

1. **Logging**: Use PM2 logs or cloud platform logging
2. **Database Backups**: Set up regular PostgreSQL backups
3. **Updates**: Keep dependencies updated regularly
4. **Performance**: Monitor API response times and database queries

## Troubleshooting

### Common Issues
1. **Database Connection**: Check PostgreSQL service and credentials
2. **CORS Errors**: Verify FRONTEND_URL in backend .env
3. **Build Failures**: Check Node.js version compatibility
4. **Authentication Issues**: Verify JWT_SECRET and session configuration

### Health Check Endpoints
- Backend: `GET /api/health`
- Database: Check PostgreSQL connection in server logs

## Support

For deployment issues:
1. Check server logs
2. Verify environment variables
3. Test database connectivity
4. Ensure all dependencies are installed

The application includes comprehensive error handling and logging to help diagnose issues quickly.