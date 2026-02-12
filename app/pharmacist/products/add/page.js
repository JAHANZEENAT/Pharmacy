'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Search,
    Package,
    Check,
    ChevronsUpDown,
    CircleDollarSign,
    Layers,
    Star,
    Info,
    Loader2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export default function AddProductPage() {
    const [medicines, setMedicines] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [open, setOpen] = useState(false)
    const [selectedMedicine, setSelectedMedicine] = useState(null)
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
        fetchMasterMedicines()
    }, [user])

    const fetchMasterMedicines = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/medicines')
            const data = await response.json()
            setMedicines(data.medicines || [])
        } catch (error) {
            toast.error('Failed to load medicines list')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!selectedMedicine) {
            toast.error('Please select a medicine from the master catalog')
            return
        }
        if (!formData.price || Number(formData.price) <= 0) {
            toast.error('Please provide a valid price')
            return
        }
        if (!formData.stock || Number(formData.stock) < 0) {
            toast.error('Please provide valid stock quantity')
            return
        }

        try {
            setSaving(true)
            const token = getToken()
            const response = await fetch('/api/pharmacy/products/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    medicineId: selectedMedicine.medicineId,
                    price: Number(formData.price),
                    stock: Number(formData.stock),
                    status: formData.status,
                    featured: formData.featured
                })
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Product added to your store successfully')
                router.push('/pharmacist/dashboard')
            } else {
                toast.error(data.error || 'Failed to add product')
            }
        } catch (error) {
            toast.error('An error occurred while adding product')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="mb-4 text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Product to Store</h1>
                <p className="text-slate-500 mt-1">Select a medicine from the master catalog and set your price and stock.</p>
            </div>

            <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                    <Package className="h-5 w-5 text-purple-600" />
                                    Product Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700">Select Medicine *</Label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-full justify-between h-12 border-slate-200 hover:bg-slate-50"
                                            >
                                                {selectedMedicine ? selectedMedicine.name : "Search medicines..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search medicine name..." className="h-9" />
                                                {loading && (
                                                    <div className="p-4 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-600" />
                                                    </div>
                                                )}
                                                <CommandEmpty>No medicine found.</CommandEmpty>
                                                <CommandList>
                                                    <CommandGroup>
                                                        {medicines.map((medicine) => (
                                                            <CommandItem
                                                                key={medicine.medicineId}
                                                                value={medicine.name}
                                                                onSelect={() => {
                                                                    setSelectedMedicine(medicine)
                                                                    setOpen(false)
                                                                }}
                                                                className="py-3 px-4"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4 text-purple-600",
                                                                        selectedMedicine?.medicineId === medicine.medicineId ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-slate-900">{medicine.name}</span>
                                                                    <span className="text-[10px] text-slate-500">{medicine.manufacturer} • {medicine.category}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {selectedMedicine && (
                                        <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-start gap-3">
                                            <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-bold text-purple-900">{selectedMedicine.name}</p>
                                                <p className="text-purple-700 mt-1">{selectedMedicine.description || 'No detailed description available.'}</p>
                                                <div className="flex gap-2 mt-2">
                                                    {selectedMedicine.prescriptionRequired && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Rx Required</span>
                                                    )}
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{selectedMedicine.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="price" className="text-sm font-bold text-slate-700">Price (₹) *</Label>
                                        <div className="relative">
                                            <Input
                                                id="price"
                                                type="number"
                                                placeholder="0.00"
                                                className="h-11 pl-10 border-slate-200 focus:ring-purple-500"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                required
                                            />
                                            <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="stock" className="text-sm font-bold text-slate-700">Initial Stock Quantity *</Label>
                                        <div className="relative">
                                            <Input
                                                id="stock"
                                                type="number"
                                                placeholder="0"
                                                className="h-11 pl-10 border-slate-200 focus:ring-purple-500"
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

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-sm font-bold text-slate-800">Publishing Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData({ ...formData, status: val })}
                                    >
                                        <SelectTrigger className="h-10 border-slate-200">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft (Hidden)</SelectItem>
                                            <SelectItem value="published">Published (Visible)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Star className={cn("h-5 w-5", formData.featured ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Featured</p>
                                            <p className="text-[10px] text-slate-500 leading-tight">Show on store home</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={formData.featured}
                                        onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t p-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-purple-600 hover:bg-purple-700 h-11 font-bold shadow-lg shadow-purple-100"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        "Add to Store Inventory"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                <strong>Note:</strong> You can only add products that already exist in the global master list.
                                If you can't find a medicine, please contact the administrator to have it added to the catalog.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
