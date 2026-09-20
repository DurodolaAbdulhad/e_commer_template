'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Tag, Image, Users,
  Settings, LogOut, ExternalLink, ChevronRight, ChevronDown, Mail, FileText, Ticket, Bell,
  Zap, Gift, Layers, RotateCcw, FileEdit, ShoppingCart, UserCog, UserCheck, LayoutList, SlidersHorizontal, Truck,
} from 'lucide-react'
import { useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

const NAVY   = '#1a2638'
const ACCENT = '#e84c3d'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
  children?: { href: string; label: string }[]
}

const NAV: NavItem[] = [
  { href: '/admin',             label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/products',    label: 'Products',    icon: Package,
    children: [
      { href: '/admin/products',      label: 'All Products' },
      { href: '/admin/products/new',  label: 'Add New'      },
      { href: '/admin/products/bulk', label: 'Bulk Edit'    },
    ] },
  { href: '/admin/orders',           label: 'Orders',          icon: ShoppingBag },
  { href: '/admin/customers',        label: 'Customers',       icon: UserCheck },
  { href: '/admin/draft-orders',     label: 'Draft Orders',    icon: FileEdit },
  { href: '/admin/returns',          label: 'Returns',         icon: RotateCcw },
  { href: '/admin/categories',       label: 'Categories',      icon: Tag },
  { href: '/admin/collections',      label: 'Collections',     icon: Layers },
  { href: '/admin/bundles',          label: 'Bundles',         icon: Package },
  { href: '/admin/homepage',         label: 'Homepage Layout', icon: LayoutList },
  { href: '/admin/shipping',         label: 'Shipping & Fulfillment', icon: Truck },
  { href: '/admin/banners',          label: 'Banners',         icon: Image },
  { href: '/admin/coupons',          label: 'Coupons',         icon: Ticket },
  { href: '/admin/auto-discounts',   label: 'Auto-Discounts',  icon: Zap },
  { href: '/admin/gift-cards',       label: 'Gift Cards',      icon: Gift },
  { href: '/admin/subscribers',      label: 'Subscribers',     icon: Mail },
  { href: '/admin/abandoned-carts',  label: 'Abandoned Carts', icon: ShoppingCart },
  { href: '/admin/back-in-stock',    label: 'Back-in-Stock',   icon: Bell },
  { href: '/admin/staff',            label: 'Staff & Roles',   icon: UserCog },
  { href: '/admin/blog',             label: 'Blog Posts',      icon: FileText },
]

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
  const hasChildren = item.children && item.children.length > 0
  const [open, setOpen] = useState(isActive)
  const Icon = item.icon

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={hasChildren ? '#' : item.href}
          onClick={hasChildren ? (e) => { e.preventDefault(); setOpen(o => !o) } : undefined}
          className="flex-1 flex items-center gap-3 px-4 py-2.5 text-sm transition-all group"
          style={{
            color:           isActive ? '#fff' : 'rgba(255,255,255,0.65)',
            fontWeight:      isActive ? 600 : 400,
            borderLeft:      isActive ? `3px solid ${ACCENT}` : '3px solid transparent',
            backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
          }}>
          <Icon size={16} style={{ color: isActive ? ACCENT : 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
          <span className="flex-1">{item.label}</span>
          {item.badge != null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: ACCENT, color: '#fff' }}>
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          )}
        </Link>
      </div>

      {hasChildren && open && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
          {item.children!.map(child => {
            const childActive = pathname === child.href
            return (
              <Link key={child.href} href={child.href}
                className="flex items-center pl-11 pr-4 py-2 text-xs transition-colors"
                style={{
                  color: childActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: childActive ? 600 : 400,
                  backgroundColor: childActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                }}>
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminSidebar() {
  const router = useRouter()
  const { signOut } = useAdmin()

  async function handleSignOut() {
    signOut()
    toast.success('Signed out of admin')
    router.push('/admin/login')
  }

  const words = client.name.trim().split(' ')
  const nameFront = words.slice(0, -1).join(' ')
  const nameBack  = words.length > 1 ? ' ' + words[words.length - 1] : ''

  return (
    <aside className="flex flex-col h-full" style={{ backgroundColor: NAVY }}>
      {/* Logo */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-black"
            style={{ backgroundColor: ACCENT }}>
            A
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none">
              {nameFront}<span style={{ color: ACCENT }}>{nameBack}</span>
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Main Menu
        </p>
        {NAV.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Bottom */}
      <div className="py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <NavLink item={{ href: '/admin/settings', label: 'Store Settings', icon: SlidersHorizontal }} />
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          <ExternalLink size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          View Store
        </Link>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-red-900/30"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          <LogOut size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
