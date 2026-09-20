'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ADMIN_KEY = 'admin_session'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [admin,   setAdmin]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore UI state from localStorage (cookie is the real auth guard)
    try {
      const saved = localStorage.getItem(ADMIN_KEY)
      if (saved) setAdmin(JSON.parse(saved))
    } catch {}
    setLoading(false)
  }, [])

  const signIn = useCallback(async (password) => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Incorrect password')
    }
    const session = { role: 'admin', loggedInAt: new Date().toISOString() }
    localStorage.setItem(ADMIN_KEY, JSON.stringify(session))
    setAdmin(session)
    return session
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {})
    localStorage.removeItem(ADMIN_KEY)
    setAdmin(null)
  }, [])

  return (
    <AdminContext.Provider value={{ admin, loading, signIn, signOut }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
