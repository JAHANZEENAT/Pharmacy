'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Truck, Building2, Shield, Clock, BadgeCheck } from 'lucide-react'

const Home = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Redirect to appropriate dashboard if logged in
    if (user) {
      switch (user.role) {
        case 'customer':
          router.push('/customer/shop')
          break
        case 'pharmacist':
          router.push('/pharmacist/dashboard')
          break
        case 'delivery_boy':
          router.push('/delivery/dashboard')
          break
        case 'admin':
          router.push('/admin/dashboard')
          break
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-900">PharmaFlow</h1>
          </div>
          <div className="flex space-x-4">
            <Link href="/customer/login">
              <Button variant="ghost">Customer Login</Button>
            </Link>
            <Link href="/operator/login">
              <Button variant="ghost">Operator Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Your Trusted Online Pharmacy
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Order medicines online with prescription verification, fast delivery, and secure payments.
            Your health, our priority.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/customer/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
            <Link href="/pharmacy/register">
              <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <Building2 className="mr-2 h-5 w-5" />
                Join as Pharmacy
              </Button>
            </Link>
            <Link href="/delivery/register">
              <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Truck className="mr-2 h-5 w-5" />
                Join as Delivery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose PharmaFlow?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <BadgeCheck className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Verified Medicines</CardTitle>
              <CardDescription>
                All medicines are verified for quality and authenticity. Prescription validation included.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Fast Delivery</CardTitle>
              <CardDescription>
                Same-day delivery available. Track your order in real-time with live location updates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your medical data is encrypted and secure. We prioritize your privacy above all.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Browse Medicines</h4>
              <p className="text-sm text-gray-600">Search from thousands of verified medicines</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Upload Prescription</h4>
              <p className="text-sm text-gray-600">Upload your prescription for verification</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Secure Payment</h4>
              <p className="text-sm text-gray-600">Pay via UPI, Card, or Cash on Delivery</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Track & Receive</h4>
              <p className="text-sm text-gray-600">Track your order and receive at doorstep</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Operators */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Join as an Operator</h3>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardHeader>
              <Building2 className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Pharmacists</CardTitle>
              <CardDescription>
                Register your pharmacy, manage inventory, verify prescriptions, and grow your business online.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/pharmacy/register">
                <Button className="w-full">Register Pharmacy</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-500 transition-colors">
            <CardHeader>
              <Truck className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Delivery Partners</CardTitle>
              <CardDescription>
                Earn by delivering medicines. Flexible hours, good earnings, and be part of healthcare.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/delivery/register">
                <Button className="w-full" variant="outline">Join as Delivery Partner</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left mb-8">
            <div>
              <h4 className="font-bold text-lg mb-4">PharmaFlow</h4>
              <p className="text-gray-400 text-sm">Your trusted partner for healthcare and medicine delivery. Licensed and certified pharmacy network.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><Link href="/customer/register" className="hover:text-blue-400">Join as Customer</Link></li>
                <li><Link href="/pharmacy/register" className="hover:text-blue-400">Partner with Us</Link></li>
                <li><Link href="/delivery/register" className="hover:text-blue-400">Drive with Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Portal Access</h4>
              <div className="flex flex-col space-y-2 text-sm text-gray-400">
                <Link href="/customer/login" className="hover:text-blue-400">Customer Portal</Link>
                <Link href="/operator/login" className="hover:text-blue-400">Operator Portal</Link>
                <Link href="/admin/login" className="hover:text-slate-500 text-xs mt-4">System Administration</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-xs">© 2025 PharmaFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home