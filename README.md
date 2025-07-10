# CommerceBridge 🛍️

A personalized online store solution that integrates seamlessly with WhatsApp Business, enabling small and medium businesses (SMBs) to create professional e-commerce experiences within their WhatsApp ecosystem.

## 🎯 Overview

CommerceBridge is a **WhatsApp-first e-commerce platform** where customers and sellers interact entirely through a smart chatbot interface. Think of it as "Jumia on WhatsApp" - everything happens within WhatsApp conversations, from browsing products to completing orders. The CommerceBridge bot serves as the middleman, handling all transactions and communications between customers and sellers without direct contact.

**Key Concept**: No separate website or app needed - the entire e-commerce experience happens through WhatsApp chat!

## 🚀 Key Features

### Core Features (MVP)
- ✅ **WhatsApp-First Interface**: Complete e-commerce experience through WhatsApp chat
- ✅ **Smart Chatbot**: AI-powered bot that handles all customer and seller interactions
- ✅ **Product Browsing**: Browse catalogs, search products, and view details via chat
- ✅ **Shopping Cart**: Add items to cart and manage orders through conversation
- ✅ **Order Processing**: Complete purchase flow including payment via WhatsApp
- ✅ **Seller Management**: Upload products, manage inventory, and track sales via WhatsApp
- ✅ **Profile Creation**: Web link for account setup (only non-WhatsApp interaction)
- ✅ **Digital Receipt as Image**: After payment, customers receive a digital receipt image via WhatsApp

### Advanced & Planned Features
- 📦 **Order Status Notifications**
- 📦 **Order History & Reordering**
- 📦 **Personalized Recommendations**
- 📦 **Customer Support Escalation**
- 📦 **Feedback & Ratings**
- 🛍️ **Sales & Inventory Alerts**
- 🛍️ **Promotional Broadcasts**
- 🛍️ **Multi-Store Management**
- 🛍️ **Analytics Snapshots**
- 💳 **Refunds & Dispute Handling**
- 💳 **Multi-Payment Options**
- 💳 **Payment Reminders**
- 🌍 **Multi-Language Support**
- 🌍 **Accessibility Features**
- 🔄 **Third-Party Integrations**
- 🔄 **Scheduled Messages**
- 🛡️ **Privacy Controls**
- 🛡️ **Verified Business Badges**

## ��️ Technology Stack

### Frontend
- **React.js** with TypeScript
- **Material-UI** or **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **WhatsApp Web JS** for WhatsApp integration
- **Paystack SDK** for payment processing

### Database
- **PostgreSQL** for primary data storage
- **MongoDB** for real-time features and analytics
- **Redis** for caching and session management

### Additional Services
- **Firebase** for real-time features
- **AWS S3** for file storage
- **SendGrid** for email notifications

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v14 or higher)
- MongoDB (v6 or higher)
- Redis (v6 or higher)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/commerce-bridge.git
cd commerce-bridge
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup
Create environment files for both backend and frontend:

#### Backend (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/commerce_bridge
MONGODB_URI=mongodb://localhost:27017/commerce_bridge
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_WEBHOOK_URL=https://your-domain.com/webhook

# Paystack Configuration
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=your-paystack-public-key
PAYSTACK_WEBHOOK_SECRET=your-webhook-secret

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# AWS Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@commercebridge.com

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WHATSAPP_NUMBER=+1234567890
REACT_APP_PAYSTACK_PUBLIC_KEY=your-paystack-public-key
REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id
```

### 4. Database Setup
```bash
# Run database migrations
cd backend
npm run migrate

# Seed initial data
npm run seed
```

### 5. Start Development Servers
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in new terminal)
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

**Payment Flow Note:** After successful payment, the bot automatically generates and sends a digital receipt image to the customer via WhatsApp.

## 📁 Project Structure

```
commerce-bridge/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   ├── migrations/          # Database migrations
│   └── tests/               # Backend tests
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── shared/                  # Shared types and utilities
├── docs/                    # Documentation
└── scripts/                 # Build and deployment scripts
```

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run migrate      # Run database migrations
npm run seed         # Seed database with initial data
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

#### Frontend
```bash
npm start            # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Code Style
This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Conventional Commits** for commit messages

### Testing
- **Jest** for unit testing
- **Supertest** for API testing
- **React Testing Library** for component testing
- **Cypress** for end-to-end testing

## 🔐 Security

- End-to-end encryption for transactions
- JWT-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- HTTPS enforcement
- Secure payment processing with Paystack

## 📊 API Documentation

API documentation is available at `/api-docs` when the server is running. The API includes endpoints for:

- **Authentication**: Login, register, password reset
- **Products**: CRUD operations for product management
- **Orders**: Order creation, tracking, and management
- **Payments**: Payment processing and verification
- **WhatsApp**: Message handling and webhook processing
- **Analytics**: Sales reports and business insights

## 🚀 Deployment

### Production Deployment
1. Set up production environment variables
2. Build the application: `npm run build`
3. Set up reverse proxy (Nginx)
4. Configure SSL certificates
5. Set up monitoring and logging

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow the established code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🗺️ Roadmap

### Phase 1 (MVP) - Completed
- [x] Basic store setup
- [x] Order processing
- [x] Inventory management
- [x] Payment integration

### Phase 2 (Must-Have) - In Progress
- [ ] Shopping cart functionality
- [ ] Order tracking system
- [ ] Chatbot support
- [ ] Multi-language support

### Phase 3 (Nice-to-Have) - Planned
- [ ] Advanced analytics
- [ ] Marketing automation
- [ ] Customer loyalty program
- [ ] Advanced reporting

## 🙏 Acknowledgments

- WhatsApp Business API for messaging integration
- Paystack for payment processing
- React and Node.js communities for excellent tooling
- All contributors and supporters of this project

---

**CommerceBridge** - Bridging WhatsApp Business with Professional E-commerce 🚀 