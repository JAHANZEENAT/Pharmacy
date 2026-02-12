'use client'

import React, { useState, useEffect } from 'react'
import {
    Search,
    Plus,
    Upload,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    Package,
    CheckCircle,
    AlertTriangle,
    Star,
    FileCode,
    Loader2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export default function PharmacyProductCatalog({ pharmacistId }) {
    const [medicines, setMedicines] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { getToken } = useAuth()

    const fetchMedicines = async () => {
        try {
            setLoading(true)
            const token = getToken()
            const response = await fetch(`/api/admin/medicines?pharmacistId=${pharmacistId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.medicines) {
                setMedicines(data.medicines)
            }
        } catch (error) {
            toast.error('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (pharmacistId) fetchMedicines()
    }, [pharmacistId])

    const handleDelete = async (medicineId) => {
        if (!window.confirm('Are you sure you want to remove this product?')) return

        try {
            const token = getToken()
            const response = await fetch('/api/admin/medicines/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ medicineId })
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Product removed successfully')
                fetchMedicines()
            } else {
                toast.error(data.error || 'Failed to remove product')
            }
        } catch (error) {
            toast.error('An error occurred during removal')
        }
    }

    const filteredMedicines = medicines.filter(m =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.category?.toLowerCase().includes(search.toLowerCase()) ||
        m.manufacturer?.toLowerCase().includes(search.toLowerCase())
    )

    // Calculate stats
    const stats = {
        total: medicines.length,
        published: medicines.filter(m => m.stock > 0).length, // Mock status as stock > 0 for now
        new: medicines.filter(m => new Date(m.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        featured: medicines.filter(m => m.featured).length,
        lowStock: medicines.filter(m => m.stock < 10).length
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 mt-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 text-sm font-medium">Loading product catalog...</p>
            </div>
        )
    }

    return (
        <div className="mt-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 px-1">Product Catalog</h2>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Products', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Published', value: stats.published, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'New Products', value: stats.new, icon: FileCode, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Featured', value: stats.featured, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className={`h-10 w-10 ${stat.bg} ${stat.color} rounded-full flex items-center justify-center mb-3`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Product Table Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search products..."
                            className="pl-9 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-10 text-slate-600 border-slate-200">
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>
                        <Button size="sm" className="h-10 bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="w-[80px] font-semibold text-slate-900">Image</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Product Name</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Category</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Manufacturer</TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-center">Stock</TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-right">Price</TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-center">Prescription</TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMedicines.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                                            No products found for this pharmacy.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMedicines.map((medicine) => (
                                        <TableRow key={medicine.medicineId} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border">
                                                    {medicine.imageUrl ? (
                                                        <img src={medicine.imageUrl} alt={medicine.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-slate-300" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">
                                                <div>
                                                    <p>{medicine.name}</p>
                                                    {medicine.featured && (
                                                        <Badge variant="outline" className="mt-1 h-5 text-[10px] bg-amber-50 text-amber-600 border-amber-200">Featured</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 text-sm">{medicine.category}</TableCell>
                                            <TableCell className="text-slate-600 text-sm font-medium">{medicine.manufacturer}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`text-sm font-bold ${medicine.stock < 10 ? 'text-red-500' : 'text-slate-900'}`}>{medicine.stock}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">
                                                ₹{medicine.price}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`border-none ${medicine.prescriptionRequired ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {medicine.prescriptionRequired ? 'Yes' : 'No'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit Product
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={() => handleDelete(medicine.medicineId)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="p-4 border-t flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                        <p>Showing {filteredMedicines.length} products</p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 border-slate-200 text-[10px]">Previous</Button>
                            <Button variant="outline" size="sm" className="h-8 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 text-[10px]">1</Button>
                            <Button variant="outline" size="sm" className="h-8 border-slate-200 text-[10px]">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
