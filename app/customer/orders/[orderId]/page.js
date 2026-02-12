'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Package, Clock, CheckCircle, XCircle, Truck, ArrowLeft, MapPin, User, Phone, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default function OrderDetail() {
  const params = useParams()
  const orderId = params?.orderId
  const { user, getToken, loading: authLoading } = useAuth()
  const [order, setOrder] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'customer') {
      router.push('/customer/login')
      return
    }
    if (orderId) {
      fetchOrder()
    }
  }, [user, authLoading, orderId, router])

  const fetchOrder = async () => {
    try {
      const token = getToken()
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.order) {
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed': return <Clock className="h-5 w-5" />
      case 'approved': return <CheckCircle className="h-5 w-5" />
      case 'packed': return <Package className="h-5 w-5" />
      case 'out_for_delivery': return <Truck className="h-5 w-5" />
      case 'delivered': return <CheckCircle className="h-5 w-5" />
      case 'rejected': return <XCircle className="h-5 w-5" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  const getStatusText = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (authLoading || !user || (!order && dataLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
            <Link href="/customer/orders">
              <Button>View All Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/customer/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Order Details</h2>
          <p className="text-gray-600">Order #{order.orderId.slice(-12)}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.statusHistory?.map((status, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`mt-1 rounded-full p-2 ${index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                        {getStatusIcon(status.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{getStatusText(status.status)}</p>
                        <p className="text-sm text-gray-600">{status.note}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(status.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">₹{order.totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prescription */}
            {order.prescriptionUrls && order.prescriptionUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="border-green-300 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Prescription uploaded and verified by pharmacist
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {order.status === 'rejected' && order.rejectionReason && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Order Rejected:</strong> {order.rejectionReason}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Live Tracking */}
            {order.status === 'out_for_delivery' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Live Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <p className="text-sm text-gray-600">Map integration (Google Maps API required)</p>
                  </div>
                  <Alert className="border-blue-300 bg-blue-50">
                    <AlertDescription className="text-blue-800">
                      Your order is out for delivery! Expected delivery within 30 minutes.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}