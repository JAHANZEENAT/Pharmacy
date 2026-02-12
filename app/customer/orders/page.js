'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Package, Clock, CheckCircle, XCircle, Truck, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function CustomerOrders() {
  const { user, getToken, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'customer') {
      router.push('/customer/login')
      return
    }
    fetchOrders()
  }, [user, authLoading, router])

  const fetchOrders = async () => {
    try {
      const token = getToken()
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'packed': return <Package className="h-4 w-4" />
      case 'out_for_delivery': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return 'default'
      case 'approved': return 'secondary'
      case 'packed': return 'secondary'
      case 'out_for_delivery': return 'default'
      case 'delivered': return 'default'
      case 'rejected': return 'destructive'
      case 'cancelled': return 'destructive'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/customer/shop">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-900">PharmaFlow</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Orders</h2>
          <p className="text-gray-600">Track and manage your medicine orders</p>
        </div>

        {dataLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-6">Start shopping for medicines</p>
              <Link href="/customer/shop">
                <Button>Browse Medicines</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.orderId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Order #{order.orderId.slice(-8)}</CardTitle>
                      <CardDescription>
                        Placed on {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.name} x {item.quantity}
                            </span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-600">₹{order.totalAmount}</p>
                      </div>
                      <Link href={`/customer/orders/${order.orderId}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}