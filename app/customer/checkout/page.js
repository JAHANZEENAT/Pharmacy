'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Upload, CreditCard, Smartphone, Banknote, FileText, AlertCircle, ShoppingBag, MapPin, Shield } from 'lucide-react'
import Link from 'next/link'

export default function CustomerCheckout() {
  const { user, getToken } = useAuth()
  const { cart, prescriptions, clearCart, addPrescription, removePrescription } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [uploadedFiles, setUploadedFiles] = useState([])

  const requiresPrescription = cart.some(item => item.prescriptionRequired)
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      router.push('/customer/login')
      return
    }
    if (cart.length === 0) {
      router.push('/customer/shop')
      return
    }
  }, [user, cart, router])

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setUploadedFiles(prev => [...prev, file])
      toast.success(`Prescription uploaded: ${file.name}`)
    })
  }

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error('Please enter delivery address')
      return
    }

    if (requiresPrescription && uploadedFiles.length === 0) {
      toast.error('Please upload prescription for medicines that require it')
      return
    }

    setLoading(true)

    try {
      const token = getToken()
      const response = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            medicineId: item.medicineId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            prescriptionRequired: item.prescriptionRequired
          })),
          deliveryAddress: address,
          paymentMethod,
          prescriptionUrls: uploadedFiles.map(f => `/mock-prescriptions/${f.name}`),
          totalAmount: total
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Order placed successfully!')
        clearCart()
        router.push(`/customer/orders/${data.orderId}`)
      } else {
        toast.error(data.error || 'Failed to place order')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user || cart.length === 0) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/customer/shop" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-900">PharmaFlow</h1>
          </Link>
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-gray-600" />
            <span className="font-semibold">Checkout</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your complete delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-24"
                />
              </CardContent>
            </Card>

            {/* Prescription Upload */}
            {requiresPrescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Upload Prescription
                  </CardTitle>
                  <CardDescription>
                    Some items in your cart require a valid prescription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4 border-amber-300 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Required:</strong> Upload prescription images or PDF for medicines marked with "Rx Required"
                    </AlertDescription>
                  </Alert>

                  <label htmlFor="prescription" className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Click to upload prescription
                      </span>
                      <span className="block text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG (Max 5MB each)
                      </span>
                    </div>
                    <input
                      id="prescription"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Uploaded Files:</p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm text-green-800">{file.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5 mr-2 text-purple-600" />
                      <div>
                        <p className="font-medium">UPI</p>
                        <p className="text-xs text-gray-500">Pay via UPI apps (PhonePe, GPay, Paytm)</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                      <div>
                        <p className="font-medium">Debit/Credit Card</p>
                        <p className="text-xs text-gray-500">Visa, Mastercard, Rupay</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center cursor-pointer flex-1">
                      <Banknote className="h-5 w-5 mr-2 text-green-600" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-xs text-gray-500">Pay when you receive</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <Alert className="mt-4 border-blue-200 bg-blue-50">
                  <AlertDescription className="text-sm text-blue-800">
                    <strong>Note:</strong> Payment processing is mocked for MVP. Razorpay integration ready.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.medicineId} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{total}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Delivery</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">₹{total}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading || !address.trim() || (requiresPrescription && uploadedFiles.length === 0)}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}