'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, ShoppingCart, Pill, FileText, AlertCircle, Plus, Minus, Trash2, LogOut, User, Package, Shield } from 'lucide-react'
import Link from 'next/link'

export default function CustomerShop() {
  const { user, logout, loading: authLoading } = useAuth()
  const { cart, addToCart, removeFromCart, updateQuantity, getTotal, prescriptions, addPrescription } = useCart()
  const [medicines, setMedicines] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'customer') {
      router.push('/customer/login')
      return
    }
    fetchMedicines()
  }, [user, authLoading, router])

  const fetchMedicines = async (search = '') => {
    try {
      const url = search
        ? `/api/medicines?search=${encodeURIComponent(search)}`
        : '/api/medicines'

      const response = await fetch(url)
      const data = await response.json()
      setMedicines(data.medicines || [])
    } catch (error) {
      toast.error('Failed to load medicines')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchMedicines(searchQuery)
  }

  const handleAddToCart = (medicine) => {
    addToCart(medicine, 1)
    toast.success(`${medicine.name} added to cart`)
  }

  const handleProceedToCheckout = () => {
    // Check if any medicine requires prescription
    const requiresPrescription = cart.some(item => item.prescriptionRequired)

    if (requiresPrescription && prescriptions.length === 0) {
      toast.error('Please upload prescription for medicines that require it')
      return
    }

    router.push('/customer/checkout')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-900">PharmaFlow</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/customer/orders">
              <Button variant="ghost" size="sm">
                <Package className="h-4 w-4 mr-2" />
                My Orders
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setCartOpen(true)} className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search medicines by name, manufacturer, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6"
              />
            </div>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
        </div>

        {/* Medicine Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading medicines...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No medicines found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {medicines.map((medicine) => (
              <Card key={medicine.medicineId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-square bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                    {medicine.imageUrl ? (
                      <img src={medicine.imageUrl} alt={medicine.name} className="h-full w-full object-cover rounded-md" />
                    ) : (
                      <Pill className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{medicine.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {medicine.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="text-lg font-bold text-blue-600">₹{medicine.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock</span>
                      <span className={`text-sm font-medium ${medicine.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {medicine.stock > 0 ? `${medicine.stock} available` : 'Out of stock'}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {medicine.prescriptionRequired && (
                        <Badge variant="destructive" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Rx Required
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {medicine.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(medicine)}
                    disabled={medicine.stock === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Cart Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
            <DialogDescription>
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
            </DialogDescription>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.medicineId} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-600">₹{item.price} each</p>
                    {item.prescriptionRequired && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        <FileText className="h-3 w-3 mr-1" />
                        Prescription Required
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.medicineId, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{item.price * item.quantity}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeFromCart(item.medicineId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {cart.some(item => item.prescriptionRequired) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900">Prescription Required</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Some items in your cart require a valid prescription. You'll need to upload it during checkout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">₹{getTotal()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCartOpen(false)}>
              Continue Shopping
            </Button>
            <Button
              onClick={handleProceedToCheckout}
              disabled={cart.length === 0}
            >
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}