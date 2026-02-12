'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import {
    FileText,
    Search,
    Eye,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    ExternalLink,
    User,
    ShoppingBag,
    Loader2,
    ZoomIn
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function PrescriptionManagementPage() {
    const { user, getToken, loading: authLoading } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [previewImage, setPreviewImage] = useState(null)
    const router = useRouter()

    useEffect(() => {
        if (authLoading) return
        if (!user || user.role !== 'pharmacist') {
            router.push('/operator/login')
            return
        }
        fetchOrdersWithPrescriptions()
    }, [user, authLoading])

    const fetchOrdersWithPrescriptions = async () => {
        try {
            setLoading(true)
            const token = getToken()
            const response = await fetch('/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()

            // Filter for orders that have prescriptions and are in a state that needs verification
            const filtered = (data.orders || []).filter(o => o.prescriptionUrls && o.prescriptionUrls.length > 0)
            setOrders(filtered)
        } catch (error) {
            toast.error('Failed to load prescriptions')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (orderId, status) => {
        try {
            const token = getToken()
            // We'll use the approve endpoint for now as it handles verification logic
            const response = await fetch('/api/orders/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId,
                    approved: status === 'verified',
                    rejectionReason: status === 'rejected' ? 'Prescription verification failed' : null
                })
            })

            const data = await response.json()
            if (data.success) {
                toast.success(`Prescription ${status}`)
                fetchOrdersWithPrescriptions()
            }
        } catch (error) {
            toast.error('Action failed')
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Prescription Queue...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Prescription Verification</h1>
                    <p className="text-slate-500 mt-1">Review and verify uploaded medical prescriptions before dispatching orders.</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <Card className="border-dashed border-2 bg-slate-50/50">
                    <CardContent className="py-24 text-center">
                        <div className="h-20 w-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 text-purple-400">
                            <FileText className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Queue Clear!</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">Currently, there are no orders requiring manual prescription verification.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {orders.map((order) => (
                        <Card key={order.orderId} className="border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-slate-50/50 border-b py-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-purple-100 text-purple-700 font-black border-none text-[10px] uppercase">Verify Required</Badge>
                                        <span className="text-sm font-black text-slate-900">Order #{order.orderId.slice(-8)}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-xs font-bold text-slate-500">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Bill Amount</p>
                                            <p className="text-lg font-black text-slate-900 leading-tight">₹{order.totalAmount}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    {/* Left: Metadata & Items */}
                                    <div className="p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-100">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-2">Customer Details</h4>
                                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{order.customerEmail}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">Verified Customer ID: {order.customerId.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-2">Prescription Items ({order.items.length})</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                                                            <span className="text-xs font-black text-slate-900">{item.name}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded">QTY {item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <Button
                                                disabled={order.status !== 'placed'}
                                                className="flex-1 bg-green-600 hover:bg-green-700 font-bold h-11"
                                                onClick={() => handleVerify(order.orderId, 'verified')}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve Rx
                                            </Button>
                                            <Button
                                                disabled={order.status !== 'placed'}
                                                variant="outline"
                                                className="flex-1 text-red-600 border-red-100 hover:bg-red-50 font-bold h-11"
                                                onClick={() => handleVerify(order.orderId, 'rejected')}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject rx
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Right: Documents */}
                                    <div className="p-6 bg-slate-50/30">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-4 mb-4">Patient Document(s)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {order.prescriptionUrls.map((url, idx) => (
                                                <div key={idx} className="group relative aspect-[3/4] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:ring-4 hover:ring-purple-100 transition-all cursor-zoom-in" onClick={() => setPreviewImage(url)}>
                                                    <img src={url} alt={`Prescription ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                                        <ZoomIn className="h-8 w-8 text-white mb-2" />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">View Document</span>
                                                    </div>
                                                    <div className="absolute top-3 left-3">
                                                        <Badge className="bg-white/90 text-slate-900 border-none font-black text-[9px] shadow-sm">DOC 0{idx + 1}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-blue-800 font-medium leading-relaxed uppercase tracking-tighter">
                                                Carefully verify patient name, doctor's signature, and medicine dosage before approving.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Full Image Preview */}
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent">
                    <div className="relative w-full h-[85vh] flex items-center justify-center bg-black/90 p-4 rounded-3xl">
                        <img src={previewImage} alt="Prescription Full View" className="max-h-full max-w-full object-contain rounded-xl" />
                        <div className="absolute top-6 right-6 flex gap-2">
                            <Button variant="ghost" className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full" onClick={() => setPreviewImage(null)}>
                                <XCircle className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
