'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const token = sessionStorage.getItem('token')
    const userData = sessionStorage.getItem('user')

    if (token && userData) {
      setUser(JSON.parse(userData))
    }

    setLoading(false)
  }, [])

  const login = (token, userData) => {
    console.log('[AUTH] Logging in user:', userData.email)
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    console.log('[AUTH] Logging out')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
    router.push('/')
  }

  const getToken = () => {
    return sessionStorage.getItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}