# PharmaFlow - Online Pharmacy Management System

## Project Overview
A comprehensive Online Pharmacy Management System with strictly separated authentication flows and role-based dashboards for Customers, Pharmacists, Delivery Boys, and Admin.

## Tech Stack
- **Frontend:** Next.js 14 with App Router
- **Backend:** Next.js API Routes  
- **Database:** MongoDB (with Supabase integration ready)
- **Authentication:** JWT-based with role-based access control
- **Storage:** Supabase Storage (with local fallback)
- **Payments:** Mocked payment service (ready for Razorpay integration)
- **Maps:** Mocked map service (ready for Google Maps integration)

## Completed Features

### ✅ Core Infrastructure
1. **Database Setup**
   - MongoDB connection with connection pooling
   - Collections: users, orders, medicines
   - Indexes for performance optimization

2. **Authentication System**
   - JWT-based authentication
   - Password hashing with bcrypt
   - Role-based access control (RBAC)
   - Separate auth flows for each user type

3. **API Routes (All Implemented)**
   - `/api/auth/customer/register` - Customer registration (Email/Password)
   - `/api/auth/customer/login` - Customer login (Email/Password)
   - `/api/auth/customer/google` - Google OAuth (mocked, ready for integration)
   - `/api/auth/operator/register` - Pharmacist & Delivery Boy registration with document upload
   - `/api/auth/operator/login` - Operator login (blocks if not approved)
   - `/api/auth/admin/login` - Admin login (email/password only)
   - `/api/medicines` - Get medicines with search and filters
   - `/api/medicines/:id` - Get single medicine
   - `/api/medicines/add` - Add new medicine (Admin/Pharmacist)
   - `/api/orders` - Get user-specific orders
   - `/api/orders/place` - Place new order with payment
   - `/api/orders/approve` - Pharmacist approve/reject order
   - `/api/orders/pack` - Mark order as packed
   - `/api/orders/assign-delivery` - Assign delivery boy
   - `/api/orders/confirm-delivery` - Confirm delivery with OTP
   - `/api/admin/users` - List all users (with privacy filters)
   - `/api/admin/users/approve` - Approve/reject operators
   - `/api/admin/orders` - Monitor order flow (status only)
   - `/api/seed` - Seed initial data (admin + sample medicines)

### ✅ Authentication Pages (STRICTLY SEPARATED)

#### Customer Auth (Google OAuth + Email/Password)
- `/customer/login` - Customer login page with Google OAuth option
- `/customer/register` - Customer registration with full details

#### Pharmacist Auth (Email/Password ONLY)
- `/pharmacy/register` - Dedicated registration for Pharmacists
  - Requirement: Government-issued pharmacy license
  - Account created with `verification_status = pending`
  - Login blocked until admin approval

#### Delivery Partner Auth (Email/Password ONLY)
- `/delivery/register` - Dedicated registration for Delivery Partners
  - Requirement: 18+ identity proof (Aadhaar/PAN)
  - Account created with `verification_status = pending`
  - Login blocked until admin approval

#### Shared Operator Login
- `/operator/login` - Operator login (shows pending message if not approved)

#### Admin Auth (Email/Password ONLY - No Public Signup)
- `/admin/login` - Admin login page
- Demo credentials: admin@pharmacy.com / admin123

### ✅ Customer Features

#### Shopping Experience (`/customer/shop`)
- Medicine catalog with search functionality
- Medicine cards showing:
  - Name, description, price, stock
  - Prescription requirement badge
  - Category
  - Add to cart button
- Shopping cart dialog with:
  - Quantity management
  - Remove items
  - Total calculation
  - Prescription requirement warnings
  - Proceed to checkout

### 🔄 In Progress

#### Customer Features (Next)
- `/customer/checkout` - Checkout page with:
  - Prescription upload for Rx-required medicines
  - Address confirmation
  - Payment method selection (UPI/Card/COD)
  - Order summary
- `/customer/orders` - Order history and tracking
- `/customer/orders/:id` - Individual order tracking with map

#### Pharmacist Dashboard (`/pharmacist/*`)
- `/pharmacist/dashboard` - Overview with pending orders
- `/pharmacist/orders` - Order management
  - View prescription images
  - Approve/reject orders
  - Mark as packed
  - Assign delivery boys
- `/pharmacist/inventory` - Manage medicine stock
- `/pharmacist/sales` - Sales history and analytics

#### Delivery Boy Dashboard (`/delivery/*`)
- `/delivery/dashboard` - Assigned deliveries overview
- `/delivery/active` - Active delivery tracking
  - View pickup and drop locations
  - Navigation with map
  - Update delivery status
  - OTP-based confirmation
- `/delivery/history` - Completed deliveries
- `/delivery/earnings` - Earnings summary

#### Admin Dashboard (`/admin/*`)
- `/admin/dashboard` - System overview
- `/admin/users` - User management
  - List customers, pharmacists, delivery boys
  - Show active/inactive status
  - Show last order timestamp (NO ORDER DETAILS for privacy)
  - Approve/reject pending operators
  - View uploaded documents for verification
- `/admin/orders` - Order monitoring
  - View order status only (NO DETAILS for privacy)
  - System-level metrics
- `/admin/medicines` - Master medicine database
- `/admin/analytics` - System analytics and reports

## Order Lifecycle

```
Placed → Approved → Packed → Out for Delivery → Delivered
         ↓
      Rejected

Alternative states: Cancelled, Returned
```

## User Roles & Permissions

### Customer
- Browse and search medicines
- Add to cart and checkout
- Upload prescriptions
- Place orders with multiple payment methods
- Track orders in real-time
- View order history

### Pharmacist
- Manage inventory (stock, pricing, expiry)
- Receive and view orders
- Verify prescriptions
- Approve/reject orders
- Mark orders as packed
- Assign delivery boys
- View sales history

### Delivery Boy
- View assigned deliveries
- Accept delivery jobs
- View pickup and drop locations with navigation
- Update delivery status
- Confirm delivery with OTP
- View earnings

### Admin
- List all users (with privacy protection)
- Approve/reject pharmacists and delivery boys
- Monitor order flow (status only, NO DETAILS)
- Manage master medicine database
- Configure system settings
- View analytics

## Privacy & Security Features

1. **Admin Privacy Restrictions**
   - Admin CANNOT view customer order contents
   - Admin CANNOT view medicine details in customer orders
   - Admin can only see: order status, timestamps, IDs

2. **Document Verification**
   - Pharmacists must upload valid pharmacy license
   - Delivery boys must upload 18+ ID proof
   - All documents reviewed by admin before approval

3. **Prescription Handling**
   - Prescription-required medicines flagged
   - Upload mandatory at checkout
   - Verified by pharmacist before approval
   - Encrypted storage

4. **Payment Security**
   - Mocked payment flow for MVP
   - Service layer ready for Razorpay integration
   - No hardcoded credentials

## Integration Points (Ready for Configuration)

### Supabase
- Environment variables configured in `.env`
- Client initialized with fallback
- Storage service ready for file uploads
- Authentication can use Supabase Auth when configured

### Google OAuth
- Environment variables prepared
- OAuth flow implemented (mocked)
- Ready for actual Google credentials

### Razorpay Payments
- Payment service abstraction complete
- Supports UPI, Card, COD
- Mock responses for development
- Easy to swap with actual Razorpay SDK

### Google Maps
- Map service abstraction complete
- Geocoding and routing ready
- Mocked coordinates for development
- Environment variable for API key

## Database Schema

### Users Collection
```javascript
{
  userId: String (UUID),
  email: String (unique),
  password: String (hashed),
  name: String,
  phone: String,
  role: String (customer|pharmacist|delivery_boy|admin),
  verificationStatus: String (pending|approved|rejected),
  documentUrl: String (for operators),
  active: Boolean,
  createdAt: ISO Date,
  // Customer-specific
  address: String,
  // Operator-specific
  approvedAt: ISO Date,
  approvedBy: String (userId)
}
```

### Orders Collection
```javascript
{
  orderId: String,
  customerId: String (UUID),
  items: Array [{
    medicineId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  deliveryAddress: String,
  deliveryCoordinates: { lat: Number, lng: Number },
  paymentMethod: String (upi|card|cod),
  paymentId: String,
  paymentStatus: String,
  prescriptionUrls: Array [String],
  totalAmount: Number,
  status: String,
  statusHistory: Array [{
    status: String,
    timestamp: ISO Date,
    note: String,
    userId: String
  }],
  pharmacistId: String (UUID),
  deliveryBoyId: String (UUID),
  rejectionReason: String,
  deliveredAt: ISO Date,
  createdAt: ISO Date
}
```

### Medicines Collection
```javascript
{
  medicineId: String (UUID),
  name: String,
  description: String,
  price: Number,
  stock: Number,
  manufacturer: String,
  category: String,
  prescriptionRequired: Boolean,
  expiryDate: String,
  imageUrl: String,
  createdBy: String (userId),
  createdAt: ISO Date,
  updatedAt: ISO Date
}
```

## Sample Data Seeded

### Admin User
- Email: admin@pharmacy.com
- Password: admin123

### Sample Medicines (5 items)
1. Paracetamol 500mg (Pain Relief, No Rx)
2. Amoxicillin 250mg (Antibiotics, Rx Required)
3. Cetirizine 10mg (Allergy, No Rx)
4. Omeprazole 20mg (Digestive, No Rx)
5. Metformin 500mg (Diabetes, Rx Required)

## Environment Variables

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=pharmacy_management_system

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase (to be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google OAuth (to be configured)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Maps API (to be configured)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Security
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
SESSION_SECRET=your_session_secret_change_this_in_production
```

## Next Steps for Full MVP

1. **Customer Checkout & Order Tracking**
   - Prescription upload interface
   - Payment method selection UI
   - Order confirmation page
   - Real-time order tracking with map

2. **Pharmacist Dashboard**
   - Order queue interface
   - Prescription viewer
   - Inventory management
   - Delivery assignment interface

3. **Delivery Boy Dashboard**
   - Active delivery interface
   - Map integration for navigation
   - OTP confirmation screen
   - Earnings tracker

4. **Admin Dashboard**
   - User approval interface
   - Document viewer for verification
   - System monitoring dashboard
   - Analytics and reports

5. **Testing & Refinement**
   - End-to-end flow testing
   - Role-based access testing
   - Privacy compliance verification
   - Performance optimization

## Compliance Checklist

- ✅ Prescription-mandatory medicines flagged
- ✅ Pharmacy license verification system
- ✅ 18+ age verification for delivery personnel
- ✅ Medicine expiry validation in schema
- ✅ OTP-based delivery confirmation
- ✅ Password encryption (bcrypt)
- ✅ Role-based access control
- ✅ Admin privacy restrictions (no order details)
- ✅ Audit logs in order status history
- ⏳ Mobile-first responsive UI (in progress)

## Current Status

**Phase:** Core Infrastructure Complete, Customer Flow In Progress
**Progress:** ~40% of Full MVP
**Next Milestone:** Complete customer checkout and order tracking
