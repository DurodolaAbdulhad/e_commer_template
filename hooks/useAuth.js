'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const DEMO_KEY = 'demo_user'

function isReady() {
  return (
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('placeholder') &&
    SUPABASE_KEY.length > 20 &&
    !SUPABASE_KEY.includes('placeholder')
  )
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = isReady()
    ? createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
    : null

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
        setLoading(false)
      })
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null)
      })
      return () => subscription.unsubscribe()
    } else {
      // Demo mode: persist in localStorage
      try {
        const saved = localStorage.getItem(DEMO_KEY)
        if (saved) setUser(JSON.parse(saved))
      } catch {}
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setUser(data.user)
      return data.user
    }
    // Demo mode
    const demo = { id: 'demo', email, user_metadata: { full_name: email.split('@')[0] } }
    localStorage.setItem(DEMO_KEY, JSON.stringify(demo))
    setUser(demo)
    return demo
  }, [supabase])

  const signUp = useCallback(async (email, password, fullName) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
      setUser(data.user)
      return data.user
    }
    // Demo mode
    const demo = { id: 'demo', email, user_metadata: { full_name: fullName || email.split('@')[0] } }
    localStorage.setItem(DEMO_KEY, JSON.stringify(demo))
    setUser(demo)
    return demo
  }, [supabase])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    localStorage.removeItem(DEMO_KEY)
    setUser(null)
  }, [supabase])

  const updateProfile = useCallback(async (updates) => {
    if (supabase) {
      const { data, error } = await supabase.auth.updateUser({ data: updates })
      if (error) throw error
      setUser(data.user)
      return data.user
    }
    // Demo mode
    const updated = { ...user, user_metadata: { ...user?.user_metadata, ...updates } }
    localStorage.setItem(DEMO_KEY, JSON.stringify(updated))
    setUser(updated)
    return updated
  }, [supabase, user])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile, isDemoMode: !isReady() }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
