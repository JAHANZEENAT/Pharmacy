'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Shield, Package, CheckCircle, XCircle, LogOut, User, FileText, Clock, Truck } from 'lucide-react'
import { format } from 'date-fns'

export default function PharmacistDashboard() {
  const { user, logout, getToken } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actionDialog, setActionDialog] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [deliveryBoys, setDeliveryBoys] = useState([])
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== 'pharmacist') {
      router.push('/operator/login')
      return
    }
    fetchOrders()
    fetchDeliveryBoys()
  }, [user, router])

  const fetchOrders = async () => {
    try {
      const token = getToken()
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryBoys = async () => {
    try {
      const token = getToken()
      const response = await fetch('/api/admin/users?role=delivery_boy', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setDeliveryBoys((data.users || []).filter(u => u.active && u.verificationStatus === 'approved'))
    } catch (error) {
      console.error('Failed to load delivery boys')
    }
  }

  const handleApprove = async (orderId) => {
    try {
      const token = getToken()
      const response = await fetch('/api/orders/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, approved: true })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Order approved')
        fetchOrders()
        setActionDialog(null)
      }
    } catch (error) {
      toast.error('Failed to approve order')
    }
  }

  const handleReject = async (orderId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide rejection reason')
      return
    }

    try {
      const token = getToken()
      const response = await fetch('/api/orders/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, approved: false, rejectionReason })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Order rejected')
        fetchOrders()
        setActionDialog(null)
        setRejectionReason('')
      }
    } catch (error) {
      toast.error('Failed to reject order')
    }
  }

  const handleMarkPacked = async (orderId) => {
    try {
      const token = getToken()
      const response = await fetch('/api/orders/pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Order marked as packed')
        fetchOrders()
      }
    } catch (error) {
      toast.error('Failed to update order')
    }
  }

  const handleAssignDelivery = async (orderId) => {
    if (!selectedDeliveryBoy) {
      toast.error('Please select a delivery boy')
      return
    }

    try {
      const token = getToken()
      const response = await fetch('/api/orders/assign-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, deliveryBoyId: selectedDeliveryBoy })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Delivery assigned')
        fetchOrders()
        setActionDialog(null)
        setSelectedDeliveryBoy('')
      }
    } catch (error) {
      toast.error('Failed to assign delivery')
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
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-purple-900">PharmaFlow - Pharmacist</h1>
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
          <h2 className="text-3xl font-bold mb-2">Order Management</h2>
          <p className="text-gray-600">Review, approve, and manage customer orders</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{orders.filter(o => o.status === 'placed').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{orders.filter(o => o.status === 'approved').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Packed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{orders.filter(o => o.status === 'packed').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Out for Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{orders.filter(o => o.status === 'out_for_delivery').length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Orders</h3>
              <p className="text-gray-600">No orders to display</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.orderId}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-lg">Order #{order.orderId.slice(-8)}</h3>
                        <Badge variant={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                        {order.prescriptionUrls && order.prescriptionUrls.length > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Prescription
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-sm">
                            {item.name} x {item.quantity} - ₹{item.price * item.quantity}
                          </p>
                        ))}
                      </div>
                      <p className="text-lg font-bold mt-2">Total: ₹{order.totalAmount}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {order.status === 'placed' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setActionDialog('approve')
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedOrder(order)
                              setActionDialog('reject')
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {order.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkPacked(order.orderId)}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Mark Packed
                        </Button>
                      )}
                      {order.status === 'packed' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setActionDialog('assign')
                          }}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Assign Delivery
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Approve Dialog */}
      <Dialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Order</DialogTitle>
            <DialogDescription>
              Confirm that you want to approve this order?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={() => handleApprove(selectedOrder?.orderId)}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleReject(selectedOrder?.orderId)}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Dialog */}
      <Dialog open={actionDialog === 'assign'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Boy</DialogTitle>
            <DialogDescription>
              Select a delivery boy to assign this order
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
            <SelectTrigger>
              <SelectValue placeholder="Select delivery boy" />
            </SelectTrigger>
            <SelectContent>
              {deliveryBoys.map((db) => (
                <SelectItem key={db.userId} value={db.userId}>
                  {db.name} - {db.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={() => handleAssignDelivery(selectedOrder?.orderId)}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}