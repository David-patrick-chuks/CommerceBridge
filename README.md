# CommerceBridge 🛍️

A personalized online store solution that integrates seamlessly with WhatsApp, enabling small and medium businesses (SMBs) to create professional e-commerce experiences within their WhatsApp ecosystem using a smart chatbot interface. (**Note:** We use WhatsApp Web JS, not WhatsApp Business API.)

> **For the project vision, see [PROJECT_VISION.md](./PROJECT_VISION.md). For a technical deep-dive on image-based product matching, see [README_IMAGE_MATCHING.md](./README_IMAGE_MATCHING.md).**

## 🎯 Overview

CommerceBridge is the **first AI-powered WhatsApp marketplace** where customers and sellers interact entirely through a smart chatbot interface. Everything happens within WhatsApp conversations, from browsing products to completing orders. The CommerceBridge bot serves as the middleman, handling all transactions and communications between customers and sellers without direct contact.

**Key Concept**: No separate website or app needed - the entire e-commerce experience happens through WhatsApp chat!

## 📚 Documentation Map
- **Vision & Philosophy:** [PROJECT_VISION.md](./PROJECT_VISION.md)
- **Main Features & Setup:** (this README)
- **AI Image Matching & Architecture:** [README_IMAGE_MATCHING.md](./README_IMAGE_MATCHING.md)
- **CLIP Server & Hybrid Search:** [clip-server/README.md](./clip-server/README.md)

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
- ✅ **AI-Powered Image Search & Matching**: Find and add products using images, powered by the clip-server
- ✅ **Gemini AI Support**: Intelligent customer support with automatic escalation to human agents

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

---

## 🤖 AI-Powered Image-Based Product Matching (CLIP + RAG)

CommerceBridge supports advanced image search and matching, enabling sellers to upload product images and customers to find products by uploading their own images via WhatsApp. This system uses OpenAI CLIP for image embeddings, a hybrid Retrieval-Augmented Generation (RAG) system for search, and MongoDB Atlas for vector and keyword search.

### How It Works
- **Sellers** can upload product images and details via WhatsApp. The system embeds, deduplicates, and stores these products.
- **Customers** can upload an image of a product they want to find. The bot returns the most similar products from the catalog.
- **Hybrid Search** combines semantic (vector) and keyword (text) search for best results.

### Architecture
- **Node.js WhatsApp Bot** (`backend/`): Handles WhatsApp interactions, receives images and product details, and communicates with the Python FastAPI server for embedding and search.
- **Python FastAPI Server** (`clip-server/`): Runs CLIP for image embedding, implements hybrid RAG search and deduplication, and connects to MongoDB Atlas for storage and retrieval.
- **MongoDB Atlas**: Stores product data, embeddings, and metadata, and provides vector and text search capabilities.

### Example User Flows
**Seller:**
1. `/seller` → “Please send the product image.”
2. Upload image → “Please provide the product name.”
3. Enter name → “Please provide the price.”
4. Enter price → “Please provide the product description.”
5. Enter description → “Product added successfully!”

**Customer:**
1. `/customer` → “Please send an image to find similar products.”
2. Upload image → Bot returns top matches with details and options.

---

## 🗂️ Updated Project Structure

```
commerce-bridge/
├── backend/                 # Backend API server (Node.js, WhatsApp bot, business logic)
│   └── src/
│       └── ...
├── frontend/                # React frontend application (web interface)
│   └── src/
│       └── ...
├── clip-server/             # Python FastAPI server for CLIP embedding & hybrid RAG search
│   ├── app/
│   └── ...
├── shared/                  # Shared types and utilities
├── docs/                    # Documentation
└── README_IMAGE_MATCHING.md # Image matching architecture & details
```

---

## 🛠️ Technology Stack

### Frontend
- **React.js** with TypeScript (for account creation web interface only)
- **Material-UI** or **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **WhatsApp Web JS** for WhatsApp integration (**not WhatsApp Business API**)
- **Paystack SDK** for payment processing

### CLIP Server (AI Image Matching)
- **Python FastAPI** server (clip-server/)
- **OpenAI CLIP** for image embeddings
- **Hybrid RAG search** for product matching
- **MongoDB Atlas** for vector and keyword search

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
- Python 3.8+ (for clip-server)

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
Create environment files for each service as needed:

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

# Support Configuration
SUPPORT_EMAIL=support@commercebridge.com
SUPPORT_PHONE=+234-XXX-XXX-XXXX

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

#### CLIP Server (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/commercebridge
# Add any other variables required by clip-server/app/main.py
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
├── clip-server/             # Python FastAPI server for CLIP embedding & RAG search
│   ├── app/
│   └── ...
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

## 🚀 Deployment (All Services)

### 1. MongoDB Atlas Setup
- Create a `commercebridge` database and `products` collection.
- Create a vector search index on the `embedding` field (768 dimensions, cosine similarity) and a text index for product search.
- Example vector index config:
```json
{
  "name": "product_embedding_vector_index",
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "dimensions": 768,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
```

### 2. Python FastAPI Server (`clip-server/`)
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- Copy `.env.example` to `.env` and fill in your MongoDB Atlas credentials.
- Run the server:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```

### 3. Node.js WhatsApp Bot (`backend/`)
- Integrate image upload and search endpoints to communicate with the Python server.
- Install dependencies:
  ```bash
  npm install
  ```
- Run the bot:
  ```bash
  npm run dev
  ```

### 4. Frontend (`frontend/`)
- Install dependencies:
  ```bash
  npm install
  ```
- Run the frontend:
  ```bash
  npm start
  ```

---

## 🔒 Security & Extensibility Notes
- All uploads and API endpoints should be secured in production.
- Use HTTPS for all communications.
- Deduplication is enforced via SHA256 hashing of images.
- The architecture supports future integration with pricing intelligence, external metadata, and more.
- Monitor MongoDB Atlas for performance and deduplication.
- Consider production hardening (security, error handling, scaling).

---

For more details, see `README_IMAGE_MATCHING.md` and `clip-server/README.md`.

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

- WhatsApp Web JS for messaging integration
- Paystack for payment processing
- React and Node.js communities for excellent tooling
- All contributors and supporters of this project

---

**CommerceBridge** - Bridging WhatsApp with Professional E-commerce 🚀

> For the full vision, see [PROJECT_VISION.md](./PROJECT_VISION.md). For technical details on image-based product matching, see [README_IMAGE_MATCHING.md](./README_IMAGE_MATCHING.md). 