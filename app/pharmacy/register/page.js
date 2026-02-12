'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
    Shield,
    Mail,
    Lock,
    User,
    Phone,
    Upload,
    Building2,
    MapPin,
    FileText,
    BadgeCheck,
    Loader2,
    CheckCircle2
} from 'lucide-react'
// import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function PharmacyRegister() {
    const [formData, setFormData] = useState({
        pharmacyName: '',
        ownerName: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        pincode: '',
        licenseNumber: '',
        gstNumber: '',
        password: '',
        confirmPassword: ''
    })
    const [files, setFiles] = useState({
        license: null,
        idProof: null
    })
    const [loading, setLoading] = useState(false)
    const [registered, setRegistered] = useState(false)
    const router = useRouter()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e, type) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB')
                return
            }
            setFiles(prev => ({ ...prev, [type]: file }))
            toast.success(`${type === 'license' ? 'Drug License' : 'ID Proof'} selected`)
        }
    }

    const uploadFile = async (file, path) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'documents')
        formData.append('path', path)

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        })

        const data = await response.json()
        if (!data.success) throw new Error(data.error || 'Upload failed')

        return data.url
    }

    const handleRegister = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (!files.license || !files.idProof) {
            toast.error('Please upload both required documents')
            return
        }

        setLoading(true)

        try {
            // 1. Upload Documents
            let licenseUrl = ''
            let idProofUrl = ''

            try {
                licenseUrl = await uploadFile(files.license, 'licenses')
                idProofUrl = await uploadFile(files.idProof, 'id_proofs')
            } catch (uploadErr) {
                console.error('Upload error:', uploadErr)
                toast.error('Failed to upload documents to Supabase. Please check your connection or try again.')
                setLoading(false)
                return
            }

            // 2. Register via API
            const response = await fetch('/api/auth/operator/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.pharmacyName,
                    ownerName: formData.ownerName,
                    phone: formData.phone,
                    role: 'pharmacist',
                    address: `${formData.city}, ${formData.state} - ${formData.pincode}`,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    licenseNumber: formData.licenseNumber,
                    gstNumber: formData.gstNumber,
                    licenseUrl,
                    idProofUrl
                })
            })

            const data = await response.json()

            if (data.success) {
                setRegistered(true)
                toast.success('Registration successful!')
            } else {
                toast.error(data.error || 'Registration failed')
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (registered) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-8">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Registration Successful!</CardTitle>
                        <CardDescription className="text-lg mt-2">
                            Your account is under verification. You will be notified once approved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-slate-500">
                            Our team is reviewing your documents. This process usually takes 24-48 hours.
                        </p>
                        <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => router.push('/operator/login?status=pending')}>
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col items-center mb-10">
                    <Link href="/" className="flex items-center gap-2 mb-4">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">PharmaFlow</span>
                    </Link>
                    <h1 className="text-3xl font-extrabold text-slate-900">Pharmacy Registration</h1>
                    <p className="text-slate-500 mt-2">Join our network and start selling medicines online</p>
                </div>

                <form onSubmit={handleRegister} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - General Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                    Pharmacy & Owner Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pharmacyName">Pharmacy Name *</Label>
                                    <Input id="pharmacyName" name="pharmacyName" value={formData.pharmacyName} onChange={handleChange} placeholder="e.g. Apollo Pharmacy" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ownerName">Owner Name *</Label>
                                    <Input id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Full name of the license holder" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="business@example.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="licenseNumber">Drug License Number *</Label>
                                    <Input id="licenseNumber" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="DL-XXX-XXXXX" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                                    <Input id="gstNumber" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    Location Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="City Name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State *</Label>
                                    <Input id="state" name="state" value={formData.state} onChange={handleChange} placeholder="State Name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode *</Label>
                                    <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="6-digit ZIP code" required />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-blue-600" />
                                    Security Credentials
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Minimum 8 characters" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Documents & Action */}
                    <div className="space-y-6">
                        <Card className="border-slate-200 sticky top-8">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Document Upload
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Drug License Certificate *</Label>
                                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${files.license ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-blue-400 bg-slate-50'}`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {files.license ? (
                                                <BadgeCheck className="h-6 w-6 text-green-600 mb-1" />
                                            ) : (
                                                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                                            )}
                                            <p className="text-[10px] text-slate-500">{files.license ? files.license.name : 'Click to upload License'}</p>
                                        </div>
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'license')} />
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Government ID Proof *</Label>
                                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${files.idProof ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-blue-400 bg-slate-50'}`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {files.idProof ? (
                                                <BadgeCheck className="h-6 w-6 text-green-600 mb-1" />
                                            ) : (
                                                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                                            )}
                                            <p className="text-[10px] text-slate-500">{files.idProof ? files.idProof.name : 'Click to upload ID'}</p>
                                        </div>
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'idProof')} />
                                    </label>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg shadow-blue-200"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Registering...
                                            </>
                                        ) : 'Register Pharmacy'}
                                    </Button>
                                    <p className="text-center text-xs text-slate-400 mt-4">
                                        By registering, you agree to our Terms of Service.
                                    </p>
                                </div>

                                <div className="text-center border-t pt-4 text-sm">
                                    <span className="text-slate-500">Owner of a pharmacy? </span>
                                    <Link href="/operator/login" className="text-blue-600 font-bold hover:underline">Login here</Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </div>
    )
}
