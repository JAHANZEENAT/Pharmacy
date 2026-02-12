'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
// import { supabase } from '@/lib/supabase'
import { Truck, User, Mail, Lock, Phone, Upload } from 'lucide-react'

export default function DeliveryRegister() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'delivery_boy'
    })
    const [documentFile, setDocumentFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB')
                return
            }
            setDocumentFile(file)
            toast.success(`Document selected: ${file.name}`)
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

        if (!formData.name || !formData.email || !formData.password || !formData.phone || !documentFile) {
            window.alert('Please fill in all required fields and upload your identity proof (Aadhaar/PAN)')
            return
        }

        setLoading(true)

        try {
            // 1. Upload Document
            let idProofUrl = ''
            try {
                idProofUrl = await uploadFile(documentFile, 'id_proofs')
            } catch (uploadErr) {
                console.error('Upload error:', uploadErr)
                toast.error('Failed to upload document to Supabase. Please check your connection or try again.')
                setLoading(false)
                return
            }

            // 2. Register via API
            const response = await fetch('/api/auth/operator/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    idProofUrl
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Registration successful! Your account is pending admin approval.')
                router.push('/operator/login?status=pending')
            } else {
                toast.error(data.error || 'Registration failed')
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-2 mb-4">
                        <Truck className="h-10 w-10 text-green-600" />
                        <span className="text-3xl font-bold text-green-900">PharmaFlow</span>
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-800">Delivery Partner Registration</h2>
                    <p className="text-gray-600 mt-2">Join our delivery network and start earning</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Delivery Account</CardTitle>
                        <CardDescription>Your account will be activated after admin verification</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Full Name *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="password">Password *</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+91 9876543210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="document">Identity Document (18+ Proof) *</Label>
                                <div className="mt-2">
                                    <label htmlFor="document" className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                                        <div className="text-center">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                            <span className="mt-2 block text-sm font-medium text-gray-600">
                                                {documentFile ? documentFile.name : 'Click to upload document'}
                                            </span>
                                            <span className="mt-1 block text-xs text-gray-500">
                                                PDF, JPG, PNG (Max 5MB)
                                            </span>
                                        </div>
                                        <input
                                            id="document"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-amber-600 mt-1">
                                    ⚠️ Valid 18+ identity proof (Aadhaar/PAN/Driving License) required
                                </p>
                            </div>

                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                {loading ? 'Registering...' : 'Register as Delivery Partner'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-gray-600">Already registered? </span>
                            <Link href="/operator/login" className="text-green-600 hover:underline font-medium">
                                Login here
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}
