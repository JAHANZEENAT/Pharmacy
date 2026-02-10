# PharmaFlow - Test Accounts

## Admin Account
- **Email:** admin@pharmacy.com
- **Password:** admin123
- **Role:** Admin
- **Access:** Full system administration
- **URL:** http://localhost:3000/admin/login

## Customer Account
- **Email:** customer@test.com
- **Password:** password123
- **Role:** Customer
- **Status:** Active (No approval needed)
- **URL:** http://localhost:3000/customer/login

## Pharmacist Account
- **Email:** pharmacist@test.com
- **Password:** password123
- **Role:** Pharmacist
- **Status:** Pending Approval (Need admin to approve first)
- **URL:** http://localhost:3000/operator/login
- **Note:** Login will be blocked until admin approves. After approval, can access pharmacist dashboard.

## Delivery Boy Account
- **Email:** delivery@test.com
- **Password:** password123
- **Role:** Delivery Boy
- **Status:** Pending Approval (Need admin to approve first)
- **URL:** http://localhost:3000/operator/login
- **Note:** Login will be blocked until admin approves. After approval, can access delivery dashboard.

---

## Complete Testing Flow

### 1. Admin Approval Flow
1. Login as Admin (admin@pharmacy.com / admin123)
2. Go to "Pending Approvals" tab
3. Approve "Test Pharmacist" and "Test Delivery Boy"
4. Verify they can now login

### 2. Customer Shopping Flow
1. Login as Customer (customer@test.com / password123)
2. Browse medicines in shop
3. Add medicines to cart (try both Rx-required and non-Rx)
4. Go to checkout
5. Enter delivery address
6. Upload prescription if needed (any image/PDF works for demo)
7. Select payment method (UPI/Card/COD)
8. Place order
9. View order in "My Orders"
10. Track order status

### 3. Pharmacist Order Management Flow
1. Login as Pharmacist (pharmacist@test.com / password123) - AFTER admin approval
2. View pending customer orders
3. Review order details and prescription
4. Approve or reject orders (with reason if rejecting)
5. Mark approved orders as "Packed"
6. Assign delivery boy to packed orders

### 4. Delivery Boy Flow
1. Login as Delivery Boy (delivery@test.com / password123) - AFTER admin approval
2. View assigned deliveries
3. View delivery address and order details
4. Use navigation (mocked - Google Maps integration ready)
5. Confirm delivery with OTP (any 4-digit OTP works for demo)
6. View completed deliveries and earnings

### 5. Admin Monitoring Flow
1. Login as Admin
2. View system statistics
3. Monitor users (Customers, Pharmacists, Delivery Boys)
4. View order status (PRIVACY: No order details shown)
5. See last order timestamp for customers
6. Approve/reject pending operators

---

## Sample Medicines Available
1. **Paracetamol 500mg** - ₹50 (No Prescription Required)
2. **Amoxicillin 250mg** - ₹120 (Prescription Required)
3. **Cetirizine 10mg** - ₹80 (No Prescription Required)
4. **Omeprazole 20mg** - ₹95 (No Prescription Required)
5. **Metformin 500mg** - ₹150 (Prescription Required)

---

## Key Features Demonstrated

### Authentication
- ✅ Separate customer registration with Google OAuth option
- ✅ Operator registration with role selection and document upload
- ✅ Admin login (no public signup)
- ✅ Role-based access control
- ✅ Login blocked for unapproved operators

### Customer Features
- ✅ Medicine browsing with search
- ✅ Add to cart with quantity management
- ✅ Prescription upload for Rx-required medicines
- ✅ Multiple payment methods (mocked)
- ✅ Order placement
- ✅ Order history
- ✅ Order tracking with status timeline

### Pharmacist Features
- ✅ View all orders
- ✅ Approve/reject orders with reasons
- ✅ Mark orders as packed
- ✅ Assign delivery boys
- ✅ Dashboard with statistics

### Delivery Boy Features
- ✅ View assigned deliveries
- ✅ Navigation support (mocked)
- ✅ OTP-based delivery confirmation
- ✅ Delivery history
- ✅ Earnings tracker

### Admin Features
- ✅ Approve/reject pharmacists and delivery boys
- ✅ View all users with status
- ✅ Monitor order flow (status only - PRIVACY)
- ✅ System statistics
- ✅ Document verification workflow

### Compliance & Privacy
- ✅ Prescription-mandatory medicines flagged
- ✅ Document upload for operator verification
- ✅ Admin privacy restrictions (cannot see order details)
- ✅ Order status timeline/audit log
- ✅ Age verification for delivery boys (18+)
- ✅ Pharmacy license verification

---

## Mocked Integrations (Ready for Production)

### Payment Gateway (Razorpay)
- **Status:** Mocked with service layer
- **Methods:** UPI, Card, COD
- **Ready for:** Razorpay SDK integration
- **Location:** `/app/app/api/[[...path]]/route.js` (PaymentService class)

### Maps (Google Maps)
- **Status:** Mocked with coordinates
- **Features:** Geocoding, routing, live tracking
- **Ready for:** Google Maps JavaScript API
- **Location:** `/app/app/api/[[...path]]/route.js` (MapService class)

### Storage (Supabase)
- **Status:** Mocked with local fallback
- **Features:** Prescription upload, document storage
- **Ready for:** Supabase Storage API
- **Config:** `/app/.env` (Supabase credentials)

### Google OAuth
- **Status:** Implemented with mock
- **Features:** Customer Google login
- **Ready for:** Actual Google OAuth credentials
- **Config:** `/app/.env` (Google OAuth credentials)

---

## Environment Variables Required for Production

```env
# Supabase (Configure for file storage and auth)
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Google OAuth (Configure for customer Google login)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Google Maps (Configure for delivery navigation)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# JWT & Session (CHANGE in production!)
JWT_SECRET=your_production_jwt_secret
SESSION_SECRET=your_production_session_secret
```

---

## Notes

1. **All test accounts work immediately** except Pharmacist and Delivery Boy which need admin approval first
2. **Database is persistent** - all data remains between sessions
3. **Payment is mocked** - all payment methods will succeed for demo
4. **OTP is mocked** - any 4-digit number will work for delivery confirmation
5. **File uploads are mocked** - files are not actually stored but metadata is saved
6. **Maps are mocked** - shows placeholder, ready for Google Maps API key
7. **Privacy is enforced** - Admin cannot see order details, only status

---

## Quick Test Checklist

- [ ] Admin can login and see dashboard
- [ ] Admin can approve pharmacist
- [ ] Admin can approve delivery boy
- [ ] Customer can register and login
- [ ] Customer can browse and add medicines to cart
- [ ] Customer can checkout with prescription upload
- [ ] Customer can place order
- [ ] Customer can view order history
- [ ] Pharmacist can login after approval
- [ ] Pharmacist can approve/reject orders
- [ ] Pharmacist can mark orders as packed
- [ ] Pharmacist can assign delivery boy
- [ ] Delivery boy can login after approval
- [ ] Delivery boy can view assigned deliveries
- [ ] Delivery boy can confirm delivery with OTP
- [ ] Admin can see user statistics
- [ ] Admin CANNOT see order details (privacy check)
