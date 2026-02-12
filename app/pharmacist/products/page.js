'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    AlertTriangle,
    FileText,
    Loader2,
    Check,
    X,
    Star,
    ExternalLink,
    Package
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
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function PharmacyProductsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const { getToken, user } = useAuth()

    useEffect(() => {
        fetchProducts()
    }, [search, statusFilter, categoryFilter])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const token = getToken()
            let url = '/api/pharmacy/products'
            const params = new URLSearchParams()
            if (search) params.append('search', search)

            const response = await fetch(`${url}?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()

            let filtered = data.products || []
            if (statusFilter !== 'all') {
                filtered = filtered.filter(p => p.status === statusFilter)
            }
            if (categoryFilter !== 'all') {
                filtered = filtered.filter(p => p.category === categoryFilter)
            }

            setProducts(filtered)
        } catch (error) {
            toast.error('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to remove this product from your store?')) return

        try {
            const token = getToken()
            const response = await fetch('/api/pharmacy/products/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Product removed from your store')
                fetchProducts()
            } else {
                toast.error(data.error || 'Failed to delete')
            }
        } catch (error) {
            toast.error('An error occurred during deletion')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Inventory</h1>
                    <p className="text-slate-500 mt-1">Manage medicines linked to your pharmacy store</p>
                </div>
                <Button asChild className="bg-purple-600 hover:bg-purple-700 font-bold shadow-lg shadow-purple-100">
                    <Link href="/pharmacist/products/add">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Store Product
                    </Link>
                </Button>
            </div>

            <Card className="border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                    <div className="flex flex-col xl:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search your inventory by medicine name..."
                                className="pl-10 h-10 border-slate-200 focus:ring-purple-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[160px] h-10 border-slate-200">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px] h-10 border-slate-200">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                                    <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                                    <SelectItem value="Cold & Allergy">Cold & Allergy</SelectItem>
                                    <SelectItem value="Diabetes">Diabetes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                            <p className="text-slate-500 font-medium">Loading your inventory...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                            <div className="bg-slate-100 h-16 w-16 rounded-3xl flex items-center justify-center mb-6">
                                <Package className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                            <p className="text-slate-500 max-w-xs mt-2 mx-auto">
                                {search || statusFilter !== 'all' || categoryFilter !== 'all'
                                    ? "Try adjusting your search or filters to see results."
                                    : "Link your first product from the medicine master list to get started."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Product Details</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Price & Stock</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Rx Required</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Sync</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center overflow-hidden border border-purple-100 group-hover:scale-105 transition-transform shrink-0">
                                                        {p.imageUrl ? (
                                                            <img src={p.imageUrl} alt={p.medicine_name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Package className="h-6 w-6 text-purple-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{p.medicine_name}</p>
                                                            {p.featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[180px]">
                                                            {p.manufacturer} • {p.category}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 tracking-tighter">₹{p.price}</span>
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase tracking-widest",
                                                        p.stock < 10 ? "text-red-500 animate-pulse" : "text-slate-400"
                                                    )}>
                                                        Stock: {p.stock}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.prescriptionRequired ? (
                                                    <Badge className="bg-purple-100 text-purple-700 border-none text-[9px] font-black uppercase">Required</Badge>
                                                ) : (
                                                    <Badge className="bg-slate-100 text-slate-400 border-none text-[9px] font-black uppercase">No Request</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={cn(
                                                    "capitalize text-[10px] font-bold border-none",
                                                    p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                                )}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {format(new Date(p.updatedAt), 'MMM dd, p')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                                                    >
                                                        <Link href={`/pharmacist/products/edit/${p.id}`}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(p.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
