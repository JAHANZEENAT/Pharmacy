# PharmaFlow - Pharmacy Management System

## Getting Started

### 1. Prerequisites
- Node.js 18+ installed.
- A Supabase project (for Database and Storage).

### 2. Environment Setup
The `.env` file is already created. Ensure the following keys are set with your valid Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Installation
Install the dependencies:

```bash
npm install
```

### 4. Running the App
Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test Accounts
See `TEST_ACCOUNTS.md` for login credentials for Admin, Customer, Pharmacist, and Delivery Boy.

## Architecture
- **Frontend:** Next.js 14 (App Router)
- **Backend:** Next.js API Routes (Supabase Integration)
- **Database:** Supabase (PostgreSQL)
