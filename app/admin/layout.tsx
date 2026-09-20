'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminProvider, useAdmin } from '@/hooks/useAdmin'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'
import { Toaster } from 'react-hot-toast'

function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdmin()
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !admin && pathname !== '/admin/login') {
      router.replace('/admin/login')
    }
  }, [admin, loading, pathname, router])

  if (pathname === '/admin/login') return <>{children}</>

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f6fa' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f5f6fa' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 md:z-auto h-full
        transition-transform duration-200 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ width: '220px', flexShrink: 0 }}>
        <AdminSidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { background: '#1f2937', color: '#f9fafb', borderRadius: '8px', fontSize: '14px' },
      }} />
    </AdminProvider>
  )
}
