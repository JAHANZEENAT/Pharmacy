'use client'

import React, { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from 'next/navigation'
import {
    Search,
    Plus,
    Download,
    Eye,
    Trash2,
    Store,
    Truck,
    MoreVertical,
    Check,
    X,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export default function StoreTable({ stores = [], loading = false, onRefresh }) {
    const [search, setSearch] = useState('')
    const [processingId, setProcessingId] = useState(null)
    const { getToken } = useAuth()
    const router = useRouter()

    const filteredStores = stores.filter(store =>
        store.name?.toLowerCase().includes(search.toLowerCase()) ||
        store.email?.toLowerCase().includes(search.toLowerCase()) ||
        store.address?.toLowerCase().includes(search.toLowerCase())
    )

    const handleVerification = async (userId, approved) => {
        try {
            setProcessingId(userId)
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
                toast.success(approved ? 'Pharmacy approved successfully' : 'Pharmacy registration rejected')
                if (onRefresh) onRefresh()
            } else {
                toast.error(data.error || 'Failed to update status')
            }
        } catch (error) {
            toast.error('An error occurred while updating status')
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl border shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-slate-500 text-sm">Loading stores...</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search stores..."
                        className="pl-9 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-10 text-slate-600 border-slate-200">
                        <Download className="h-4 w-4 mr-2" />
                        Import
                    </Button>
                    <Button size="sm" className="h-10 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Store
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead className="font-semibold text-slate-900">Name</TableHead>
                            <TableHead className="font-semibold text-slate-900">Status</TableHead>
                            <TableHead className="font-semibold text-slate-900">Address</TableHead>
                            <TableHead className="font-semibold text-slate-900">Phone</TableHead>
                            <TableHead className="font-semibold text-slate-900">Commission</TableHead>
                            <TableHead className="font-semibold text-slate-900 text-center">Orders</TableHead>
                            <TableHead className="font-semibold text-slate-900 text-center">Joined At</TableHead>
                            <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStores.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                                    No stores found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStores.map((store) => (
                                <TableRow key={store.userId || store.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <Store className="h-4 w-4 text-blue-600" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">
                                        <div>
                                            <p>{store.name}</p>
                                            <p className="text-xs text-slate-500 font-normal">{store.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "border-none hover:bg-opacity-80 capitalize px-3 py-1",
                                            store.verificationStatus === 'approved' ? "bg-green-100 text-green-700" :
                                                store.verificationStatus === 'pending' ? "bg-amber-100 text-amber-700" :
                                                    store.verificationStatus === 'rejected' ? "bg-red-100 text-red-700" :
                                                        "bg-slate-100 text-slate-700"
                                        )}>
                                            {store.verificationStatus || 'Pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-slate-600 font-medium">{store.address || 'N/A'}</TableCell>
                                    <TableCell className="text-slate-600 font-medium">{store.phone || 'N/A'}</TableCell>
                                    <TableCell className="text-slate-600 font-bold">{store.commission || '10'}%</TableCell>
                                    <TableCell className="text-slate-900 font-bold text-center">{store.ordersCount || 0}</TableCell>
                                    <TableCell className="text-slate-500 text-center text-xs font-medium">
                                        {store.createdAt ? new Date(store.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {store.verificationStatus === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:bg-green-50"
                                                        onClick={() => handleVerification(store.userId, true)}
                                                        disabled={processingId === store.userId}
                                                        title="Approve"
                                                    >
                                                        {processingId === store.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleVerification(store.userId, false)}
                                                        disabled={processingId === store.userId}
                                                        title="Reject"
                                                    >
                                                        {processingId === store.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                onClick={() => router.push(`/admin/pharmacy/${store.userId}`)}
                                                title="View Profile"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-4 border-t flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
                <p>Showing {filteredStores.length} entries</p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled className="h-8 border-slate-200">Previous</Button>
                    <Button variant="outline" size="sm" className="h-8 bg-blue-600 text-white border-blue-600 hover:bg-blue-700">1</Button>
                    <Button variant="outline" size="sm" className="h-8 border-slate-200">Next</Button>
                </div>
            </div>
        </div>
    )
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}
