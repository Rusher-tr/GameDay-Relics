# 🏆 GameDay-Relics

**GameDay-Relics** is a full-stack e-commerce marketplace platform designed for buying and selling authentic sports memorabilia. The platform features secure escrow payment processing, multi-gateway shipping options, dispute resolution, and comprehensive admin controls.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [User Roles](#-user-roles)
- [Payment Gateways](#-payment-gateways)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with role-based access control (Buyer, Seller, Admin)
- **Product Management**: Create, update, delete, and verify product listings with multi-image upload
- **Escrow System**: Secure payment holding until order completion
- **Multi-Gateway Shipping**: Support for DHL, FedEx, TCS, Leopard, and M&P
- **Dispute Resolution**: Admin-managed dispute system with evidence upload
- **Payment Integration**: Stripe integration with support for EasyPaisa, JazzCash, and NayaPay
- **Order Tracking**: Real-time order status updates with tracking numbers
- **Audit Logging**: Complete transaction history for compliance

### Seller Features
- Product verification system
- Payment gateway configuration (Stripe, EasyPaisa, JazzCash, NayaPay)
- Escrow balance tracking
- Shipping provider selection
- Order management dashboard

### Buyer Features
- Advanced product search
- Shopping cart functionality
- Delivery gateway selection
- Order satisfaction marking
- Dispute filing with evidence upload

### Admin Features
- Order force-cancellation
- Dispute resolution (Refund/Release Escrow)
- Escrow release management
- Complete audit log access
- User management

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Payment Processing**: Stripe API
- **Password Hashing**: bcrypt

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **UI Components**: Lucide React Icons
- **Notifications**: React Toastify
- **PDF Generation**: jsPDF + html2canvas

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **npm**: v9.x or higher (comes with Node.js)
- **MongoDB**: Local installation or MongoDB Atlas account ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git**: For cloning the repository ([Download](https://git-scm.com/))

### Optional but Recommended
- **Visual Studio Code**: Best IDE for this project ([Download](https://code.visualstudio.com/))
- **Postman**: For API testing ([Download](https://www.postman.com/))

---

## 🚀 Installation

Follow these steps to set up the project on your local machine:

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/GameDay-Relics.git
cd GameDay-Relics
```

### 2. Install Backend Dependencies

```bash
cd GameDay-Relics
npm install
```

**Backend Dependencies:**
- bcrypt (v6.0.0) - Password hashing
- cloudinary (v2.8.0) - Image hosting
- cookie-parser (v1.4.7) - Cookie handling
- cors (v2.8.5) - Cross-origin resource sharing
- dotenv (v17.2.2) - Environment variable management
- express (v5.1.0) - Web framework
- jsonwebtoken (v9.0.2) - JWT authentication
- mongoose (v8.18.2) - MongoDB ODM
- multer (v2.0.2) - File upload handling
- nodemon (v3.1.10) - Auto-restart development server
- stripe (v19.3.0) - Payment processing

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Frontend Dependencies:**
- react (v18.3.1) - UI library
- react-router-dom (v7.9.6) - Client-side routing
- axios (v1.13.2) - HTTP client
- lucide-react (v0.344.0) - Icon library
- react-toastify (v11.0.5) - Toast notifications
- tailwindcss (v3.4.1) - CSS framework
- typescript (v5.5.3) - Type safety
- vite (v5.4.2) - Build tool

---

## 🔐 Environment Variables

The project includes a `.env` file in the `GameDay-Relics` directory. This file contains all necessary environment variables for the project to run.

### Required Environment Variables

Create or verify the `.env` file in the `GameDay-Relics` folder:

```env
# Server Configuration
PORT=8000

# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Cloudinary Configuration (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Stripe Configuration (Payment Processing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

> **Note for Teacher/Grader**: The `.env` file with working credentials is included in this repository for grading purposes. In production, this file should NEVER be committed to version control.

---

## ▶️ Running the Application

### Start the Backend Server

1. Open a terminal in the project root directory
2. Navigate to the backend folder:
   ```bash
   cd GameDay-Relics
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The backend server will start on **http://localhost:8000**

### Start the Frontend Application

1. Open a **new terminal** (keep the backend running)
2. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The frontend will start on **http://localhost:5173**

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 📁 Project Structure

```
GameDay-Relics/
│
├── GameDay-Relics/                 # Backend Directory
│   ├── src/
│   │   ├── controllers/            # Route controllers
│   │   │   ├── admin.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── product.controller.js
│   │   │   └── user.controller.js
│   │   ├── middlewares/            # Authentication & error handling
│   │   │   ├── auth.middleware.js
│   │   │   └── multer.middleware.js
│   │   ├── models/                 # Mongoose schemas
│   │   │   ├── user.models.js
│   │   │   ├── product.models.js
│   │   │   ├── order.models.js
│   │   │   ├── dispute.models.js
│   │   │   ├── auditlog.models.js
│   │   │   └── verification.models.js
│   │   ├── routes/                 # API routes
│   │   │   ├── admin.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── product.routes.js
│   │   │   └── user.routes.js
│   │   ├── utils/                  # Helper functions
│   │   │   ├── ApiError.js
│   │   │   ├── ApiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   └── cloudinary.js
│   │   ├── db/                     # Database connection
│   │   │   └── index.js
│   │   ├── app.js                  # Express app configuration
│   │   └── index.js                # Server entry point
│   ├── .env                        # Environment variables
│   └── package.json
│
├── frontend/                       # Frontend Directory
│   ├── public/
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AuthModal.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── DisputeDetailsModal.tsx
│   │   │   ├── DisputeForm.tsx
│   │   │   ├── EscrowReleasePopup.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── OrderTracking.tsx
│   │   │   └── ProductCard.tsx
│   │   ├── pages/                  # Page components
│   │   │   ├── AdminAuditLogsPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── MyOrdersPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── SellerDashboardPage.tsx
│   │   │   ├── SellerOrdersPage.tsx
│   │   │   ├── SellerProductsPage.tsx
│   │   │   └── ShopPage.tsx
│   │   ├── lib/                    # Utilities
│   │   │   └── api.ts              # Axios configuration
│   │   ├── types/                  # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx                 # Main app component
│   │   ├── main.tsx                # App entry point
│   │   └── index.css               # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── README.md                       # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/logout` - Logout user
- `POST /api/v1/users/refresh-token` - Refresh access token

### Products
- `GET /api/v1/products` - Get all products (paginated)
- `GET /api/v1/products/search` - Search products
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (Seller)
- `PATCH /api/v1/products/:id` - Update product (Seller)
- `DELETE /api/v1/products/:id` - Delete product (Seller/Admin)
- `POST /api/v1/products/:id/verify` - Verify product (Seller)

### Orders
- `POST /api/v1/orders` - Create order (Buyer)
- `GET /api/v1/orders/user` - Get buyer's orders
- `GET /api/v1/orders/seller` - Get seller's orders
- `POST /api/v1/orders/:id/dispute` - Raise dispute (Buyer)
- `POST /api/v1/orders/:id/satisfaction` - Mark satisfaction (Buyer)
- `POST /api/v1/orders/:id/confirm-shipping` - Confirm shipping (Seller)

### Admin
- `GET /api/v1/admins/disputes` - Get all disputes
- `GET /api/v1/admins/disputes/:disputeId` - Get dispute details
- `POST /api/v1/admins/disputes/:disputeId/refund` - Process refund
- `POST /api/v1/admins/disputes/:disputeId/release-escrow` - Release escrow to seller
- `GET /api/v1/admins/audit-logs` - Get audit logs
- `POST /api/v1/admins/orders/:id/cancel` - Force cancel order

### Payments
- `POST /api/v1/payment/create-checkout-session` - Create Stripe checkout
- `POST /api/v1/payment/webhook` - Stripe webhook handler

---

## 👥 User Roles

### 1. **Buyer**
- Browse and search products
- Purchase products
- Track orders
- Mark satisfaction
- Raise disputes

### 2. **Seller**
- List products
- Verify products
- Configure payment settings
- Manage orders
- Confirm shipping
- View escrow balance

### 3. **Admin**
- View all orders and disputes
- Resolve disputes (Refund/Release Escrow)
- Force cancel orders
- Access audit logs
- Manage platform operations

---

## 💳 Payment Gateways

### Supported Payment Methods

1. **Stripe** - International card payments
2. **EasyPaisa** - Mobile wallet (Pakistan)
3. **JazzCash** - Mobile wallet (Pakistan)
4. **NayaPay** - Digital wallet (Pakistan)

Sellers can configure their preferred payment gateway in the seller dashboard settings.

---

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
- **Issue**: `EADDRINUSE` error
- **Solution**: Port 8000 is already in use. Kill the process or change the PORT in `.env`

#### Frontend won't start
- **Issue**: `EADDRINUSE` error on port 5173
- **Solution**: Kill the process or change the port in `vite.config.ts`

#### Database connection fails
- **Issue**: `MongoServerError: Authentication failed`
- **Solution**: Check your `MONGODB_URI` in `.env` file. Ensure MongoDB is running (if local) or credentials are correct (if Atlas)

#### Images not uploading
- **Issue**: Cloudinary upload fails
- **Solution**: Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env`

#### Payment integration not working
- **Issue**: Stripe checkout fails
- **Solution**: Verify `STRIPE_SECRET_KEY` in `.env`. Ensure you're using test keys for development

#### CORS errors
- **Issue**: Frontend can't connect to backend
- **Solution**: Ensure `CORS_ORIGIN=http://localhost:5173` in `.env`

---

## 📝 Testing Credentials

For grading/testing purposes, you can create test accounts with these roles:

### Create Admin Account
```javascript
// Register with role: "admin"
{
  "username": "admin",
  "email": "admin@gameday.com",
  "password": "admin123",
  "role": "admin"
}
```

### Create Seller Account
```javascript
// Register with role: "seller"
{
  "username": "seller1",
  "email": "seller@gameday.com",
  "password": "seller123",
  "role": "seller"
}
```

### Create Buyer Account
```javascript
// Register with role: "buyer" (default)
{
  "username": "buyer1",
  "email": "buyer@gameday.com",
  "password": "buyer123"
}
```

---

## 📄 License

This project is created for educational purposes as part of a university assignment.

---

## 👨‍💻 Author

**Ahmer**  
Full Stack Developer  
Contact: [Your Email/GitHub]

---

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Cloudinary for image management
- Stripe for payment processing
- All open-source libraries used in this project

---

## 📞 Support

For any questions or issues regarding this project, please contact the repository owner or create an issue on GitHub.

---

**Happy Coding! 🚀**
