'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface CompareItem {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number
  images?: string[]
  brand?: string
  rating?: number
  review_count?: number
  stock?: number
  description?: string
  category_id?: string
  sku?: string
}

interface CompareCtx {
  items:    CompareItem[]
  add:      (p: CompareItem) => void
  remove:   (id: string) => void
  clear:    () => void
  has:      (id: string) => boolean
  count:    number
}

const Ctx = createContext<CompareCtx>({
  items: [], add: () => {}, remove: () => {}, clear: () => {}, has: () => false, count: 0,
})

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([])

  const add = useCallback((p: CompareItem) => {
    setItems(prev => {
      if (prev.find(x => x.id === p.id)) return prev
      if (prev.length >= 4) return prev
      return [...prev, p]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(x => x.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const has   = useCallback((id: string) => items.some(x => x.id === id), [items])

  return (
    <Ctx.Provider value={{ items, add, remove, clear, has, count: items.length }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCompare() { return useContext(Ctx) }
