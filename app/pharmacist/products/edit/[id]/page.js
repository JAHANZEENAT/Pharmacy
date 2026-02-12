'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    ArrowLeft,
    Package,
    Check,
    CircleDollarSign,
    Layers,
    Star,
    Info,
    Loader2,
    Save,
    Trash2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from "@/lib/utils"

export default function EditProductPage() {
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [product, setProduct] = useState(null)
    const [formData, setFormData] = useState({
        price: '',
        stock: '',
        status: 'published',
        featured: false
    })

    const router = useRouter()
    const { getToken, user } = useAuth()

    useEffect(() => {
        if (!user) return
        if (user.role !== 'pharmacist') {
            router.push('/operator/login')
            return
        }
        fetchProductDetails()
    }, [user, id])

    const fetchProductDetails = async () => {
        try {
            setLoading(true)
            const token = getToken()
            const response = await fetch('/api/pharmacy/products', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            const found = (data.products || []).find(p => p.id === id)

            if (found) {
                setProduct(found)
                setFormData({
                    price: found.price.toString(),
                    stock: found.stock.toString(),
                    status: found.status,
                    featured: found.featured || false
                })
            } else {
                toast.error('Product not found')
                router.push('/pharmacist/products')
            }
        } catch (error) {
            toast.error('Failed to load product details')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!formData.price || Number(formData.price) <= 0) {
            toast.error('Please provide a valid price')
            return
        }

        try {
            setSaving(true)
            const token = getToken()
            const response = await fetch('/api/pharmacy/products/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: id,
                    price: Number(formData.price),
                    stock: Number(formData.stock),
                    status: formData.status,
                    featured: formData.featured
                })
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Product updated successfully')
                router.push('/pharmacist/products')
            } else {
                toast.error(data.error || 'Update failed')
            }
        } catch (error) {
            toast.error('An error occurred during save')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Permanently remove this product from your inventory?')) return

        try {
            setSaving(true)
            const token = getToken()
            const response = await fetch('/api/pharmacy/products/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: id })
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Product removed')
                router.push('/pharmacist/products')
            }
        } catch (error) {
            toast.error('Failed to delete')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing inventory data...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4 text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Inventory
                    </Button>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Store Product</h1>
                    <p className="text-slate-500 mt-1">Refine pricing and stock for <span className="text-slate-900 font-bold">{product?.medicine_name}</span></p>
                </div>
                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-11 font-bold" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Product
                </Button>
            </div>

            <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <Package className="h-5 w-5 text-purple-600" />
                                    Product Inventory Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="flex items-start gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                                    <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                                        {product?.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package className="h-full w-full p-4 text-slate-200" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{product?.medicine_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-2">{product?.manufacturer} • {product?.category}</p>
                                        {product?.prescriptionRequired && (
                                            <Badge className="bg-purple-100 text-purple-700 border-none text-[9px] font-black uppercase">Rx Mandated</Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Retail Price (₹) *</Label>
                                        <div className="relative">
                                            <Input
                                                id="price"
                                                type="number"
                                                className="h-12 pl-10 border-slate-200 focus:ring-purple-500 font-black text-lg tracking-tighter"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                required
                                            />
                                            <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="stock" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Stock *</Label>
                                        <div className="relative">
                                            <Input
                                                id="stock"
                                                type="number"
                                                className="h-12 pl-10 border-slate-200 focus:ring-purple-500 font-black text-lg tracking-tighter"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                required
                                            />
                                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b py-3">
                                <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest text-center">Visibility Panel</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6 text-center">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inventory Status</Label>
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            type="button"
                                            variant={formData.status === 'published' ? 'default' : 'outline'}
                                            className={cn("h-11 px-6 font-bold", formData.status === 'published' ? 'bg-green-600 hover:bg-green-700' : 'text-slate-500')}
                                            onClick={() => setFormData({ ...formData, status: 'published' })}
                                        >
                                            Published
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={formData.status === 'draft' ? 'default' : 'outline'}
                                            className={cn("h-11 px-6 font-bold", formData.status === 'draft' ? 'bg-slate-800 hover:bg-slate-900' : 'text-slate-500')}
                                            onClick={() => setFormData({ ...formData, status: 'draft' })}
                                        >
                                            Draft
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Star className={cn("h-4 w-4", formData.featured ? "text-amber-500 fill-amber-500" : "text-slate-300")} />
                                        <span className="text-[10px] font-black uppercase text-slate-700">Featured</span>
                                    </div>
                                    <Switch
                                        checked={formData.featured}
                                        onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/30 border-t p-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-purple-600 hover:bg-purple-700 h-12 font-black shadow-lg shadow-purple-100"
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>

                        <div className="p-5 bg-purple-50 border border-purple-100 rounded-3xl flex items-start gap-4">
                            <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-purple-800 leading-relaxed font-bold uppercase tracking-tighter">
                                Note: Updating stock to 0 will automatically hide this product from your public catalog until restocked.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
