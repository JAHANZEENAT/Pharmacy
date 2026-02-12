'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Shield, Truck, MapPin, LogOut, User, Package, CheckCircle, Navigation } from 'lucide-react'
import { format } from 'date-fns'

export default function DeliveryDashboard() {
  const { user, logout, getToken, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [otp, setOtp] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'delivery_boy') {
      router.push('/operator/login')
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
      toast.error('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelivery = async () => {
    if (!otp || otp.length !== 4) {
      toast.error('Please enter 4-digit OTP')
      return
    }

    try {
      const token = getToken()
      const response = await fetch('/api/orders/confirm-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: selectedOrder.orderId, otp })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Delivery confirmed!')
        fetchOrders()
        setConfirmDialog(false)
        setOtp('')
        setSelectedOrder(null)
      }
    } catch (error) {
      toast.error('Failed to confirm delivery')
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const activeDeliveries = orders.filter(o => o.status === 'out_for_delivery')
  const completedDeliveries = orders.filter(o => o.status === 'delivered')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-900">PharmaFlow - Delivery</h1>
          </div>
          <div className="flex items-center space-x-4">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Deliveries</h2>
          <p className="text-gray-600">Manage and complete your assigned deliveries</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{activeDeliveries.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{completedDeliveries.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">₹{completedDeliveries.length * 50}</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Deliveries */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Active Deliveries</h3>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-600">Loading deliveries...</p>
            </div>
          ) : activeDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Deliveries</h3>
                <p className="text-gray-600">You have no active deliveries at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map((order) => (
                <Card key={order.orderId}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold text-lg">Order #{order.orderId.slice(-8)}</h3>
                          <Badge variant="default">
                            <Truck className="h-3 w-3 mr-1" />
                            Out for Delivery
                          </Badge>
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Delivery Address:</p>
                              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-gray-600" />
                            <p className="text-sm">{order.items.length} item(s) - ₹{order.totalAmount}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Navigate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setConfirmDialog(true)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Delivery
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Deliveries */}
        <div>
          <h3 className="text-xl font-bold mb-4">Completed Deliveries</h3>
          {completedDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">No completed deliveries</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedDeliveries.map((order) => (
                <Card key={order.orderId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Order #{order.orderId.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          Delivered on {format(new Date(order.deliveredAt || order.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Delivered
                        </Badge>
                        <p className="text-sm font-medium text-green-600 mt-1">+₹50</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirm Delivery Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>
              Enter the 4-digit OTP from the customer to confirm delivery
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">Customer OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 4-digit OTP"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-2">For demo purposes, any 4-digit OTP will work</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setConfirmDialog(false)
              setOtp('')
            }}>Cancel</Button>
            <Button onClick={handleConfirmDelivery}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}