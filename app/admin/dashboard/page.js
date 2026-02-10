'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Shield, Users, Package, Truck, CheckCircle, XCircle, LogOut, User, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const { user, logout, getToken } = useAuth()
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/admin/login')
      return
    }
    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      const token = getToken()

      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const usersData = await usersResponse.json()
      setUsers(usersData.users || [])

      // Fetch orders (status only - privacy compliant)
      const ordersResponse = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const ordersData = await ordersResponse.json()
      setOrders(ordersData.orders || [])
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (userId, approved) => {
    try {
      const token = getToken()
      const response = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, approved })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(approved ? 'User approved' : 'User rejected')
        fetchData()
        setApprovalDialog(false)
        setSelectedUser(null)
      }
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  if (!user) return null

  const customers = users.filter(u => u.role === 'customer')
  const pharmacists = users.filter(u => u.role === 'pharmacist')
  const deliveryBoys = users.filter(u => u.role === 'delivery_boy')
  const pendingApprovals = users.filter(u => u.verificationStatus === 'pending' && ['pharmacist', 'delivery_boy'].includes(u.role))

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">PharmaFlow - Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-white">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout} className="bg-gray-700 text-white border-gray-600">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-white">System Dashboard</h2>
          <p className="text-gray-400">Monitor and manage the pharmacy management system</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">{customers.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Pharmacists</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-400">{pharmacists.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Delivery Boys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{deliveryBoys.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-400">{pendingApprovals.length}</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <p className="mt-4 text-gray-400">Loading data...</p>
          </div>
        ) : (
          <Tabs defaultValue="approvals" className="space-y-4">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="approvals" className="data-[state=active]:bg-gray-700">
                Pending Approvals ({pendingApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="customers" className="data-[state=active]:bg-gray-700">
                Customers
              </TabsTrigger>
              <TabsTrigger value="pharmacists" className="data-[state=active]:bg-gray-700">
                Pharmacists
              </TabsTrigger>
              <TabsTrigger value="delivery" className="data-[state=active]:bg-gray-700">
                Delivery Boys
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-gray-700">
                Orders (Status Only)
              </TabsTrigger>
            </TabsList>

            {/* Pending Approvals */}
            <TabsContent value="approvals">
              {pendingApprovals.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-white">No Pending Approvals</h3>
                    <p className="text-gray-400">All operators have been reviewed</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((user) => (
                    <Card key={user.userId} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold text-lg text-white">{user.name}</h3>
                              <Badge variant="outline" className="text-amber-400 border-amber-400">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                              <Badge variant="secondary">
                                {user.role === 'pharmacist' ? 'Pharmacist' : 'Delivery Boy'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{user.email}</p>
                            <p className="text-sm text-gray-400">Registered: {format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
                            {user.documentUrl && (
                              <div className="mt-2">
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  <FileText className="h-3 w-3" />
                                  Document Uploaded
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setApprovalDialog(true)
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(user.userId, false)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Customers */}
            <TabsContent value="customers">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <div key={customer.userId} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                        <div>
                          <p className="font-medium text-white">{customer.name}</p>
                          <p className="text-sm text-gray-400">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={customer.active ? 'default' : 'secondary'}>
                            {customer.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {customer.lastOrderAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Last order: {format(new Date(customer.lastOrderAt), 'MMM dd')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pharmacists */}
            <TabsContent value="pharmacists">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Pharmacists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pharmacists.map((pharmacist) => (
                      <div key={pharmacist.userId} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                        <div>
                          <p className="font-medium text-white">{pharmacist.name}</p>
                          <p className="text-sm text-gray-400">{pharmacist.email}</p>
                        </div>
                        <Badge variant={pharmacist.verificationStatus === 'approved' ? 'default' : 'secondary'}>
                          {pharmacist.verificationStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Delivery Boys */}
            <TabsContent value="delivery">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Delivery Boys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {deliveryBoys.map((db) => (
                      <div key={db.userId} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                        <div>
                          <p className="font-medium text-white">{db.name}</p>
                          <p className="text-sm text-gray-400">{db.email}</p>
                        </div>
                        <Badge variant={db.verificationStatus === 'approved' ? 'default' : 'secondary'}>
                          {db.verificationStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders (Status Only - Privacy Compliant) */}
            <TabsContent value="orders">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Order Monitoring (Status Only)</CardTitle>
                  <p className="text-sm text-gray-400 mt-2">
                    ⚠️ Privacy Notice: Order details and customer information are hidden for privacy compliance
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div key={order.orderId} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                        <div>
                          <p className="font-medium text-white">Order #{order.orderId?.slice(-8)}</p>
                          <p className="text-sm text-gray-400">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge>
                            {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                          <p className="text-sm text-gray-400 mt-1">\u20b9{order.totalAmount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Approval Confirmation Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Approve User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Approve {selectedUser?.name} as {selectedUser?.role === 'pharmacist' ? 'Pharmacist' : 'Delivery Boy'}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              <strong className="text-white">Name:</strong> {selectedUser?.name}
            </p>
            <p className="text-sm text-gray-400">
              <strong className="text-white">Email:</strong> {selectedUser?.email}
            </p>
            {selectedUser?.documentUrl && (
              <p className="text-sm text-gray-400">
                <strong className="text-white">Document:</strong> Uploaded ✓
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)} className="bg-gray-700 border-gray-600">
              Cancel
            </Button>
            <Button onClick={() => handleApproval(selectedUser?.userId, true)} className="bg-green-600 hover:bg-green-700">
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
