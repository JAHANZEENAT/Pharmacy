import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10)
}

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export const ROLES = {
  CUSTOMER: 'customer',
  PHARMACIST: 'pharmacist',
  DELIVERY_BOY: 'delivery_boy',
  ADMIN: 'admin'
}

export const ORDER_STATUS = {
  PLACED: 'placed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PACKED: 'packed',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
}

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}