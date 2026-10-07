'use client'

import Link from 'next/link'
import { ShoppingBag, Mail, CheckCircle } from 'lucide-react'
import { client } from '@/config/client'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'

const ACCENT = client.colors.primary
const NAVY   = '#1a2638'

const HOW_IT_WORKS = [
  { icon: ShoppingBag, text: 'Place an order — your email is all we need at checkout.' },
  { icon: Mail,        text: 'We automatically create your account and email you a login link.' },
  { icon: CheckCircle, text: 'Click the link to access your orders, track delivery, and manage returns.' },
]

export default function RegisterPage() {
  return (
    <>
      <Header />
      <PageBox>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Header */}
              <div className="px-6 py-5 text-white" style={{ backgroundColor: NAVY }}>
                <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  No sign-up needed
                </h1>
                <p className="text-blue-200 text-xs mt-0.5 opacity-75">
                  Your {client.name} account is created automatically
                </p>
              </div>

              <div className="px-6 py-6">
                <p className="text-sm text-gray-600 mb-5">
                  We don't do manual registration. Here's how it works:
                </p>

                <ol className="space-y-4 mb-6">
                  {HOW_IT_WORKS.map(({ icon: Icon, text }, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${ACCENT}15` }}>
                        <Icon size={14} style={{ color: ACCENT }} />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                    </li>
                  ))}
                </ol>

                <Link href="/shop"
                  className="block w-full py-2.5 text-white text-sm font-bold rounded-lg text-center transition-opacity hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}>
                  Start shopping →
                </Link>
              </div>

              <div className="px-6 pb-5 text-center border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400">
                  Already placed an order?{' '}
                  <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: ACCENT }}>
                    Sign in with your email
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
