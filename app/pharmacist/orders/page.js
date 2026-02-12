'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Package,
    ShoppingBag,
    CheckCircle,
    XCircle,
    User,
    FileText,
    Clock,
    Truck,
    Search,
    ArrowRight,
    ExternalLink,
    Eye,
    Loader2,
    Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function PharmacistOrdersPage() {
    const { user, getToken, loading: authLoading } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [actionDialog, setActionDialog] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [deliveryBoys, setDeliveryBoys] = useState([])
    const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const router = useRouter()

    useEffect(() => {
        if (authLoading) return

        if (!user || user.role !== 'pharmacist') {
            router.push('/operator/login')
            return
        }
        fetchOrders()
        fetchDeliveryBoys()
    }, [user, authLoading, router, statusFilter])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const token = getToken()
            const response = await fetch('/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()

            let filtered = data.orders || []
            if (statusFilter !== 'all') {
                filtered = filtered.filter(o => o.status === statusFilter)
            }

            setOrders(filtered)
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

    const getStatusBadge = (status) => {
        const statuses = {
            'placed': 'bg-blue-100 text-blue-700',
            'approved': 'bg-purple-100 text-purple-700',
            'packed': 'bg-indigo-100 text-indigo-700',
            'out_for_delivery': 'bg-orange-100 text-orange-700',
            'delivered': 'bg-green-100 text-green-700',
            'rejected': 'bg-red-100 text-red-700',
        }
        return cn("capitalize text-[10px] py-0 px-2 font-black border-none", statuses[status] || "bg-slate-100 text-slate-700")
    }

    if (!user) return null

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Orders Management</h1>
                    <p className="text-slate-500 mt-1">Manage and track incoming customer orders.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-11 border-slate-200 bg-white">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Orders</SelectItem>
                            <SelectItem value="placed">Newly Placed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="packed">Packed</SelectItem>
                            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-24">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
                    <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <Card className="border-dashed border-2 bg-slate-50/50">
                    <CardContent className="py-24 text-center">
                        <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">No Orders Yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">Once customers start purchasing from your store, their orders will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => (
                        <Card key={order.orderId} className="border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
                            <div className="grid grid-cols-1 lg:grid-cols-4 items-stretch">
                                <div className="p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-purple-600">
                                            <ShoppingBag className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Order ID</p>
                                            <p className="text-lg font-black text-slate-900 tracking-tighter">#{order.orderId.slice(-8)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{format(new Date(order.createdAt), 'MMM dd, yyyy • HH:mm')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getStatusBadge(order.status)}>
                                                {order.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 lg:col-span-2 space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                                <span className="text-xs font-black text-slate-900">{item.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bill</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{order.totalAmount}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {order.prescriptionUrls && order.prescriptionUrls.length > 0 && (
                                                <div className="flex flex-col items-end">
                                                    <Badge className="bg-amber-100 text-amber-700 border-none flex items-center gap-1.5 text-[9px] font-black mb-1">
                                                        <FileText className="h-3 w-3" />
                                                        PRESCRIPTION ATTACHED
                                                    </Badge>
                                                    <Link href="/pharmacist/prescriptions" className="text-[10px] font-bold text-purple-600 hover:underline">Verify now</Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col justify-center gap-3 bg-slate-50/50 lg:border-l border-slate-100">
                                    {order.status === 'placed' && (
                                        <>
                                            <Button
                                                className="w-full bg-purple-600 hover:bg-purple-700 font-bold h-11"
                                                onClick={() => {
                                                    setSelectedOrder(order)
                                                    setActionDialog('approve')
                                                }}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve Order
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full text-red-600 border-red-100 hover:bg-red-50 font-bold h-11"
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
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-11"
                                            onClick={() => handleMarkPacked(order.orderId)}
                                        >
                                            <Package className="h-4 w-4 mr-2" />
                                            Mark Packed
                                        </Button>
                                    )}
                                    {order.status === 'packed' && (
                                        <Button
                                            className="w-full bg-orange-600 hover:bg-orange-700 font-bold h-11 text-white"
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                setActionDialog('assign')
                                            }}
                                        >
                                            <Truck className="h-4 w-4 mr-2" />
                                            Assign Delivery
                                        </Button>
                                    )}
                                    {(order.status === 'out_for_delivery' || order.status === 'delivered') && (
                                        <Button variant="ghost" className="w-full font-bold h-11 pointer-events-none text-slate-400">
                                            Processed Case
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Approve Dialog */}
            <Dialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-2xl font-black tracking-tight">Approve Order</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium pt-2 leading-relaxed">
                            Confirm that you have verified the inventory and any required prescriptions. This will notify the customer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 my-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Order Amount</span>
                            <span className="text-lg font-black text-slate-900">₹{selectedOrder?.totalAmount}</span>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setActionDialog(null)} className="font-bold">Cancel</Button>
                        <Button onClick={() => handleApprove(selectedOrder?.orderId)} className="bg-purple-600 font-bold">Confirm Approval</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight text-red-600">Reject Order</DialogTitle>
                        <DialogDescription>
                            Please provide a valid reason for cancelling this order.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Reason (e.g., Stock unavailable, Prescription invalid)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="h-32 border-slate-200 focus:ring-red-500"
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setActionDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleReject(selectedOrder?.orderId)} className="font-bold">Confirm Rejection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Delivery Dialog */}
            <Dialog open={actionDialog === 'assign'} onOpenChange={() => setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Assign Logistics</DialogTitle>
                        <DialogDescription>
                            Select an available delivery partner to dispatch this order.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Available Partners</Label>
                            <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
                                <SelectTrigger className="h-12 border-slate-200">
                                    <SelectValue placeholder="Search delivery boy..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {deliveryBoys.map((db) => (
                                        <SelectItem key={db.userId} value={db.userId} className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{db.name}</span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{db.phone || db.email}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setActionDialog(null)}>Cancel</Button>
                        <Button onClick={() => handleAssignDelivery(selectedOrder?.orderId)} className="bg-orange-600 font-bold text-white">Dispatch Order</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
