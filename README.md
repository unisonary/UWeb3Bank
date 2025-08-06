# UWeb3Bank Admin Dashboard

A secure, modern admin dashboard for virtual card management with profit margin tracking and API integration.

## 🚀 Features

### ✅ Core Functionality
- **Secure Authentication** - JWT-based authentication with rate limiting and account lockout
- **Virtual Card Management** - Create, view, update, and manage virtual cards
- **Transaction Tracking** - Complete transaction history with profit margin calculations
- **Profit Margin Settings** - Configurable profit margins for different transaction types
- **Real-time Analytics** - Dashboard with charts, statistics, and insights
- **API Integration** - Seamless integration with virtual card providers

### 🔒 Security Features
- **Helmet.js** - Security headers and CSP protection
- **Rate Limiting** - API rate limiting to prevent abuse
- **Input Validation** - Comprehensive form validation and sanitization
- **Password Security** - bcrypt hashing with salt rounds
- **CORS Protection** - Configurable CORS policies
- **Session Management** - Secure session handling

### 📊 Admin Dashboard
- **Responsive Design** - Mobile-first, modern UI with Tailwind CSS
- **Real-time Updates** - Live data updates and notifications
- **Data Export** - Export data in JSON and CSV formats
- **System Monitoring** - Health checks and performance metrics
- **User Management** - Admin user profiles and permissions

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Axios** - HTTP client for API calls

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **Zustand** - State management

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- Virtual Card API credentials

### 1. Clone the Repository
```bash
git clone <repository-url>
cd uweb3bank
```

### 2. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Database Setup
```bash
# Start MongoDB (if local)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### 5. Initialize Database
```bash
# Start the server
npm run server:dev

# The system will automatically create default admin user
# Email: admin@uweb3bank.com
# Password: secure-admin-password
```

### 6. Start Development Servers
```bash
# Start both server and client
npm run dev

# Or start separately
npm run server:dev  # Backend on port 5000
npm run client:dev  # Frontend on port 3000
```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret-key

# Database
MONGODB_URI=mongodb://localhost:27017/uweb3bank-admin

# Virtual Card API
VIRTUAL_CARD_API_BASE_URL=https://api.virtualcardprovider.com
VIRTUAL_CARD_API_KEY=your-api-key
VIRTUAL_CARD_API_SECRET=your-api-secret

# Admin Configuration
ADMIN_EMAIL=admin@uweb3bank.com
ADMIN_PASSWORD=secure-admin-password

# Profit Margins
DEFAULT_PROFIT_MARGIN=2.5
MIN_PROFIT_MARGIN=0.5
MAX_PROFIT_MARGIN=10.0
```

### Virtual Card API Integration

The system is designed to work with any virtual card provider API. Update the `virtualCardAPI.js` service to match your provider's API endpoints and authentication method.

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy to Vercel**
```bash
vercel
```

3. **Set Environment Variables**
```bash
vercel env add JWT_SECRET
vercel env add MONGODB_URI
vercel env add VIRTUAL_CARD_API_KEY
# ... add all required environment variables
```

4. **Deploy Production**
```bash
vercel --prod
```

### Alternative Deployment Options

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

#### Render
- Connect your GitHub repository
- Set build command: `npm run setup`
- Set start command: `npm start`
- Add environment variables

#### Heroku
```bash
# Install Heroku CLI
heroku create uweb3bank-admin
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
# ... set all environment variables
git push heroku main
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### Card Management
- `GET /api/cards` - Get all cards
- `POST /api/cards` - Create new card
- `GET /api/cards/:cardId` - Get card details
- `PATCH /api/cards/:cardId` - Update card
- `POST /api/cards/:cardId/fund` - Fund card
- `GET /api/cards/:cardId/transactions` - Get card transactions

### Settings Management
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting
- `GET /api/settings/profit-margin/all` - Get profit margins
- `PUT /api/settings/profit-margin/bulk` - Update profit margins

### Dashboard Analytics
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/analytics` - Analytics data
- `GET /api/dashboard/profit-analysis` - Profit analysis
- `GET /api/dashboard/system-health` - System health

## 🔐 Security Considerations

### Production Checklist
- [ ] Change default admin credentials
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Database backups

### API Security
- All API endpoints require authentication (except login)
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- Security headers with Helmet.js

## 📈 Monitoring and Logging

### Logging
- Winston logger with file and console output
- Structured logging with timestamps
- Error tracking and monitoring
- Request/response logging

### Health Checks
- Database connectivity
- External API status
- System resource usage
- Application uptime

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation

## 🔄 Updates and Maintenance

### Regular Maintenance
- Update dependencies regularly
- Monitor security advisories
- Backup database regularly
- Monitor system performance
- Review and update profit margins

### Version Updates
- Follow semantic versioning
- Test thoroughly before deployment
- Maintain backward compatibility
- Update documentation

---

**Built with ❤️ for secure virtual card management** # UWeb3Bank
