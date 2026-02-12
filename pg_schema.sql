-- Standard PostgreSQL Schema
-- Enable pgcrypto for gen_random_uuid() if below PG 13
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  "userId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  role TEXT,
  "verificationStatus" TEXT DEFAULT 'pending',
  active BOOLEAN DEFAULT false,
  phone TEXT,
  address TEXT,
  "authProvider" TEXT DEFAULT 'email',
  "documentUrl" TEXT,
  "approvedAt" TIMESTAMP WITH TIME ZONE,
  "approvedBy" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
  "medicineId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  category TEXT,
  "prescriptionRequired" BOOLEAN DEFAULT false,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Pharmacies Table
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users("userId") ON DELETE CASCADE,
  
  pharmacy_name TEXT NOT NULL,
  owner_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  license_number TEXT,
  gst_number TEXT,
  
  license_document_url TEXT,
  government_id_url TEXT,
  
  commission INTEGER DEFAULT 10,
  orders_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_pharmacies_user_id ON pharmacies(user_id);

-- Pharmacy Medicines
CREATE TABLE IF NOT EXISTS pharmacy_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  "medicineId" UUID REFERENCES medicines("medicineId") ON DELETE CASCADE,
  
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'draft',
  
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  "orderId" TEXT PRIMARY KEY,
  "customerId" UUID REFERENCES users("userId"),
  items JSONB, -- Array of medicine objects
  "deliveryAddress" TEXT,
  "deliveryCoordinates" JSONB,
  "paymentMethod" TEXT,
  "paymentId" TEXT,
  "paymentStatus" TEXT,
  "prescriptionUrls" TEXT[], -- Array of strings
  "totalAmount" NUMERIC,
  status TEXT,
  "statusHistory" JSONB, -- Array of status objects
  "pharmacistId" UUID REFERENCES users("userId"),
  "deliveryBoyId" UUID REFERENCES users("userId"),
  "rejectionReason" TEXT,
  "deliveredAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

