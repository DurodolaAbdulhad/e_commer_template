'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import AccountSidebar from '@/components/account/AccountSidebar'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <>
        <Header />
        <PageBox>
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        </PageBox>
        <Footer />
      </>
    )
  }

  if (!user) return null

  return (
    <>
      <Header />
      <PageBox>
        <div className="px-4 sm:px-6 py-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-5">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight size={11} />
            <span className="text-gray-600 font-medium">My Account</span>
          </nav>

          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row gap-5">
            <AccountSidebar />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </PageBox>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
