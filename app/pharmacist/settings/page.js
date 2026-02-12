'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    User,
    Mail,
    Phone,
    MapPin,
    ShieldCheck,
    FileText,
    Percent,
    Lock,
    Camera,
    Store,
    Map,
    Files,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '@/lib/utils'

export default function PharmacySettingsPage() {
    const { user, getToken, loading: authLoading } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        phone: '',
        address: '',
        currentPassword: '',
        newPassword: '',
    })
    const router = useRouter()

    useEffect(() => {
        if (authLoading) return
        if (!user || user.role !== 'pharmacist') {
            router.push('/operator/login')
            return
        }
        fetchProfile()
    }, [user, authLoading])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const token = getToken()
            const response = await fetch('/api/pharmacy/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            if (data.profile) {
                setProfile(data.profile)
                setFormData({
                    phone: data.profile.phone || '',
                    address: data.profile.address || '',
                    currentPassword: '',
                    newPassword: '',
                })
            }
        } catch (error) {
            toast.error('Failed to load profile settings')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            const token = getToken()
            const response = await fetch('/api/pharmacy/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone: formData.phone,
                    address: formData.address
                })
            })
            const data = await response.json()
            if (data.success) {
                toast.success('Profile updated successfully')
                fetchProfile()
            } else {
                toast.error(data.error || 'Update failed')
            }
        } catch (error) {
            toast.error('An error occurred during update')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Secure Vault...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account & Store Settings</h1>
                <p className="text-slate-500 mt-1">Manage your pharmacy profile, credentials, and business information.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Public Identity */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-purple-500 to-indigo-600 relative">
                            <div className="absolute -bottom-10 left-6">
                                <div className="h-20 w-20 rounded-3xl bg-white p-1 shadow-xl border border-slate-100 flex items-center justify-center relative group overflow-hidden">
                                    <Store className="h-10 w-10 text-purple-600 group-hover:scale-110 transition-transform" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                        <Camera className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-14 pb-6 px-6">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{profile?.pharmacy_name}</h3>
                                <div className="flex items-center gap-2">
                                    <Badge className={cn(
                                        "font-black text-[9px] uppercase border-none px-2",
                                        profile?.verificationStatus === 'approved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {profile?.verificationStatus} Entity
                                    </Badge>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {profile?.id?.slice(-8)}</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Percent className="h-5 w-5 text-purple-600" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Comm.</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900">{profile?.commission || 0}%</span>
                                </div>

                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                                        <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Master Credentials</span>
                                    </div>
                                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                                        License info and owner identity are locked. Contact Support for modifications.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b py-3">
                            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest">Document Vault</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {[
                                    { label: 'Drug License', status: 'verified', url: profile?.license_document_url },
                                    { label: 'Government ID', status: 'verified', url: profile?.government_id_url },
                                    { label: 'Tax Proof (GST)', status: 'active', url: '#' },
                                ].map((doc, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between group hover:bg-slate-50/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700">{doc.label}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle/Right: Editable Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-lg font-black tracking-tight text-slate-900">Manage Store Details</CardTitle>
                            <CardDescription>Update your contact information and physical store address.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Owner Name</Label>
                                    <Input disabled value={profile?.owner_name} className="h-11 border-slate-200 bg-slate-50 text-slate-500 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Business Email</Label>
                                    <Input disabled value={profile?.email} className="h-11 border-slate-200 bg-slate-50 text-slate-500 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registered Phone</Label>
                                    <div className="relative">
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="h-11 border-slate-200 pl-10 focus:ring-purple-500 font-bold"
                                        />
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Drug License Number</Label>
                                    <Input disabled value={profile?.license_number} className="h-11 border-slate-200 bg-slate-50 text-slate-500 font-black tracking-widest" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Store Address (Publicly Visible)</Label>
                                    <div className="relative">
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="h-11 border-slate-200 pl-10 focus:ring-purple-500 font-bold"
                                        />
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="pt-4 md:col-span-2">
                                    <Button type="submit" disabled={saving} className="w-full md:w-auto px-8 bg-purple-600 hover:bg-purple-700 h-11 font-black shadow-lg shadow-purple-100">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Update Secure Details
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-lg font-black tracking-tight text-slate-900">Security Credentials</CardTitle>
                            <CardDescription>Update your password to keep your vendor panel secure.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Password</Label>
                                    <div className="relative">
                                        <Input type="password" placeholder="••••••••" className="h-11 border-slate-200 pl-10 focus:ring-purple-500" />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Password</Label>
                                    <div className="relative">
                                        <Input type="password" placeholder="Min. 8 characters" className="h-11 border-slate-200 pl-10 focus:ring-purple-500" />
                                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-slate-50/10 p-4">
                            <Button variant="outline" className="font-bold border-slate-200 px-8">Confirm Password Reset</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
