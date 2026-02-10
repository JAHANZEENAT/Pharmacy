'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext({})

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [prescriptions, setPrescriptions] = useState([])

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  const addToCart = (medicine, quantity = 1) => {
    const newCart = [...cart]
    const existing = newCart.find(item => item.medicineId === medicine.medicineId)
    
    if (existing) {
      existing.quantity += quantity
    } else {
      newCart.push({ ...medicine, quantity })
    }
    
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const removeFromCart = (medicineId) => {
    const newCart = cart.filter(item => item.medicineId !== medicineId)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const updateQuantity = (medicineId, quantity) => {
    const newCart = cart.map(item => 
      item.medicineId === medicineId ? { ...item, quantity } : item
    )
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('cart')
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const addPrescription = (file) => {
    setPrescriptions([...prescriptions, file])
  }

  const removePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index))
  }

  return (
    <CartContext.Provider value={{
      cart,
      prescriptions,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      addPrescription,
      removePrescription
    }}>
      {children}
    </CartContext.Provider>
  )
}