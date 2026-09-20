'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { saveAbandonedCart } from '@/lib/admin-db'

// Saves cart to DB when a logged-in user has items but hasn't checked out.
// Debounced 90 seconds — only fires after cart stops changing.
export default function AbandonedCartTracker() {
  const { items } = useCart() as any
  const { user }  = useAuth() as any
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user?.email || !items?.length) return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      saveAbandonedCart({
        email:    user.email,
        name:     user.user_metadata?.full_name ?? user.email.split('@')[0],
        items,
        subtotal: items.reduce((s: number, i: any) => s + i.price * i.quantity, 0),
      }).catch(() => {})
    }, 90_000)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [items, user])

  return null
}
