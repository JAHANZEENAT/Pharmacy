-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table public.users (
  "userId" uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password text,
  name text,
  role text,
  "verificationStatus" text default 'pending',
  active boolean default false,
  phone text,
  address text,
  "authProvider" text default 'email',
  "documentUrl" text,
  "approvedAt" timestamp with time zone,
  "approvedBy" text,
  "createdAt" timestamp with time zone default now()
);

-- Medicines Table
create table public.medicines (
  "medicineId" uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric not null,
  stock integer default 0,
  manufacturer text,
  category text,
  "prescriptionRequired" boolean default false,
  "expiryDate" date,
  "imageUrl" text,
  "createdBy" text,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- Orders Table
create table public.orders (
  "orderId" text primary key,
  "customerId" uuid references public.users("userId"),
  items jsonb, -- Array of medicine objects
  "deliveryAddress" text,
  "deliveryCoordinates" jsonb,
  "paymentMethod" text,
  "paymentId" text,
  "paymentStatus" text,
  "prescriptionUrls" text[], -- Array of strings
  "totalAmount" numeric,
  status text,
  "statusHistory" jsonb, -- Array of status objects
  "pharmacistId" uuid references public.users("userId"),
  "deliveryBoyId" uuid references public.users("userId"),
  "rejectionReason" text,
  "deliveredAt" timestamp with time zone,
  "createdAt" timestamp with time zone default now()
);
