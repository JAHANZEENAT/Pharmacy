'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ShoppingBag,
    Search,
    Filter,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    Truck,
    Package,
    ArrowRight,
    Loader2,
    Calendar,
    ChevronDown
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const { getToken, user, loading: authLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (authLoading) return
        if (!user || user.role !== 'admin') {
            router.push('/admin/login')
            return
        }
        fetchOrders()
    }, [user, authLoading, router])

    const fetchOrders = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        try {
            setLoading(true)
            const token = getToken()
            const response = await fetch('/api/admin/orders', {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal
            })

            if (!response.ok) throw new Error('API Error')

            const data = await response.json()
            setOrders(data.orders || [])
        } catch (error) {
            console.error('Fetch orders error:', error)
            if (error.name === 'AbortError') {
                toast.error('Orders request timed out')
            } else {
                toast.error('Failed to load orders')
            }
        } finally {
            clearTimeout(timeoutId)
            setLoading(false)
        }
    }

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderId.toLowerCase().includes(search.toLowerCase()) ||
            (order.customerId && order.customerId.toLowerCase().includes(search.toLowerCase()))
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status) => {
        switch (status) {
            case 'placed': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Placed</Badge>
            case 'approved': return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Approved</Badge>
            case 'packed': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Packed</Badge>
            case 'out_for_delivery': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Out for Delivery</Badge>
            case 'delivered': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Delivered</Badge>
            case 'rejected': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Rejected</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    if (authLoading || (!user && loading)) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium">Loading system orders...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Orders</h1>
                    <p className="text-slate-500 mt-1">Monitor all transactions and order fulfillment across the platform.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="bg-white border-slate-200" onClick={fetchOrders}>
                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                        Refresh Data
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Orders</p>
                            <h3 className="text-xl font-black text-slate-900">{orders.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Active</p>
                            <h3 className="text-xl font-black text-slate-900">
                                {orders.filter(o => !['delivered', 'rejected'].includes(o.status)).length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Delivered</p>
                            <h3 className="text-xl font-black text-slate-900">
                                {orders.filter(o => o.status === 'delivered').length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Rejected</p>
                            <h3 className="text-xl font-black text-slate-900">
                                {orders.filter(o => o.status === 'rejected').length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b py-4 px-6 focus-within:bg-white transition-colors">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by Order ID..."
                                className="pl-10 h-10 border-slate-200 focus-visible:ring-blue-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[180px] h-10 border-slate-200">
                                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="placed">Placed</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="packed">Packed</SelectItem>
                                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                            <p className="text-slate-500 font-medium">Fetching orders catalog...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                            <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center mb-6">
                                <ShoppingBag className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No matching orders</h3>
                            <p className="text-slate-500 max-w-xs mt-2 text-sm">We couldn't find any orders matching your current search or filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Order ID</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Participants</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.orderId} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">
                                                        #{order.orderId.slice(-8).toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{order.orderId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-600">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                                                    <span className="text-[10px] text-slate-400">{format(new Date(order.createdAt), 'hh:mm a')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-slate-900">₹{order.totalAmount}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <Badge variant="outline" className="text-[9px] h-5 border-blue-100 text-blue-600 px-1.5 font-bold uppercase tracking-tighter" title="Customer">C</Badge>
                                                    {order.pharmacistId && (
                                                        <Badge variant="outline" className="text-[9px] h-5 border-purple-100 text-purple-600 px-1.5 font-bold uppercase tracking-tighter" title="Pharmacist">P</Badge>
                                                    )}
                                                    {order.deliveryBoyId && (
                                                        <Badge variant="outline" className="text-[9px] h-5 border-amber-100 text-amber-600 px-1.5 font-bold uppercase tracking-tighter" title="Delivery Boy">D</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => router.push(`/admin/orders/${order.orderId}`)}>
                                                    View Details
                                                    <ArrowRight className="h-3 w-3 ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
