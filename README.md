# Library Management System

A comprehensive, full-stack library management system built with modern technologies, featuring role-based authentication, Google Books API integration, and a beautiful, responsive UI.

## 🚀 Features

### Core Features
- **Complete REST API** with all CRUD operations
- **JWT-based Authentication** with role-based access control
- **Google Books API Integration** for importing books
- **Responsive Web Application** with modern UI/UX
- **Real-time Notifications** system
- **Advanced Search & Filtering** capabilities
- **Book Borrowing & Returning** system
- **User Management** with different roles
- **Analytics Dashboard** with insights
- **Review & Rating** system

### User Roles
- **Admin**: Full system access, user management, analytics
- **Librarian**: Book management, user assistance, transactions
- **Student**: Borrow books, view personal history, reviews
- **Member**: Standard library access, borrowing, reviews

### Technical Features
- **MongoDB** database with comprehensive schemas
- **Express.js** backend with security middleware
- **Next.js** frontend with TypeScript
- **Tailwind CSS** with custom color schemes
- **Zustand** state management
- **Swagger API Documentation**
- **Rate Limiting** and security measures

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Express Validator** for input validation
- **Swagger** for API documentation
- **Helmet** for security headers
- **CORS** for cross-origin requests

### Frontend
- **Next.js 15** with TypeScript
- **React 18** with hooks
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hook Form** for form handling
- **Axios** for API calls
- **Lucide React** for icons
- **React Hot Toast** for notifications

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Library_Management/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env-template.txt .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/library_management
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   GOOGLE_BOOKS_API_KEY=AIzaSyBpDc56l-ORyhBHx_BiGkKro-zAc3Q10II
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`
   API Documentation: `http://localhost:5000/api-docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🎯 Demo Accounts

The system comes with pre-configured demo accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Librarian | librarian@library.com | librarian123 |
| Student | student@library.com | student123 |
| Member | member@library.com | member123 |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Books
- `GET /api/books` - Get all books (with filtering)
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create new book (Admin/Librarian)
- `PUT /api/books/:id` - Update book (Admin/Librarian)
- `DELETE /api/books/:id` - Delete book (Admin/Librarian)
- `POST /api/books/:id/borrow` - Borrow a book
- `POST /api/books/:id/return` - Return a book
- `GET /api/books/google-search` - Search Google Books
- `POST /api/books/import-from-google` - Import from Google Books

### Users
- `GET /api/users` - Get all users (Admin/Librarian)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (Admin/Librarian)
- `DELETE /api/users/:id` - Delete user (Admin)

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions/:id/renew` - Renew transaction
- `POST /api/transactions/:id/return` - Return transaction

## 🎨 UI Features

### Design System
- **Modern Color Palette**: Primary (Sky Blue), Accent (Purple), Emerald, Orange
- **Gradient Backgrounds**: Beautiful gradient overlays
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: CSS transitions and hover effects
- **Role-based Navigation**: Different menu options per user role

### Components
- **Dashboard**: Role-specific overview with statistics
- **Books Management**: Advanced search, filtering, and Google Books integration
- **User Management**: Complete user administration
- **My Books**: Personal borrowing history and management
- **Notifications**: Real-time notification system
- **Analytics**: Comprehensive reporting and insights

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **Role-based Access Control** (RBAC)
- **Password Hashing** with bcrypt
- **Input Validation** with express-validator
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for secure cross-origin requests
- **Helmet.js** for security headers
- **Environment Variables** for sensitive data

## 📊 Database Schema

### User Model
- Personal information (name, email, phone)
- Role and permissions (admin, librarian, student, member)
- Library card information
- Reading preferences and history
- Notification settings

### Book Model
- Basic information (title, author, ISBN)
- Publication details (publisher, year, edition)
- Physical properties (pages, format, dimensions)
- Availability and location
- Reviews and ratings
- Digital properties and rights

### Transaction Model
- User and book references
- Transaction type (borrow, return, renew)
- Status tracking (active, overdue, returned)
- Due dates and fine calculations
- Condition tracking

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set up SSL certificates for production

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or similar platforms
3. Configure environment variables
4. Set up custom domain (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the code comments for implementation details

## 🎉 Acknowledgments

- Google Books API for book data integration
- Tailwind CSS for the design system
- Next.js team for the amazing framework
- All open-source contributors

---

**Built with ❤️ for modern library management**
