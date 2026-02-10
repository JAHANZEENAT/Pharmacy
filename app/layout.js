import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'PharmaFlow - Online Pharmacy Management',
  description: 'Complete pharmacy management system with customer orders, pharmacist management, and delivery tracking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}