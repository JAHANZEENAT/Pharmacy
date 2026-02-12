'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function PharmacistDashboard() {
  console.log('[DASHBOARD] PharmacistDashboard component mounting')
  const { user, getToken, loading: authLoading } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    const checkAuth = () => {
      if (!user) {
        console.log('[DASHBOARD] No user found, redirecting to operator login...')
        router.push('/operator/login')
        return
      }
      if (user.role !== 'pharmacist') {
        console.log(`[DASHBOARD] Invalid role (${user.role}), redirecting...`)
        router.push('/operator/login')
        return
      }
      console.log('[DASHBOARD] Auth verified for pharmacist')
      fetchDashboardData()
    }

    if (!user) {
      const timer = setTimeout(checkAuth, 100)
      return () => clearTimeout(timer)
    } else {
      checkAuth()
    }
  }, [user, authLoading, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = getToken()

      // Parallelize fetches
      const [statsRes, profileRes, ordersRes, lowStockRes] = await Promise.all([
        fetch('/api/pharmacy/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/pharmacy/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/pharmacy/products?filter=low_stock', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      // Parse all responses
      const [statsData, profileData, ordersData, lowStockData] = await Promise.all([
        statsRes.ok ? statsRes.json() : Promise.resolve(null),
        profileRes.ok ? profileRes.json() : Promise.resolve({ profile: null }),
        ordersRes.ok ? ordersRes.json() : Promise.resolve({ orders: [] }),
        lowStockRes.ok ? lowStockRes.json() : Promise.resolve({ products: [] })
      ])

      if (statsData) setStats(statsData)
      if (profileData?.profile) setProfile(profileData.profile)
      setRecentOrders((ordersData?.orders || []).slice(0, 5))
      setLowStockProducts(lowStockData?.products || [])

    } catch (error) {
      console.error('Dashboard Fetch Error:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
        <p className="text-slate-500 font-medium">Preparing your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
        {profile?.verificationStatus === 'approved' && (
          <Button asChild className="bg-purple-600 hover:bg-purple-700 font-bold shadow-lg shadow-purple-100">
            <Link href="/pharmacist/products/add">
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Link>
          </Button>
        )}
      </div>

      {/* Verification Notice */}
      {profile?.verificationStatus === 'pending' && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm overflow-hidden ring-1 ring-amber-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-1">Account Under Verification</h3>
              <p className="text-amber-800 leading-relaxed max-w-2xl opacity-90">
                Your pharmacy documents are being reviewed by our team. You can explore the dashboard,
                but you'll be able to publish products and receive orders once approved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Published', value: stats?.publishedProducts || 0, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Low Stock', value: stats?.lowStockProducts || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pending', value: stats?.pendingOrders || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Revenue', value: `₹${stats?.monthlyRevenue || 0}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, idx) => (
          <Card key={idx} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={cn("p-2 rounded-xl mb-3", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
              Recent Orders
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-purple-600 font-bold hover:text-purple-700 hover:bg-purple-50">
              <Link href="/pharmacist/orders">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-slate-400">No recent orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b bg-slate-50/30">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Order ID</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">#{order.orderId.slice(-8)}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{order.totalAmount}</td>
                        <td className="px-6 py-4">
                          <Badge className="capitalize text-[10px] py-0 px-2 font-bold" variant="secondary">
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50/50 py-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockProducts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-slate-400">All products well stocked</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{product.medicine_name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Stock left: {product.stock}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-[11px] font-bold text-purple-600 hover:text-purple-700">
                      <Link href={`/pharmacist/products?id=${product.id}`}>Update</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-slate-50/30 p-3">
            <Button variant="ghost" size="sm" asChild className="w-full text-slate-500 font-bold hover:text-slate-900">
              <Link href="/pharmacist/products?filter=low_stock">View All Low Stock</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}