'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Heart, User, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const NAVY   = '#1a2638'

const navItems = [
  { href: '/account',          label: 'Account Dashboard', icon: LayoutDashboard },
  { href: '/account/orders',   label: 'My Orders',         icon: ShoppingBag },
  { href: '/account/wishlist', label: 'My Wishlist',       icon: Heart },
  { href: '/account/profile',  label: 'My Profile',        icon: User },
]

export default function AccountSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, signOut } = useAuth()

  const name  = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer'
  const email = user?.email || ''
  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    router.push('/')
  }

  return (
    <aside className="w-full md:w-56 shrink-0">
      {/* User card */}
      <div className="rounded-lg overflow-hidden mb-3" style={{ backgroundColor: NAVY }}>
        <div className="px-4 py-5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
            style={{ backgroundColor: ACCENT }}>
            {initials || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{name}</p>
            <p className="text-blue-200 text-xs truncate opacity-75">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
        {navItems.map(({ href, label, icon: Icon }, i) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-0 group"
              style={{
                color:           active ? ACCENT : '#444',
                fontWeight:      active ? 600 : 400,
                borderLeft:      active ? `3px solid ${ACCENT}` : '3px solid transparent',
                backgroundColor: active ? '#fff5f5' : '#fff',
              }}>
              <Icon size={15} style={{ color: active ? ACCENT : '#9ca3af' }} />
              <span className="flex-1">{label}</span>
              <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300" />
            </Link>
          )
        })}
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
          style={{ borderLeft: '3px solid transparent' }}>
          <LogOut size={15} className="text-gray-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
