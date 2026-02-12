'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import DashboardStats from '@/components/admin/DashboardStats'
import DashboardCharts from '@/components/admin/DashboardCharts'
import { Bell, Search, Settings, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'

export default function AdminDashboard() {
  console.log('[DASHBOARD] AdminDashboard component mounting')
  const { user, getToken, loading: authLoading } = useAuth()
  const [dataLoading, setDataLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    orderData: [],
    revenueData: [],
    topSellingData: []
  })
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    // Simple guard with a small delay check to avoid race conditions with router redirection
    const checkAuth = () => {
      if (!user) {
        router.push('/admin/login')
        return
      }
      console.log('[DASHBOARD] Auth verified for admin')
      fetchData()
    }

    // Give it 100ms to stabilize if user is not immediately available
    if (!user) {
      const timer = setTimeout(checkAuth, 100)
      return () => clearTimeout(timer)
    } else {
      checkAuth()
    }
  }, [user, authLoading, router])

  const fetchData = async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      setDataLoading(true)
      const token = getToken()

      // Fetch users and orders in parallel
      const [usersRes, ordersRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        }),
        fetch('/api/admin/orders', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        })
      ])

      const { users = [] } = await usersRes.json()
      const { orders = [] } = await ordersRes.json()

      // 1. Calculate Stats
      const pharmacists = users.filter(u => u.role === 'pharmacist')
      const stats = {
        totalPharmacies: pharmacists.length,
        openPharmacies: pharmacists.filter(u => u.verificationStatus === 'approved').length,
        pendingPharmacies: pharmacists.filter(u => u.verificationStatus === 'pending').length,
        rejectedPharmacies: pharmacists.filter(u => u.verificationStatus === 'rejected').length,
        totalCustomers: users.filter(u => u.role === 'customer').length,
        totalOrders: orders.length,
        activeOrders: orders.filter(o => !['delivered', 'rejected'].includes(o.status)).length,
        totalRevenue: orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
        commissionEarned: orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0) * 0.1, 0)
      }

      // 2. Prepare Chart Data (Last 7 days)
      const last7Days = eachDayOfInterval({
        start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        end: new Date()
      })

      const orderData = last7Days.map(date => {
        const dayOrders = orders.filter(o => isSameDay(parseISO(o.createdAt), date))
        return {
          name: format(date, 'EEE'),
          orders: dayOrders.length
        }
      })

      // 3. Prepare Monthly Revenue (Last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const currentMonth = new Date().getMonth()
      const last6Months = Array.from({ length: 6 }, (_, i) => (currentMonth - 5 + i + 12) % 12)

      const revenueData = last6Months.map(mIdx => {
        const monthRevenue = orders
          .filter(o => new Date(o.createdAt).getMonth() === mIdx)
          .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
        return {
          name: months[mIdx],
          revenue: monthRevenue
        }
      })

      // 4. Mock Top Selling (since we don't have item-level stats in admin route)
      const topSellingData = [
        { name: 'Paracetamol', sales: Math.floor(orders.length * 0.4), color: '#3b82f6' },
        { name: 'Amoxicillin', sales: Math.floor(orders.length * 0.25), color: '#8b5cf6' },
        { name: 'Vitamin C', sales: Math.floor(orders.length * 0.15), color: '#f59e0b' },
        { name: 'Ibuprofen', sales: Math.floor(orders.length * 0.1), color: '#10b981' },
        { name: 'Cetirizine', sales: Math.floor(orders.length * 0.05), color: '#f43f5e' },
      ]

      setDashboardData({ stats, orderData, revenueData, topSellingData })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      if (error.name === 'AbortError') {
        toast.error('Dashboard request timed out')
      } else {
        toast.error('Failed to load dashboard data')
      }
    } finally {
      clearTimeout(timeoutId)
      setDataLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {user.name}! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search reports..."
              className="pl-9 w-64 bg-white border-slate-200 focus-visible:ring-blue-500"
            />
          </div>
          <Button variant="outline" size="sm" className="h-10 border-slate-200 text-slate-600 font-medium" onClick={fetchData}>
            <Calendar className="h-4 w-4 mr-2" />
            {format(new Date(), 'MMM dd, yyyy')}
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-500 relative">
            <Bell className="h-5 w-5" />
            {dashboardData.stats?.activeOrders > 0 && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-600 border-2 border-white"></span>
            )}
          </Button>
        </div>
      </div>

      {dataLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-4 md:gap-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px] bg-slate-100 rounded-xl"></div>
            <div className="h-[400px] bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <DashboardStats data={dashboardData.stats} />

          {/* Analytics Charts */}
          <DashboardCharts
            orderData={dashboardData.orderData}
            revenueData={dashboardData.revenueData}
            topSellingData={dashboardData.topSellingData}
          />
        </>
      )}
    </div>
  )
}
