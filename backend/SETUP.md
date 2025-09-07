# Library Management System - Backend Setup

## Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp env-template.txt .env
   ```

2. **Update the .env file with your actual values:**

### Required Configuration

#### Database
- **MONGODB_URI**: Your MongoDB connection string
  - Local: `mongodb://localhost:27017/library_management`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/library_management`

#### Security
- **JWT_SECRET**: Generate a strong secret key (at least 32 characters)
  ```bash
  # Generate a random secret
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

#### Email (Optional - for notifications)
- **EMAIL_HOST**: SMTP server (e.g., smtp.gmail.com)
- **EMAIL_PORT**: SMTP port (usually 587)
- **EMAIL_USER**: Your email address
- **EMAIL_PASS**: Your email password or app password

### Optional Configuration

#### External APIs
- **GOOGLE_BOOKS_API_KEY**: For book data enrichment
- **GOODREADS_API_KEY**: For additional book information

#### Redis (Optional - for caching)
- **REDIS_URL**: Redis connection string for caching

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env-template.txt .env
   # Edit .env with your values
   ```

3. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   ```

4. **Run the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/api/health

## Default Demo Accounts

The system includes demo accounts for testing:

- **Admin**: admin@library.com / admin123
- **Librarian**: librarian@library.com / librarian123  
- **Member**: member@library.com / member123

## Database Seeding

To populate the database with sample data, you can create a seed script or use the API endpoints to add books and users.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in .env
   - Verify network connectivity

2. **JWT Secret Error**
   - Make sure JWT_SECRET is set in .env
   - Use a strong, random secret key

3. **Port Already in Use**
   - Change the PORT in .env
   - Or kill the process using the port

### Logs

Check the application logs for detailed error information:
```bash
# If LOG_FILE is configured
tail -f logs/app.log

# Or check console output
npm run dev
```
