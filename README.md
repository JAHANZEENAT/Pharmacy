# PharmaFlow - Advanced Pharmacy Management System

PharmaFlow is a comprehensive, multi-role web application designed to streamline pharmacy operations, connecting customers, pharmacists, delivery partners, and administrators in a single ecosystem. built with modern web technologies for performance and scalability.

## 🚀 Key Features

### 🛍️ Customer Portal
- **Browse & Search**: extensive catalog of medicines with categories.
- **Prescription Upload**: Secure upload for prescription-only medicines.
- **Cart & Checkout**: Seamless ordering process with multiple payment options (COD, Online).
- **Order Tracking**: Real-time status updates on orders.

### 🏥 Pharmacist Dashboard
- **Inventory Management**: Add, update, and track medicine stock levels.
- **Order Processing**: Accept/Reject orders, verify prescriptions.
- **Analytics**: View sales reports, top-selling products, and revenue stats.
- **Profile Management**: Manage pharmacy details and verification documents.

### 🚚 Delivery Partner Portal
- **Order Assignment**: View assigned deliveries in real-time.
- **Navigation**: Integration for delivery locations.
- **Proof of Delivery**: Secure OTP-based delivery confirmation.
- **Earnings Tracker**: Monitor completed deliveries and earnings.

### 🛡️ Admin Dashboard
- **User Management**: Oversee all users (Customers, Pharmacists, Delivery Partners).
- **Verification**: Review and approve pharmacy and delivery partner registrations.
- **Platform Analytics**: High-level overview of total orders, revenue, and active users.
- **Content Management**: Manage global medicine database and categories.

## 🛠️ Technology Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router, Server Components)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Backend**: Next.js API Routes (Serverless functions)
- **Database**: PostgreSQL (Local or Supabase)
- **Authentication**: JWT-based custom auth with role-based access control (RBAC)
- **State Management**: React Context & Hooks
- **Icons**: Lucide React

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 18+ installed.
- PostgreSQL database (Local or Cloud).

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/pharmaflow.git
cd Pharmacy
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/pharmacy_db"

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secret
JWT_SECRET=your_secure_jwt_secret
```

### 4. Database Setup

Initialize the database schema and seed initial data:

**Option A: Using Scripts (Recommended)**
```bash
# Run migration script
node scripts/migrate-db.js

# Seed database with test users and medicines
node scripts/seed-db.js
```

**Option B: Manual SQL**
Execute the contents of `pg_schema.sql` in your PostgreSQL client (e.g., pgAdmin, DBeaver).

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Test Credentials

Use the following accounts to explore different roles (password for all: `password123` or strictly as noted):

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@pharmacy.com` | `admin123` |
| **Pharmacist** | `pharmacist@test.com` | `password123` |
| **Customer** | `customer@test.com` | `password123` |
| **Delivery** | `delivery@test.com` | `password123` |

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── admin/            # Admin portal routes
│   ├── api/              # API routes (Backend logic)
│   ├── customer/         # Customer portal routes
│   ├── delivery/         # Delivery portal routes
│   ├── operator/         # Shared login for Pharmacist/Delivery
│   ├── pharmacist/       # Pharmacist portal routes
│   └── pharmacy/         # Pharmacy registration routes
├── components/           # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── ui/               # Shadcn/UI primitives
│   └── ...
├── lib/                  # Utility functions & DB config
├── public/               # Static assets
└── scripts/              # Database migration & seed scripts
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📄 License

This project is licensed under the MIT License.
