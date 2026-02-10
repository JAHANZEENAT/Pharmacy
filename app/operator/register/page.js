'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Shield, Mail, Lock, User, Phone, Upload, Building2, Truck, FileText } from 'lucide-react'

export default function OperatorRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: ''
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

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (!formData.role) {
      toast.error('Please select a role')
      return
    }

    if (!documentFile) {
      const docType = formData.role === 'pharmacist' ? 'pharmacy license' : 'identity document (18+ proof)'
      toast.error(`Please upload your ${docType}`)
      return
    }

    setLoading(true)

    try {
      // In production, this would upload the file to Supabase Storage
      // For MVP, we're mocking the upload
      const documentData = {
        fileName: documentFile.name,
        fileSize: documentFile.size,
        fileType: documentFile.type
      }

      const response = await fetch('/api/auth/operator/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          documentFile: documentData 
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <Shield className="h-10 w-10 text-purple-600" />
            <span className="text-3xl font-bold text-purple-900">PharmaFlow</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Operator Registration</h2>
          <p className="text-gray-600 mt-2">Register as Pharmacist or Delivery Partner</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Operator Account</CardTitle>
            <CardDescription>Your account will be activated after admin verification</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="role">Select Role *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, role: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacist">
                      <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Pharmacist
                      </div>
                    </SelectItem>
                    <SelectItem value="delivery_boy">
                      <div className="flex items-center">
                        <Truck className="mr-2 h-4 w-4" />
                        Delivery Partner
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formData.role && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.role === 'pharmacist' 
                      ? 'You will need to upload a valid pharmacy license'
                      : 'You will need to upload an 18+ identity proof (Aadhaar/PAN)'}
                  </p>
                )}
              </div>

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
                    minLength={6}
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

              {formData.role && (
                <div>
                  <Label htmlFor="document">
                    {formData.role === 'pharmacist' 
                      ? 'Pharmacy License *' 
                      : 'Identity Document (18+ Proof) *'}
                  </Label>
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
                        required
                      />
                    </label>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    {formData.role === 'pharmacist'
                      ? '⚠️ Government-issued pharmacy license required for verification'
                      : '⚠️ Valid 18+ identity proof (Aadhaar/PAN/Driving License) required'}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !formData.role}>
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Already registered? </span>
              <Link href="/operator/login" className="text-purple-600 hover:underline font-medium">
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