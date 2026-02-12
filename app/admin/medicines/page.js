'use client'

import React, { useState, useEffect } from 'react'
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    MoreVertical,
    ShieldCheck,
    AlertCircle,
    FileText,
    Loader2,
    X,
    Check
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export default function MedicinesPage() {
    const [medicines, setMedicines] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentMedicine, setCurrentMedicine] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        manufacturer: '',
        prescriptionRequired: false,
        imageUrl: ''
    })
    const { getToken } = useAuth()

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMedicines()
        }, 500) // Debounce search
        return () => clearTimeout(timer)
    }, [search, category])

    const fetchMedicines = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        try {
            setLoading(true)
            let url = '/api/medicines'
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (category !== 'all') params.append('category', category)

            const response = await fetch(`${url}?${params.toString()}`, {
                signal: controller.signal
            })

            if (!response.ok) throw new Error('API unstable')

            const data = await response.json()
            setMedicines(data.medicines || [])
        } catch (error) {
            console.error('Fetch error:', error)
            if (error.name === 'AbortError') {
                toast.error('Request timed out. The database might be busy.')
            } else {
                toast.error('Failed to load medicines. Please refresh.')
            }
        } finally {
            clearTimeout(timeoutId)
            setLoading(false)
        }
    }

    const handleOpenDialog = (medicine = null) => {
        if (medicine) {
            setCurrentMedicine(medicine)
            setFormData({
                name: medicine.name,
                description: medicine.description || '',
                category: medicine.category || '',
                manufacturer: medicine.manufacturer || '',
                prescriptionRequired: medicine.prescriptionRequired || false,
                imageUrl: medicine.imageUrl || ''
            })
        } else {
            setCurrentMedicine(null)
            setFormData({
                name: '',
                description: '',
                category: '',
                manufacturer: '',
                prescriptionRequired: false,
                imageUrl: ''
            })
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Medicine name is required')
            return
        }

        try {
            const token = getToken()
            const url = currentMedicine ? '/api/medicines/update' : '/api/medicines/add'
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentMedicine ? { ...formData, medicineId: currentMedicine.medicineId } : formData)
            })

            const data = await response.json()
            if (data.success) {
                toast.success(`Medicine ${currentMedicine ? 'updated' : 'added'} successfully`)
                setIsDialogOpen(false)
                fetchMedicines()
            } else {
                toast.error(data.error || 'Operation failed')
            }
        } catch (error) {
            toast.error('An error occurred while saving')
        }
    }

    const handleDelete = async (medicineId) => {
        if (!confirm('Are you sure you want to delete this medicine? This will not remove it from pharmacist stores but will prevent new links.')) return

        try {
            const token = getToken()
            const response = await fetch('/api/medicines/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ medicineId })
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Medicine deleted')
                fetchMedicines()
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
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Medicine Master</h1>
                    <p className="text-slate-500 mt-1">Manage the global database of medicines available to pharmacies</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Medicine
                </Button>
            </div>

            <Card className="border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, manufacturer, or category..."
                                className="pl-10 h-10 border-slate-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full md:w-[200px] h-10 border-slate-200">
                                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                                <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                                <SelectItem value="Cold & Allergy">Cold & Allergy</SelectItem>
                                <SelectItem value="Diabetes">Diabetes</SelectItem>
                                <SelectItem value="Heart Health">Heart Health</SelectItem>
                                <SelectItem value="Vitamins">Vitamins</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                            <p className="text-slate-500 font-medium">Loading medicines catalog...</p>
                        </div>
                    ) : medicines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No medicines found</h3>
                            <p className="text-slate-500 max-w-xs mt-1">Try adjusting your filters or add a new medicine to the master list.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Medicine Details</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Manufacturer</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Prescription</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {medicines.map((med) => (
                                        <tr key={med.medicineId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100">
                                                        {med.imageUrl ? (
                                                            <img src={med.imageUrl} alt={med.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <FileText className="h-5 w-5 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{med.name}</p>
                                                        <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">{med.description || 'No description'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none font-medium">
                                                    {med.category || 'Uncategorized'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 font-medium">{med.manufacturer || 'Unknown'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {med.prescriptionRequired ? (
                                                    <Badge className="bg-amber-100 text-amber-700 border-none">Required</Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-700 border-none">Not Required</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                        onClick={() => handleOpenDialog(med)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                        onClick={() => handleDelete(med.medicineId)}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{currentMedicine ? 'Edit Medicine' : 'Add New Medicine'}</DialogTitle>
                        <DialogDescription>
                            {currentMedicine ? 'Update medicine details in the master catalog.' : 'Add a new medicine to the global catalog for pharmacies to reference.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                placeholder="Medicine Name"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                                    <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                                    <SelectItem value="Cold & Allergy">Cold & Allergy</SelectItem>
                                    <SelectItem value="Diabetes">Diabetes</SelectItem>
                                    <SelectItem value="Heart Health">Heart Health</SelectItem>
                                    <SelectItem value="Vitamins">Vitamins</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="manufacturer" className="text-right">Manufacturer</Label>
                            <Input
                                id="manufacturer"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                className="col-span-3"
                                placeholder="Manufacturer Name"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right mt-2">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="col-span-3"
                                placeholder="Medicine details, usage, etc."
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
                            <Input
                                id="imageUrl"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                className="col-span-3"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prescription" className="text-right col-span-2">Prescription Required?</Label>
                            <div className="col-span-2 flex items-center gap-3">
                                <Switch
                                    id="prescription"
                                    checked={formData.prescriptionRequired}
                                    onCheckedChange={(checked) => setFormData({ ...formData, prescriptionRequired: checked })}
                                />
                                <Label htmlFor="prescription" className="text-sm font-medium text-slate-500">
                                    {formData.prescriptionRequired ? 'Yes' : 'No'}
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            {currentMedicine ? 'Save Changes' : 'Add Medicine'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
