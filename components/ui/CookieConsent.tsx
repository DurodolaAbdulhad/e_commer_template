'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { client } from '@/config/client'

const STORAGE_KEY = 'cookie_consent'

type Consent = {
  necessary: true
  analytics: boolean
  marketing: boolean
  timestamp: string
}

function loadConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveConsent(c: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    window.dispatchEvent(new Event('cookie-consent-update'))
  } catch {}
}

export default function CookieConsent() {
  const [visible,   setVisible]   = useState(false)
  const [managing,  setManaging]  = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = loadConsent()
    if (!existing) {
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    function onOpenSettings() {
      const existing = loadConsent()
      if (existing) {
        setAnalytics(existing.analytics)
        setMarketing(existing.marketing)
      }
      setVisible(true)
      setManaging(true)
    }
    window.addEventListener('open-cookie-settings', onOpenSettings)
    return () => window.removeEventListener('open-cookie-settings', onOpenSettings)
  }, [])

  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true, timestamp: new Date().toISOString() })
    setVisible(false)
  }

  function decline() {
    saveConsent({ necessary: true, analytics: false, marketing: false, timestamp: new Date().toISOString() })
    setVisible(false)
  }

  function savePreferences() {
    saveConsent({ necessary: true, analytics, marketing, timestamp: new Date().toISOString() })
    setVisible(false)
    setManaging(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop when managing */}
      {managing && (
        <div
          className="fixed inset-0 bg-black/40 z-[998]"
          onClick={() => setManaging(false)}
        />
      )}

      {/* Preferences panel */}
      {managing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-white rounded-2xl shadow-2xl z-[999] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">Cookie Preferences</h2>
            <button onClick={() => setManaging(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Under the Nigeria Data Protection Act (NDPA) 2023, you have the right to control how your data is used.
            Necessary cookies keep the site working. All others require your consent.
          </p>

          {/* Necessary */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-700">Necessary</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Cart, checkout, authentication. Required for the site to function.</p>
            </div>
            <div className="w-9 h-5 rounded-full bg-gray-300 relative flex-shrink-0 cursor-not-allowed opacity-60">
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-700">Analytics</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Google Analytics, Microsoft Clarity — help us understand how visitors use the site.</p>
            </div>
            <button
              onClick={() => setAnalytics(a => !a)}
              className="w-9 h-5 rounded-full transition-colors relative flex-shrink-0"
              style={{ backgroundColor: analytics ? '#16a34a' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 transition-all w-4 h-4 bg-white rounded-full shadow"
                style={{ left: analytics ? '18px' : '2px' }}
              />
            </button>
          </div>

          {/* Marketing */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-700">Marketing</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Meta Pixel, TikTok Pixel — used for personalised ads and conversion tracking.</p>
            </div>
            <button
              onClick={() => setMarketing(m => !m)}
              className="w-9 h-5 rounded-full transition-colors relative flex-shrink-0"
              style={{ backgroundColor: marketing ? '#16a34a' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 transition-all w-4 h-4 bg-white rounded-full shadow"
                style={{ left: marketing ? '18px' : '2px' }}
              />
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={savePreferences}
              className="flex-1 py-2.5 text-xs font-bold text-white rounded-lg"
              style={{ backgroundColor: '#e84c3d' }}
            >
              Save Preferences
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 py-2.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Accept All
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            You can update these preferences at any time from our{' '}
            <Link href="/pages/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      )}

      {/* Main banner */}
      {!managing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-[999] bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">🍪</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800 mb-0.5">
                {client.name} uses cookies
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                We use necessary cookies to run this site, and optional analytics and marketing cookies to improve your experience.
                Under Nigeria&apos;s Data Protection Act (NDPA 2023), you control how your data is used.{' '}
                <Link href="/pages/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 justify-end">
            <button
              onClick={decline}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => setManaging(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Manage
            </button>
            <button
              onClick={acceptAll}
              className="text-xs font-bold px-4 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#e84c3d' }}
            >
              Accept All
            </button>
          </div>
        </div>
      )}
    </>
  )
}
