import { NextResponse } from 'next/server'
import { hashPassword, verifyPassword, generateToken, verifyToken, ROLES, ORDER_STATUS, VERIFICATION_STATUS } from '@/lib/auth-utils'
import { isSupabaseConfigured, supabase as publicSupabase, getServiceSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Middleware to verify JWT token
const verifyAuth = async (request) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  return payload
}

// Payment Service (Mocked for MVP - ready for Razorpay integration)
class PaymentService {
  static async initiatePayment({ orderId, amount, method, customerInfo }) {
    // Mock payment processing
    // This will be replaced with actual Razorpay integration
    console.log(`Initiating payment for order ${orderId}: ${amount} via ${method}`)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (method === 'cod') {
      return {
        success: true,
        paymentId: `PAY_COD_${uuidv4()}`,
        status: 'pending_cod',
        message: 'Cash on Delivery confirmed'
      }
    }

    // Mock successful payment for UPI/Card
    return {
      success: true,
      paymentId: `PAY_MOCK_${uuidv4()}`,
      status: 'completed',
      message: `Payment successful via ${method}`,
      transactionId: `TXN_${Date.now()}`
    }
  }

  static async verifyPayment(paymentId) {
    // Mock payment verification
    return { verified: true, status: 'completed' }
  }
}

// Map Service (Mocked - ready for Google Maps integration)
class MapService {
  static async getCoordinates(address) {
    // Mock geocoding - returns random coordinates near India
    return {
      lat: 28.6139 + (Math.random() - 0.5) * 0.1,
      lng: 77.2090 + (Math.random() - 0.5) * 0.1
    }
  }

  static async getRoute(origin, destination) {
    // Mock route calculation
    return {
      distance: Math.floor(Math.random() * 10 + 1) + ' km',
      duration: Math.floor(Math.random() * 30 + 10) + ' mins',
      polyline: 'mock_encoded_polyline'
    }
  }
}

// Storage Service
class StorageService {
  static async uploadFile(file, bucket, path) {
    if (isSupabaseConfigured()) {
      // Upload to Supabase Storage
      const { data, error } = await publicSupabase.storage
        .from(bucket)
        .upload(path, file)

      if (error) throw error

      // Get public URL
      const { data: urlData } = publicSupabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return { url: urlData.publicUrl, path: data.path }
    } else {
      // Mock file storage
      return {
        url: `/mock-storage/${bucket}/${path}`,
        path: path
      }
    }
  }
}

// API Routes Handler
export async function GET(request) {
  const { pathname } = new URL(request.url)
  const segments = pathname.split('/').filter(Boolean)

  // Remove 'api' from segments if present
  if (segments[0] === 'api') segments.shift()

  const route = segments.join('/')
  const supabase = getServiceSupabase()

  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {

    // Health check
    if (!route || route === '') {
      return NextResponse.json({
        message: 'Pharmacy Management System API',
        status: 'running',
        timestamp: new Date().toISOString()
      })
    }

    // Auth routes
    if (route === 'auth/session') {
      const user = await verifyAuth(request)
      if (!user) {
        return NextResponse.json({ authenticated: false }, { status: 401 })
      }
      return NextResponse.json({ authenticated: true, user })
    }

    // Medicines routes
    if (route === 'medicines') {
      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search')
      const category = searchParams.get('category')

      let query = supabase.from('medicines').select('*')

      if (search) {
        // Simple search on multiple columns
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,manufacturer.ilike.%${search}%`)
      }

      if (category) {
        query = query.eq('category', category)
      }

      const { data: medicines, error } = await query.limit(50)

      if (error) throw error

      return NextResponse.json({ medicines })
    }

    if (route.startsWith('medicines/')) {
      const medicineId = segments[segments.indexOf('medicines') + 1]

      const { data: medicine, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('medicineId', medicineId)
        .single()

      if (error || !medicine) {
        return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
      }

      return NextResponse.json({ medicine })
    }

    // Orders routes (requires auth)
    if (route === 'orders') {
      const user = await verifyAuth(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      let query = supabase.from('orders').select('*').order('createdAt', { ascending: false })

      if (user.role === ROLES.CUSTOMER) {
        query = query.eq('customerId', user.userId)
      } else if (user.role === ROLES.PHARMACIST) {
        query = query.eq('pharmacistId', user.userId)
      } else if (user.role === ROLES.DELIVERY_BOY) {
        query = query.eq('deliveryBoyId', user.userId)
      }

      const { data: result, error } = await query

      if (error) throw error

      return NextResponse.json({ orders: result })
    }

    if (route.startsWith('orders/')) {
      const orderId = segments[segments.indexOf('orders') + 1]
      const user = await verifyAuth(request)

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('orderId', orderId)
        .single()

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Check access rights
      if (user.role === ROLES.CUSTOMER && order.customerId !== user.userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      return NextResponse.json({ order })
    }

    // Admin routes
    if (route === 'admin/users') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const role = searchParams.get('role')

      let query = supabase.from('users').select('*')
      if (role) query = query.eq('role', role)

      const { data: userList, error } = await query

      if (error) throw error

      // Get last order timestamp for each user (without order details)
      // Note: This N+1 query pattern is suboptimal but maintained for parity.
      // Ideally should use a join or aggregate query.
      const enrichedUsers = await Promise.all(userList.map(async (u) => {
        if (u.role === ROLES.CUSTOMER) {
          const { data: lastOrder } = await supabase
            .from('orders')
            .select('createdAt')
            .eq('customerId', u.userId)
            .order('createdAt', { ascending: false })
            .limit(1)
            .single()

          return {
            userId: u.userId,
            email: u.email,
            name: u.name,
            role: u.role,
            verificationStatus: u.verificationStatus,
            active: u.active,
            createdAt: u.createdAt,
            lastOrderAt: lastOrder?.createdAt || null
          }
        }
        return {
          userId: u.userId,
          email: u.email,
          name: u.name,
          role: u.role,
          verificationStatus: u.verificationStatus,
          documentUrl: u.documentUrl,
          active: u.active,
          createdAt: u.createdAt
        }
      }))

      return NextResponse.json({ users: enrichedUsers })
    }

    if (route === 'admin/orders') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      // Return only order status info
      const { data: orderList, error } = await supabase
        .from('orders')
        .select('orderId, status, createdAt, customerId, pharmacistId, deliveryBoyId, totalAmount')
        .order('createdAt', { ascending: false })

      if (error) throw error

      return NextResponse.json({ orders: orderList })
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const { pathname } = new URL(request.url)
  const segments = pathname.split('/').filter(Boolean)

  if (segments[0] === 'api') segments.shift()
  const route = segments.join('/')

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  try {
    const body = await request.json()

    // Customer Registration (Email/Password + Google OAuth)
    if (route === 'auth/customer/register') {
      const { email, password, name, phone, address } = body

      const { data: existing } = await supabase.from('users').select('*').eq('email', email).single()

      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }

      const hashedPassword = await hashPassword(password)
      const userId = uuidv4()

      const user = {
        userId,
        email,
        password: hashedPassword,
        name,
        phone,
        address,
        role: ROLES.CUSTOMER,
        active: true,
        createdAt: new Date().toISOString()
      }

      const { error: insertError } = await supabase.from('users').insert(user)
      if (insertError) throw insertError

      const token = generateToken({ userId, email, role: ROLES.CUSTOMER })

      return NextResponse.json({
        success: true,
        token,
        user: { userId, email, name, role: ROLES.CUSTOMER }
      })
    }

    // Customer Login
    if (route === 'auth/customer/login') {
      const { email, password } = body

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', ROLES.CUSTOMER)
        .single()

      if (!user || error) {
        console.log('Login error:', error)
        console.log('User found:', user)
        return NextResponse.json({ error: 'Invalid credentials (user not found or error)' }, { status: 401 })
      }

      const validPassword = await verifyPassword(password, user.password)
      console.log('Password valid:', validPassword)
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid credentials (password mismatch)' }, { status: 401 })
      }

      const token = generateToken({ userId: user.userId, email: user.email, role: user.role })

      return NextResponse.json({
        success: true,
        token,
        user: { userId: user.userId, email: user.email, name: user.name, role: user.role }
      })
    }

    // Customer Google OAuth (Mock)
    if (route === 'auth/customer/google') {
      const { idToken, name, email } = body

      // In production, verify idToken with Google
      // For now, mock the OAuth flow

      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', ROLES.CUSTOMER)
        .single()

      if (!user) {
        // Create new user
        const userId = uuidv4()
        user = {
          userId,
          email,
          name,
          role: ROLES.CUSTOMER,
          authProvider: 'google',
          active: true,
          createdAt: new Date().toISOString()
        }
        await supabase.from('users').insert(user)
      }

      const token = generateToken({ userId: user.userId, email: user.email, role: user.role })

      return NextResponse.json({
        success: true,
        token,
        user: { userId: user.userId, email: user.email, name: user.name, role: user.role }
      })
    }

    // Operator Registration (Pharmacist & Delivery Boy)
    if (route === 'auth/operator/register') {
      const { email, password, name, phone, role, documentFile } = body

      if (role !== ROLES.PHARMACIST && role !== ROLES.DELIVERY_BOY) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      const { data: existing } = await supabase.from('users').select('*').eq('email', email).single()

      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }

      const hashedPassword = await hashPassword(password)
      const userId = uuidv4()

      // Store document (mocked)
      let documentUrl = null
      if (documentFile) {
        // In production, this would upload to Supabase Storage
        documentUrl = `/mock-documents/${userId}_${role}_document.pdf`
      }

      const user = {
        userId,
        email,
        password: hashedPassword,
        name,
        phone,
        role,
        documentUrl,
        verificationStatus: VERIFICATION_STATUS.PENDING,
        active: false, // Inactive until admin approval
        createdAt: new Date().toISOString()
      }

      const { error: insertError } = await supabase.from('users').insert(user)
      if (insertError) throw insertError

      return NextResponse.json({
        success: true,
        message: 'Registration successful. Awaiting admin approval.',
        userId
      })
    }

    // Operator Login (Pharmacist & Delivery Boy)
    if (route === 'auth/operator/login') {
      const { email, password } = body

      // Using .in() filter correctly for array check
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .in('role', [ROLES.PHARMACIST, ROLES.DELIVERY_BOY])
        .single()

      if (!user || error) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // Check if approved
      if (user.verificationStatus !== VERIFICATION_STATUS.APPROVED || !user.active) {
        return NextResponse.json({
          error: 'Account pending approval. Please wait for admin verification.',
          status: 'pending'
        }, { status: 403 })
      }

      const validPassword = await verifyPassword(password, user.password)
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const token = generateToken({ userId: user.userId, email: user.email, role: user.role })

      return NextResponse.json({
        success: true,
        token,
        user: { userId: user.userId, email: user.email, name: user.name, role: user.role }
      })
    }

    // Admin Login
    if (route === 'auth/admin/login') {
      const { email, password } = body

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', ROLES.ADMIN)
        .single()

      if (!user || error) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const validPassword = await verifyPassword(password, user.password)
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const token = generateToken({ userId: user.userId, email: user.email, role: user.role })

      return NextResponse.json({
        success: true,
        token,
        user: { userId: user.userId, email: user.email, name: user.name, role: user.role }
      })
    }

    // Place Order
    if (route === 'orders/place') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.CUSTOMER) {
        return NextResponse.json({ error: 'Customer access required' }, { status: 403 })
      }

      const { items, deliveryAddress, paymentMethod, prescriptionUrls, totalAmount } = body

      // Process payment
      const orderId = `ORD_${Date.now()}_${uuidv4().substring(0, 8)}`
      const paymentResult = await PaymentService.initiatePayment({
        orderId,
        amount: totalAmount,
        method: paymentMethod,
        customerInfo: user
      })

      if (!paymentResult.success) {
        return NextResponse.json({ error: 'Payment failed' }, { status: 400 })
      }

      // Get delivery coordinates
      const deliveryCoords = await MapService.getCoordinates(deliveryAddress)

      const order = {
        orderId,
        customerId: user.userId,
        items,
        deliveryAddress,
        deliveryCoordinates: deliveryCoords,
        paymentMethod,
        paymentId: paymentResult.paymentId,
        paymentStatus: paymentResult.status,
        prescriptionUrls: prescriptionUrls || [],
        totalAmount,
        status: ORDER_STATUS.PLACED,
        statusHistory: [{
          status: ORDER_STATUS.PLACED,
          timestamp: new Date().toISOString(),
          note: 'Order placed successfully'
        }],
        createdAt: new Date().toISOString()
      }

      const { error: insertError } = await supabase.from('orders').insert(order)
      if (insertError) throw insertError

      return NextResponse.json({
        success: true,
        orderId,
        order
      })
    }

    // Admin approve user
    if (route === 'admin/users/approve') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { userId, approved } = body

      const { error } = await supabase.from('users').update({
        verificationStatus: approved ? VERIFICATION_STATUS.APPROVED : VERIFICATION_STATUS.REJECTED,
        active: approved,
        approvedAt: new Date().toISOString(),
        approvedBy: user.userId
      }).eq('userId', userId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Pharmacist approve/reject order
    if (route === 'orders/approve') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Pharmacist access required' }, { status: 403 })
      }

      const { orderId, approved, rejectionReason } = body

      const newStatus = approved ? ORDER_STATUS.APPROVED : ORDER_STATUS.REJECTED

      // Need to fetch current statusHistory to append
      const { data: currentOrder } = await supabase.from('orders').select('statusHistory').eq('orderId', orderId).single()
      const currentHistory = currentOrder?.statusHistory || []

      const { error } = await supabase.from('orders').update({
        status: newStatus,
        pharmacistId: user.userId,
        rejectionReason: rejectionReason || null,
        statusHistory: [...currentHistory, {
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: approved ? 'Order approved by pharmacist' : `Order rejected: ${rejectionReason}`,
          userId: user.userId
        }]
      }).eq('orderId', orderId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Pharmacist update order to packed
    if (route === 'orders/pack') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Pharmacist access required' }, { status: 403 })
      }

      const { orderId } = body

      const { data: currentOrder } = await supabase.from('orders').select('statusHistory').eq('orderId', orderId).single()
      const currentHistory = currentOrder?.statusHistory || []

      const { error } = await supabase.from('orders').update({
        status: ORDER_STATUS.PACKED,
        statusHistory: [...currentHistory, {
          status: ORDER_STATUS.PACKED,
          timestamp: new Date().toISOString(),
          note: 'Order packed and ready for delivery',
          userId: user.userId
        }]
      }).eq('orderId', orderId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Assign delivery
    if (route === 'orders/assign-delivery') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Pharmacist access required' }, { status: 403 })
      }

      const { orderId, deliveryBoyId } = body

      const { data: currentOrder } = await supabase.from('orders').select('statusHistory').eq('orderId', orderId).single()
      const currentHistory = currentOrder?.statusHistory || []

      const { error } = await supabase.from('orders').update({
        deliveryBoyId,
        status: ORDER_STATUS.OUT_FOR_DELIVERY,
        statusHistory: [...currentHistory, {
          status: ORDER_STATUS.OUT_FOR_DELIVERY,
          timestamp: new Date().toISOString(),
          note: 'Out for delivery',
          userId: user.userId
        }]
      }).eq('orderId', orderId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Delivery boy confirm delivery with OTP
    if (route === 'orders/confirm-delivery') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.DELIVERY_BOY) {
        return NextResponse.json({ error: 'Delivery boy access required' }, { status: 403 })
      }

      const { orderId, otp } = body

      // In production, verify OTP sent to customer
      // For MVP, accept any 4-digit OTP
      if (!otp || otp.length !== 4) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
      }

      const { data: currentOrder } = await supabase.from('orders').select('statusHistory').eq('orderId', orderId).single()
      const currentHistory = currentOrder?.statusHistory || []

      const { error } = await supabase.from('orders').update({
        status: ORDER_STATUS.DELIVERED,
        deliveredAt: new Date().toISOString(),
        statusHistory: [...currentHistory, {
          status: ORDER_STATUS.DELIVERED,
          timestamp: new Date().toISOString(),
          note: 'Order delivered successfully',
          userId: user.userId,
          otp
        }]
      }).eq('orderId', orderId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Add medicine (Admin/Pharmacist)
    if (route === 'medicines/add') {
      const user = await verifyAuth(request)
      if (!user || ![ROLES.ADMIN, ROLES.PHARMACIST].includes(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const { name, description, price, stock, manufacturer, category, prescriptionRequired, expiryDate } = body

      const medicineId = uuidv4()

      const medicine = {
        medicineId,
        name,
        description,
        price,
        stock,
        manufacturer,
        category,
        prescriptionRequired: prescriptionRequired || false,
        expiryDate,
        createdBy: user.userId,
        createdAt: new Date().toISOString()
      }

      const { error } = await supabase.from('medicines').insert(medicine)
      if (error) throw error

      return NextResponse.json({ success: true, medicineId, medicine })
    }

    // Seed initial data
    if (route === 'seed') {
      const password = await hashPassword('password123')
      const adminPassword = await hashPassword('admin123')

      // 1. Create Admin
      const { data: adminExists } = await supabase.from('users').select('*').eq('role', ROLES.ADMIN).single()
      if (!adminExists) {
        await supabase.from('users').insert({
          userId: uuidv4(),
          email: 'admin@pharmacy.com',
          password: adminPassword,
          name: 'System Admin',
          role: ROLES.ADMIN,
          active: true,
          verificationStatus: VERIFICATION_STATUS.APPROVED,
          createdAt: new Date().toISOString()
        })
      } else {
        await supabase.from('users').update({ verificationStatus: VERIFICATION_STATUS.APPROVED }).eq('role', ROLES.ADMIN)
      }

      // 2. Create Customer
      const { data: customerExists } = await supabase.from('users').select('*').eq('email', 'customer@test.com').single()
      if (!customerExists) {
        await supabase.from('users').insert({
          userId: uuidv4(),
          email: 'customer@test.com',
          password: password,
          name: 'Test Customer',
          role: ROLES.CUSTOMER,
          active: true,
          verificationStatus: VERIFICATION_STATUS.APPROVED,
          createdAt: new Date().toISOString()
        })
      } else {
        // Ensure password is correct for existing user
        await supabase.from('users').update({ password: password, verificationStatus: VERIFICATION_STATUS.APPROVED }).eq('email', 'customer@test.com')
      }

      // 3. Create Pharmacist (Pending)
      const { data: pharmacistExists } = await supabase.from('users').select('*').eq('email', 'pharmacist@test.com').single()
      if (!pharmacistExists) {
        await supabase.from('users').insert({
          userId: uuidv4(),
          email: 'pharmacist@test.com',
          password: password,
          name: 'Test Pharmacist',
          role: ROLES.PHARMACIST,
          active: true,
          verificationStatus: VERIFICATION_STATUS.PENDING,
          createdAt: new Date().toISOString()
        })
      } else {
        await supabase.from('users').update({ password: password }).eq('email', 'pharmacist@test.com')
      }

      // 4. Create Delivery Boy (Pending)
      const { data: deliveryExists } = await supabase.from('users').select('*').eq('email', 'delivery@test.com').single()
      if (!deliveryExists) {
        await supabase.from('users').insert({
          userId: uuidv4(),
          email: 'delivery@test.com',
          password: password,
          name: 'Test Delivery Boy',
          role: ROLES.DELIVERY_BOY,
          active: true,
          verificationStatus: VERIFICATION_STATUS.PENDING,
          createdAt: new Date().toISOString()
        })
      } else {
        await supabase.from('users').update({ password: password }).eq('email', 'delivery@test.com')
      }

      // 5. Add sample medicines
      const { count } = await supabase.from('medicines').select('*', { count: 'exact', head: true })

      if (count === 0) {
        const sampleMedicines = [
          {
            medicineId: uuidv4(),
            name: 'Paracetamol 500mg',
            description: 'Pain relief and fever reducer',
            price: 50,
            stock: 100,
            manufacturer: 'PharmaCorp India',
            category: 'Pain Relief',
            prescriptionRequired: false,
            createdAt: new Date().toISOString()
          },
          {
            medicineId: uuidv4(),
            name: 'Amoxicillin 250mg',
            description: 'Antibiotic for bacterial infections',
            price: 120,
            stock: 50,
            manufacturer: 'MediLife',
            category: 'Antibiotics',
            prescriptionRequired: true,
            createdAt: new Date().toISOString()
          },
          {
            medicineId: uuidv4(),
            name: 'Cetirizine 10mg',
            description: 'Antihistamine for allergies',
            price: 80,
            stock: 200,
            manufacturer: 'HealthPlus',
            category: 'Allergy',
            prescriptionRequired: false,
            createdAt: new Date().toISOString()
          },
          {
            medicineId: uuidv4(),
            name: 'Omeprazole 20mg',
            description: 'Acid reflux and gastritis',
            price: 95,
            stock: 150,
            manufacturer: 'GastroCare',
            category: 'Digestive',
            prescriptionRequired: false,
            createdAt: new Date().toISOString()
          },
          {
            medicineId: uuidv4(),
            name: 'Metformin 500mg',
            description: 'Type 2 diabetes management',
            price: 150,
            stock: 80,
            manufacturer: 'DiaBet',
            category: 'Diabetes',
            prescriptionRequired: true,
            createdAt: new Date().toISOString()
          }
        ]

        await supabase.from('medicines').insert(sampleMedicines)
      }

      return NextResponse.json({ success: true, message: 'Database seeded with all test accounts and medicines' })
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}