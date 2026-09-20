'use client'

import { createContext, useContext, useReducer, useEffect, useState } from 'react'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.id === action.item.id && i.variant === action.item.variant
      )
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id && i.variant === action.item.variant
              ? { ...i, quantity: i.quantity + (action.item.quantity || 1) }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: action.item.quantity || 1 }] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => !(i.id === action.id && i.variant === action.variant)) }
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id && i.variant === action.variant ? { ...i, quantity: action.quantity } : i
        ),
      }
    case 'CLEAR_CART':
      return { items: [] }
    case 'LOAD_CART':
      return { items: action.items }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart')
      if (saved) dispatch({ type: 'LOAD_CART', items: JSON.parse(saved) })
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem('cart', JSON.stringify(state.items))
  }, [state.items, loaded])

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items: state.items, subtotal, itemCount, dispatch, loaded }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
