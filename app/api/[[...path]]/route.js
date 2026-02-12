import { NextResponse } from 'next/server'
import { hashPassword, verifyPassword, generateToken, verifyToken, ROLES, ORDER_STATUS, VERIFICATION_STATUS } from '@/lib/auth-utils'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { query as dbQuery, getClient } from '@/lib/db'
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
    try {
      // Cloudinary doesn't need 'bucket' in the same way, we use folders
      // We convert 'file' (which might be a File/Blob from Next.js req) to Buffer
      let fileToUpload = file;

      if (file && typeof file.arrayBuffer === 'function') {
        const arrayBuffer = await file.arrayBuffer();
        fileToUpload = Buffer.from(arrayBuffer);
      }

      // bucket can be used as a subfolder
      const { url, publicId } = await uploadToCloudinary(fileToUpload, bucket);

      return { url, path: publicId };
    } catch (error) {
      console.error('Storage Error:', error);
      // Fallback for development if needed
      return {
        url: `/mock-storage/${bucket}/${path}`,
        path: path
      };
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

    // Check Operator Status
    if (route === 'auth/check-status') {
      const { searchParams } = new URL(request.url)
      const email = searchParams.get('email')

      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

      const { rows } = await dbQuery(
        'SELECT "verificationStatus", active FROM users WHERE email = $1',
        [email]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        status: rows[0].verificationStatus,
        active: rows[0].active
      })
    }

    // Medicines routes
    if (route === 'medicines') {
      console.log('[API] GET /medicines - Start')
      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search')
      const category = searchParams.get('category')

      let queryText = 'SELECT * FROM medicines'
      const params = []
      const filters = []

      if (search) {
        params.push(`%${search}%`)
        filters.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length} OR manufacturer ILIKE $${params.length})`)
      }

      if (category && category !== 'all') {
        params.push(category)
        filters.push(`category = $${params.length}`)
      }

      if (filters.length > 0) {
        queryText += ' WHERE ' + filters.join(' AND ')
      }

      queryText += ' ORDER BY name ASC LIMIT 50'

      console.log('[API] GET /medicines - Executing query:', queryText)
      try {
        const { rows: medicines } = await dbQuery(queryText, params)
        console.log(`[API] GET /medicines - Success, found ${medicines.length} items`)
        return NextResponse.json({ medicines })
      } catch (dbErr) {
        console.error('[API] GET /medicines - DB Error:', dbErr)
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
      }
    }

    if (route.startsWith('medicines/')) {
      const medicineId = segments[segments.indexOf('medicines') + 1]

      const { rows } = await dbQuery(
        'SELECT * FROM medicines WHERE "medicineId" = $1',
        [medicineId]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
      }

      return NextResponse.json({ medicine: rows[0] })
    }

    // Orders routes (requires auth)
    if (route === 'orders') {
      const user = await verifyAuth(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      let queryText = 'SELECT * FROM public.orders'
      const params = []
      const filters = []

      if (user.role === ROLES.CUSTOMER) {
        params.push(user.userId)
        filters.push(`"customerId" = $${params.length}`)
      } else if (user.role === ROLES.PHARMACIST) {
        params.push(user.userId)
        filters.push(`"pharmacistId" = $${params.length}`)
      } else if (user.role === ROLES.DELIVERY_BOY) {
        params.push(user.userId)
        filters.push(`"deliveryBoyId" = $${params.length}`)
      }

      if (filters.length > 0) {
        queryText += ' WHERE ' + filters.join(' AND ')
      }

      queryText += ' ORDER BY "createdAt" DESC'

      const { rows: result } = await dbQuery(queryText, params)

      return NextResponse.json({ orders: result })
    }

    if (route.startsWith('orders/')) {
      const orderId = segments[segments.indexOf('orders') + 1]
      const user = await verifyAuth(request)

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { rows } = await dbQuery(
        'SELECT * FROM orders WHERE "orderId" = $1',
        [orderId]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const order = rows[0]

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

      // 1. Fetch users and their pharmacy details in a single query
      let queryText = `
        SELECT u.*, 
               p.id as pharmacy_id, p.pharmacy_name, p.owner_name, p.address as p_address, 
               p.license_number, p.gst_number, p.license_document_url, p.government_id_url, 
               p.commission, p.orders_count
        FROM users u
        LEFT JOIN pharmacies p ON u."userId" = p.user_id
      `
      const params = []
      if (role) {
        queryText += ` WHERE u.role = $1`
        params.push(role)
      }
      queryText += ` ORDER BY u."createdAt" DESC`

      const { rows: userList } = await dbQuery(queryText, params)

      // 2. Map and enrich results
      const enrichedUsers = await Promise.all(userList.map(async (u) => {
        if (u.role === ROLES.CUSTOMER) {
          // Optimization: Skip N+1 queries for dashboard if list is long
          if (role !== ROLES.CUSTOMER && userList.length > 50) {
            return {
              userId: u.userId,
              email: u.email,
              name: u.name,
              role: u.role,
              verificationStatus: u.verificationStatus,
              active: u.active,
              createdAt: u.createdAt,
              lastOrderAt: null
            }
          }

          const { rows: lastOrderRows } = await dbQuery(
            'SELECT "createdAt" FROM orders WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
            [u.userId]
          )

          return {
            userId: u.userId,
            email: u.email,
            name: u.name,
            role: u.role,
            verificationStatus: u.verificationStatus,
            active: u.active,
            createdAt: u.createdAt,
            lastOrderAt: lastOrderRows[0]?.createdAt || null
          }
        }

        // Return flattened object for pharmacist / delivery boy
        return {
          userId: u.userId,
          email: u.email,
          name: u.name,
          role: u.role,
          verificationStatus: u.verificationStatus,
          active: u.active,
          createdAt: u.createdAt,
          phone: u.phone,
          address: u.p_address || u.address,
          // Map snake_case to camelCase for frontend
          pharmacyName: u.pharmacy_name,
          ownerName: u.owner_name,
          licenseNumber: u.license_number,
          gstNumber: u.gst_number,
          licenseUrl: u.license_document_url,
          idProofUrl: u.government_id_url || u.documentUrl,
          commission: u.commission,
          ordersCount: u.orders_count
        }
      }))

      return NextResponse.json({ users: enrichedUsers })
    }

    if (route.startsWith('admin/users/')) {
      const adminUser = await verifyAuth(request)
      if (!adminUser || adminUser.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const targetUserId = segments[segments.indexOf('users') + 1]

      const { rows } = await dbQuery(
        `SELECT u.*, 
                p.id as pharmacy_id, p.pharmacy_name, p.owner_name, p.address as p_address, p.city as p_city, p.state as p_state, p.pincode as p_pincode,
                p.license_number, p.gst_number, p.license_document_url, p.government_id_url, 
                p.commission, p.orders_count
         FROM users u
         LEFT JOIN pharmacies p ON u."userId" = p.user_id
         WHERE u."userId" = $1`,
        [targetUserId]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const targetUser = rows[0]
      // Flatten pharmacy details
      const enrichedUser = {
        ...targetUser,
        pharmacyName: targetUser.pharmacy_name,
        ownerName: targetUser.owner_name,
        licenseNumber: targetUser.license_number,
        gstNumber: targetUser.gst_number,
        licenseUrl: targetUser.license_document_url,
        idProofUrl: targetUser.government_id_url || targetUser.documentUrl,
        commission: targetUser.commission || 10,
        ordersCount: targetUser.orders_count || 0,
        address: targetUser.p_address || targetUser.address,
        city: targetUser.p_city,
        state: targetUser.p_state,
        pincode: targetUser.p_pincode
      }

      return NextResponse.json({ user: enrichedUser })
    }

    if (route === 'admin/medicines') {
      const adminUser = await verifyAuth(request)
      if (!adminUser || adminUser.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const pharmacistId = searchParams.get('pharmacistId')

      let medicinesList = []

      if (pharmacistId) {
        // 1. Get Pharmacy ID
        const { rows: pRows } = await dbQuery('SELECT id FROM pharmacies WHERE user_id = $1', [pharmacistId])

        if (pRows.length > 0) {
          const pharmacyId = pRows[0].id

          // 2. Fetch products for this pharmacy
          const { rows } = await dbQuery(`
            SELECT 
              m.*, 
              pp.price, 
              pp.stock, 
              pp.status, 
              pp.id as "productId",
              pp."createdAt" as "addedAt"
            FROM pharmacy_products pp
            JOIN medicines m ON pp."medicineId" = m."medicineId"
            WHERE pp.pharmacy_id = $1
            ORDER BY pp."createdAt" DESC
          `, [pharmacyId])

          medicinesList = rows
        } else {
          // Fallback if no pharmacy profile found yet (shouldn't happen for approved pharmacists)
          return NextResponse.json({ medicines: [] })
        }
      } else {
        // Global catalog
        const { rows } = await dbQuery('SELECT * FROM medicines ORDER BY name ASC')
        medicinesList = rows
      }

      return NextResponse.json({ medicines: medicinesList })
    }

    if (route === 'admin/orders') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { rows: orderList } = await dbQuery(
        'SELECT "orderId", status, "createdAt", "customerId", "pharmacistId", "deliveryBoyId", "totalAmount" FROM orders ORDER BY "createdAt" DESC',
        []
      )
      return NextResponse.json({ orders: orderList })
    }

    if (route === 'pharmacy/profile') {
      const authUser = await verifyAuth(request)
      if (!authUser || authUser.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { rows } = await dbQuery(
        `SELECT u.*, p.* 
         FROM users u 
         LEFT JOIN pharmacies p ON u."userId" = p.user_id 
         WHERE u."userId" = $1`,
        [authUser.userId]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      return NextResponse.json({ profile: rows[0] })
    }

    if (route === 'pharmacy/stats') {
      const authUser = await verifyAuth(request)
      if (!authUser || authUser.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { rows: pRows } = await dbQuery('SELECT id FROM pharmacies WHERE user_id = $1', [authUser.userId])
      if (!pRows[0]) return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
      const pharmacyId = pRows[0].id

      const [totalRes, publishedRes, lowRes, ordersRes, revenueRes] = await Promise.all([
        dbQuery('SELECT COUNT(*) as count FROM pharmacy_products WHERE pharmacy_id = $1', [pharmacyId]),
        dbQuery("SELECT COUNT(*) as count FROM pharmacy_products WHERE pharmacy_id = $1 AND status = 'published'", [pharmacyId]),
        dbQuery('SELECT COUNT(*) as count FROM pharmacy_products WHERE pharmacy_id = $1 AND stock < 10', [pharmacyId]),
        dbQuery('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $2) as pending FROM orders WHERE "pharmacistId" = $1', [authUser.userId, ORDER_STATUS.PLACED]),
        dbQuery('SELECT SUM("totalAmount") as total FROM orders WHERE "pharmacistId" = $1 AND status = $2', [authUser.userId, ORDER_STATUS.DELIVERED])
      ])

      return NextResponse.json({
        totalProducts: parseInt(totalRes.rows[0].count),
        publishedProducts: parseInt(publishedRes.rows[0].count),
        lowStockProducts: parseInt(lowRes.rows[0].count),
        totalOrders: parseInt(ordersRes.rows[0].total),
        pendingOrders: parseInt(ordersRes.rows[0].pending),
        monthlyRevenue: parseFloat(revenueRes.rows[0].total || 0)
      })
    }

    if (route === 'pharmacy/products') {
      const authUser = await verifyAuth(request)
      if (!authUser || authUser.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const filter = searchParams.get('filter')
      const search = searchParams.get('search')

      const { rows: pRows } = await dbQuery('SELECT id FROM pharmacies WHERE user_id = $1', [authUser.userId])
      if (!pRows[0]) return NextResponse.json({ error: 'Pharmacy profile not found' }, { status: 404 })
      const pharmacyId = pRows[0].id

      let sql = `
        SELECT pp.*, m.name as medicine_name, m.category, m.manufacturer, m."imageUrl", m."prescriptionRequired"
        FROM pharmacy_products pp
        JOIN medicines m ON pp."medicineId" = m."medicineId"
        WHERE pp.pharmacy_id = $1
      `
      const params = [pharmacyId]

      if (filter === 'low_stock') {
        sql += ' AND pp.stock < 10'
      }

      if (search) {
        params.push(`%${search}%`)
        sql += ` AND m.name ILIKE $${params.length}`
      }

      sql += ' ORDER BY pp."updatedAt" DESC'

      const { rows: products } = await dbQuery(sql, params)
      return NextResponse.json({ products })
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

  try {
    // Check for file uploads vs JSON body
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      if (route === 'upload') {
        const formData = await request.formData()
        const file = formData.get('file')
        const bucket = formData.get('bucket') || 'documents'
        const path = formData.get('path') || 'general'

        if (!file) {
          return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const storageData = await StorageService.uploadFile(file, bucket, path)
        return NextResponse.json({ success: true, ...storageData })
      }
      return NextResponse.json({ error: 'Multipart not supported for this route' }, { status: 400 })
    }

    const body = await request.json()

    // Customer Registration (Email/Password + Google OAuth)
    if (route === 'auth/customer/register') {
      const { email, password, name, phone, address } = body

      const { rows: existingRows } = await dbQuery('SELECT * FROM users WHERE email = $1', [email])

      if (existingRows.length > 0) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }

      const hashedPassword = await hashPassword(password)
      const userId = uuidv4()

      const userSql = `
        INSERT INTO users ("userId", email, password, name, phone, address, role, active, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `
      await dbQuery(userSql, [
        userId, email, hashedPassword, name, phone, address, ROLES.CUSTOMER, true, new Date().toISOString()
      ])

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

      const { rows } = await dbQuery(
        'SELECT * FROM users WHERE email = $1 AND role = $2',
        [email, ROLES.CUSTOMER]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Invalid credentials (user not found or error)' }, { status: 401 })
      }

      const user = rows[0]
      const validPassword = await verifyPassword(password, user.password)
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
      const { rows } = await dbQuery(
        'SELECT * FROM users WHERE email = $1 AND role = $2',
        [email, ROLES.CUSTOMER]
      )

      let user = rows[0]

      if (!user) {
        // Create new user
        const userId = uuidv4()
        const createdAt = new Date().toISOString()

        await dbQuery(
          `INSERT INTO users ("userId", email, name, role, "authProvider", active, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, email, name, ROLES.CUSTOMER, 'google', true, createdAt]
        )

        user = { userId, email, name, role: ROLES.CUSTOMER }
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
      const {
        email,
        password,
        name,
        phone,
        role,
        ownerName,
        city,
        state,
        pincode,
        address,
        licenseNumber,
        gstNumber,
        licenseUrl,
        idProofUrl,
        documentUrl
      } = body

      if (role !== ROLES.PHARMACIST && role !== ROLES.DELIVERY_BOY) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      const { client, query: trQuery, release } = await getClient()

      try {
        await trQuery('BEGIN')

        // 1. Check existing
        const { rows: existingRows } = await trQuery('SELECT * FROM users WHERE email = $1', [email])
        if (existingRows.length > 0) {
          await trQuery('ROLLBACK')
          return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }

        const hashedPassword = await hashPassword(password)
        const userId = uuidv4()

        // 2. Create User
        const userSql = `
          INSERT INTO users (
            "userId", email, password, name, phone, role, "documentUrl", "verificationStatus", active, "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `
        await trQuery(userSql, [
          userId,
          email,
          hashedPassword,
          name,
          phone,
          role,
          idProofUrl || documentUrl,
          VERIFICATION_STATUS.PENDING,
          false,
          new Date().toISOString()
        ])

        // 3. Create Pharmacy Record if Pharmacist
        if (role === ROLES.PHARMACIST) {
          const pharmacySql = `
            INSERT INTO pharmacies (
              user_id, pharmacy_name, owner_name, address, city, state, pincode, 
              license_number, gst_number, license_document_url, government_id_url, commission
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `
          await trQuery(pharmacySql, [
            userId,
            name,
            ownerName,
            address || `${city}, ${state} - ${pincode}`,
            city,
            state,
            pincode,
            licenseNumber,
            gstNumber,
            licenseUrl,
            idProofUrl || documentUrl,
            10
          ])
        }

        await trQuery('COMMIT')
        return NextResponse.json({
          success: true,
          message: 'Registration successful. Account under verification.'
        })
      } catch (error) {
        await trQuery('ROLLBACK')
        console.error('Registration transaction failed:', error)
        throw error
      } finally {
        release()
      }
    }

    // Operator Login (Pharmacist & Delivery Boy)
    if (route === 'auth/operator/login') {
      const { email, password } = body
      console.log(`[AUTH] Operator login attempt: ${email}`)

      const { rows } = await dbQuery(
        'SELECT * FROM users WHERE email = $1 AND role IN ($2, $3)',
        [email, ROLES.PHARMACIST, ROLES.DELIVERY_BOY]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const user = rows[0]

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

      const { rows } = await dbQuery(
        'SELECT * FROM users WHERE email = $1 AND role = $2',
        [email, ROLES.ADMIN]
      )

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const user = rows[0]
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

      const createdAt = new Date().toISOString()
      const statusHistory = [
        {
          status: ORDER_STATUS.PLACED,
          timestamp: createdAt,
          note: 'Order placed successfully'
        }
      ]

      const sql = `
        INSERT INTO orders (
          "orderId", "customerId", items, "deliveryAddress", "deliveryCoordinates", 
          "paymentMethod", "paymentId", "paymentStatus", "prescriptionUrls", 
          "totalAmount", status, "statusHistory", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `
      await dbQuery(sql, [
        orderId,
        user.userId,
        JSON.stringify(items),
        deliveryAddress,
        JSON.stringify(deliveryCoords),
        paymentMethod,
        paymentResult.paymentId,
        paymentResult.status,
        prescriptionUrls || [],
        totalAmount,
        ORDER_STATUS.PLACED,
        JSON.stringify(statusHistory),
        createdAt
      ])

      return NextResponse.json({
        success: true,
        orderId,
        order: {
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
          statusHistory,
          createdAt
        }
      })
    }

    // Admin approve user
    if (route === 'admin/users/approve') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { userId, approved } = body

      await dbQuery(
        `UPDATE users 
         SET "verificationStatus" = $1, active = $2, "approvedAt" = $3, "approvedBy" = $4
         WHERE "userId" = $5`,
        [
          approved ? VERIFICATION_STATUS.APPROVED : VERIFICATION_STATUS.REJECTED,
          approved,
          new Date().toISOString(),
          user.userId,
          userId
        ]
      )

      return NextResponse.json({ success: true })
    }

    // Admin update user (commission/status)
    if (route === 'admin/users/update') {
      const adminUser = await verifyAuth(request)
      if (!adminUser || adminUser.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { userId, updates } = body

      const pharmacyFields = [
        'address', 'city', 'state', 'pincode', 'commission',
        'pharmacyName', 'ownerName', 'licenseNumber', 'gstNumber',
        'licenseUrl', 'idProofUrl'
      ]

      const camelToSnake = {
        pharmacyName: 'pharmacy_name',
        ownerName: 'owner_name',
        licenseNumber: 'license_number',
        gstNumber: 'gst_number',
        licenseUrl: 'license_document_url',
        idProofUrl: 'government_id_url'
      }

      const userUpdates = []
      const userParams = []
      const pharmacyUpdates = []
      const pharmacyParams = []

      Object.entries(updates).forEach(([key, value]) => {
        if (pharmacyFields.includes(key)) {
          const col = camelToSnake[key] || key
          pharmacyParams.push(value)
          pharmacyUpdates.push(`"${col}" = $${pharmacyParams.length}`)
        } else {
          userParams.push(value)
          userUpdates.push(`"${key}" = $${userParams.length}`)
        }
      })

      if (userUpdates.length > 0) {
        userParams.push(userId)
        await dbQuery(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE "userId" = $${userParams.length}`,
          userParams
        )
      }

      if (pharmacyUpdates.length > 0) {
        pharmacyParams.push(userId)
        await dbQuery(
          `UPDATE pharmacies SET ${pharmacyUpdates.join(', ')} WHERE user_id = $${pharmacyParams.length}`,
          pharmacyParams
        )
      }

      return NextResponse.json({ success: true })
    }

    // Admin update medicine
    if (route === 'admin/medicines/update') {
      const adminUser = await verifyAuth(request)
      if (!adminUser || adminUser.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { medicineId, updates } = body
      const sets = []
      const params = []

      Object.entries(updates).forEach(([key, value]) => {
        params.push(value)
        sets.push(`"${key}" = $${params.length}`)
      })

      if (params.length > 0) {
        params.push(medicineId)
        await dbQuery(
          `UPDATE public.medicines SET ${sets.join(', ')} WHERE "medicineId" = $${params.length}`,
          params
        )
      }

      return NextResponse.json({ success: true })
    }

    // Admin delete medicine
    if (route === 'admin/medicines/delete') {
      const adminUser = await verifyAuth(request)
      if (!adminUser || adminUser.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { medicineId } = body
      await dbQuery('DELETE FROM medicines WHERE "medicineId" = $1', [medicineId])

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

      // Append to status history
      const { rows } = await dbQuery('SELECT "statusHistory" FROM orders WHERE "orderId" = $1', [orderId])
      const currentHistory = rows[0]?.statusHistory || []

      await dbQuery(
        `UPDATE orders 
         SET status = $1, "pharmacistId" = $2, "rejectionReason" = $3, "statusHistory" = $4
         WHERE "orderId" = $5`,
        [
          newStatus,
          user.userId,
          rejectionReason || null,
          JSON.stringify([...currentHistory, {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: approved ? 'Order approved by pharmacist' : `Order rejected: ${rejectionReason}`,
            userId: user.userId
          }]),
          orderId
        ]
      )

      return NextResponse.json({ success: true })
    }

    // Pharmacist update order to packed
    if (route === 'orders/pack') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Pharmacist access required' }, { status: 403 })
      }

      const { orderId } = body

      const { rows } = await dbQuery('SELECT "statusHistory" FROM orders WHERE "orderId" = $1', [orderId])
      const currentHistory = rows[0]?.statusHistory || []

      await dbQuery(
        `UPDATE orders SET status = $1, "statusHistory" = $2 WHERE "orderId" = $3`,
        [
          ORDER_STATUS.PACKED,
          JSON.stringify([...currentHistory, {
            status: ORDER_STATUS.PACKED,
            timestamp: new Date().toISOString(),
            note: 'Order packed and ready for delivery',
            userId: user.userId
          }]),
          orderId
        ]
      )

      return NextResponse.json({ success: true })
    }

    // Assign delivery
    if (route === 'orders/assign-delivery') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Pharmacist access required' }, { status: 403 })
      }

      const { orderId, deliveryBoyId } = body

      const { rows } = await dbQuery('SELECT "statusHistory" FROM orders WHERE "orderId" = $1', [orderId])
      const currentHistory = rows[0]?.statusHistory || []

      await dbQuery(
        `UPDATE orders SET "deliveryBoyId" = $1, status = $2, "statusHistory" = $3 WHERE "orderId" = $4`,
        [
          deliveryBoyId,
          ORDER_STATUS.OUT_FOR_DELIVERY,
          JSON.stringify([...currentHistory, {
            status: ORDER_STATUS.OUT_FOR_DELIVERY,
            timestamp: new Date().toISOString(),
            note: 'Out for delivery',
            userId: user.userId
          }]),
          orderId
        ]
      )

      return NextResponse.json({ success: true })
    }

    // Delivery boy confirm delivery with OTP
    if (route === 'orders/confirm-delivery') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.DELIVERY_BOY) {
        return NextResponse.json({ error: 'Delivery boy access required' }, { status: 403 })
      }

      const { orderId, otp } = body

      if (!otp || otp.length !== 4) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
      }

      const { rows } = await dbQuery('SELECT "statusHistory" FROM orders WHERE "orderId" = $1', [orderId])
      const currentHistory = rows[0]?.statusHistory || []

      await dbQuery(
        `UPDATE orders SET status = $1, "deliveredAt" = $2, "statusHistory" = $3 WHERE "orderId" = $4`,
        [
          ORDER_STATUS.DELIVERED,
          new Date().toISOString(),
          JSON.stringify([...currentHistory, {
            status: ORDER_STATUS.DELIVERED,
            timestamp: new Date().toISOString(),
            note: 'Order delivered successfully',
            userId: user.userId,
            otp
          }]),
          orderId
        ]
      )

      return NextResponse.json({ success: true })
    }

    // Master Medicine Management (Admin Only)
    if (route === 'medicines/add') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Unauthorized (Admin required)' }, { status: 403 })
      }

      const { name, description, manufacturer, category, prescriptionRequired, imageUrl } = body
      if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

      const medicineId = uuidv4()
      const now = new Date().toISOString()

      await dbQuery(
        `INSERT INTO medicines (
          "medicineId", name, description, manufacturer, category, "prescriptionRequired", "imageUrl", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [medicineId, name, description, manufacturer, category, prescriptionRequired || false, imageUrl, now, now]
      )

      return NextResponse.json({ success: true, medicineId })
    }

    if (route === 'medicines/update') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Unauthorized (Admin required)' }, { status: 403 })
      }

      const { medicineId, name, description, manufacturer, category, prescriptionRequired, imageUrl } = body
      if (!medicineId) return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })

      const now = new Date().toISOString()
      await dbQuery(
        `UPDATE medicines SET 
          name = $1, description = $2, manufacturer = $3, category = $4, 
          "prescriptionRequired" = $5, "imageUrl" = $6, "updatedAt" = $7
         WHERE "medicineId" = $8`,
        [name, description, manufacturer, category, prescriptionRequired, imageUrl, now, medicineId]
      )

      return NextResponse.json({ success: true })
    }

    if (route === 'medicines/delete') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: 'Unauthorized (Admin required)' }, { status: 403 })
      }

      const { medicineId } = body
      if (!medicineId) return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })

      await dbQuery('DELETE FROM medicines WHERE "medicineId" = $1', [medicineId])
      return NextResponse.json({ success: true })
    }

    if (route === 'pharmacy/profile/update') {
      const authUser = await verifyAuth(request)
      if (!authUser || authUser.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { phone, address } = body

      const { client, query: trQuery, release } = await getClient()
      try {
        await trQuery('BEGIN')

        // Update user phone
        if (phone) {
          await trQuery('UPDATE users SET phone = $1 WHERE "userId" = $2', [phone, authUser.userId])
        }

        // Update pharmacy address
        if (address) {
          await trQuery('UPDATE pharmacies SET address = $1 WHERE user_id = $2', [address, authUser.userId])
        }

        await trQuery('COMMIT')
        return NextResponse.json({ success: true })
      } catch (error) {
        await trQuery('ROLLBACK')
        throw error
      } finally {
        release()
      }
    }

    // Pharmacy Product Links (Pharmacist Only)
    if (route === 'pharmacy/products/add') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Unauthorized (Pharmacist required)' }, { status: 403 })
      }

      const { medicineId, price, stock, status, featured } = body
      if (!medicineId) return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 })

      const { rows: pRows } = await dbQuery('SELECT id FROM pharmacies WHERE user_id = $1', [user.userId])
      if (!pRows[0]) return NextResponse.json({ error: 'Pharmacy profile not found' }, { status: 404 })

      const now = new Date().toISOString()
      await dbQuery(
        `INSERT INTO pharmacy_products (
          id, pharmacy_id, "medicineId", price, stock, status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv4(), pRows[0].id, medicineId, price || 0, stock || 0, status || 'draft', now, now]
      )

      return NextResponse.json({ success: true })
    }

    if (route === 'pharmacy/products/update') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const { productId, price, stock, status, featured } = body
      if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

      const now = new Date().toISOString()
      await dbQuery(
        `UPDATE pharmacy_products SET 
          price = $1, stock = $2, status = $3, featured = $4, "updatedAt" = $5
         WHERE id = $6`,
        [price, stock, status, featured, now, productId]
      )

      return NextResponse.json({ success: true })
    }

    if (route === 'pharmacy/products/delete') {
      const user = await verifyAuth(request)
      if (!user || user.role !== ROLES.PHARMACIST) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const { productId } = body
      if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

      await dbQuery('DELETE FROM pharmacy_products WHERE id = $1', [productId])
      return NextResponse.json({ success: true })
    }

    // Seed initial data
    if (route === 'seed') {
      const password = await hashPassword('password123')
      const adminPassword = await hashPassword('admin123')

      // 1. Create Admin
      const { rows: adminRows } = await dbQuery('SELECT * FROM users WHERE role = $1 LIMIT 1', [ROLES.ADMIN])
      if (adminRows.length === 0) {
        await dbQuery(
          `INSERT INTO users ("userId", email, password, name, role, active, "verificationStatus", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [uuidv4(), 'admin@pharmacy.com', adminPassword, 'System Admin', ROLES.ADMIN, true, VERIFICATION_STATUS.APPROVED, new Date().toISOString()]
        )
      }

      // 2. Create Customer
      const { rows: custRows } = await dbQuery('SELECT * FROM users WHERE email = $1', ['customer@test.com'])
      if (custRows.length === 0) {
        await dbQuery(
          `INSERT INTO users ("userId", email, password, name, role, active, "verificationStatus", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [uuidv4(), 'customer@test.com', password, 'Test Customer', ROLES.CUSTOMER, true, VERIFICATION_STATUS.APPROVED, new Date().toISOString()]
        )
      }

      // 3. Create Pharmacist
      const { rows: pharmRows } = await dbQuery('SELECT * FROM users WHERE email = $1', ['pharmacist@test.com'])
      if (pharmRows.length === 0) {
        const pharmId = uuidv4()
        await dbQuery(
          `INSERT INTO users ("userId", email, password, name, role, active, "verificationStatus", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [pharmId, 'pharmacist@test.com', password, 'Test Pharmacist', ROLES.PHARMACIST, true, VERIFICATION_STATUS.APPROVED, new Date().toISOString()]
        )
        await dbQuery(
          `INSERT INTO pharmacies (user_id, pharmacy_name, owner_name, city, state, pincode, license_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [pharmId, 'Test Pharmacy', 'Test Owner', 'Kolkata', 'West Bengal', '700001', 'DL-12345']
        )
      }

      // 3. Add sample medicines
      const { rows: medRows } = await dbQuery('SELECT COUNT(*) as count FROM medicines', [])
      if (parseInt(medRows[0].count) === 0) {
        const sampleMedicines = [
          [uuidv4(), 'Paracetamol 500mg', 'Pain relief', 'PharmaCorp', 'Pain Relief', false],
          [uuidv4(), 'Amoxicillin 250mg', 'Antibiotic', 'MediLife', 'Antibiotics', true],
          [uuidv4(), 'Cetirizine 10mg', 'Allergy', 'HealthPlus', 'Allergy', false]
        ]

        for (const m of sampleMedicines) {
          await dbQuery(
            `INSERT INTO medicines ("medicineId", name, description, manufacturer, category, "prescriptionRequired", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [...m, new Date().toISOString()]
          )
        }
      }

      return NextResponse.json({ success: true, message: 'Database seeded successfully' })
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
