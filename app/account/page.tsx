'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Heart, User, Package, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import { getCustomerOrders } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'
import { client } from '@/config/client'

const ACCENT = client.colors.primary
const NAVY   = '#1a2638'

export default function AccountDashboard() {
  const { user } = useAuth()
  const { items: wishlistItems } = useWishlist()
  const [orders,  setOrders]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return
    setLoading(true)
    getCustomerOrders(user.email)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [user?.email])

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer'

  const stats = [
    { label: 'Total Orders',   value: orders.length,                                                           icon: ShoppingBag, href: '/account/orders'   },
    { label: 'Wishlist Items', value: wishlistItems.length,                                                     icon: Heart,        href: '/account/wishlist' },
    { label: 'Pending',        value: orders.filter(o => !o.status || o.status === 'pending').length,           icon: Package,      href: '/account/orders'   },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="rounded-lg px-5 py-5 mb-5 text-white" style={{ backgroundColor: NAVY }}>
        <p className="text-xs text-blue-200 mb-0.5">Welcome back,</p>
        <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{name}</h2>
        <p className="text-xs text-blue-200 mt-1 opacity-75">
          From your account dashboard you can track orders, manage your wishlist, and update your profile.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}
            className="bg-white border border-gray-100 rounded-lg p-4 text-center hover:shadow-sm transition-shadow group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: `${ACCENT}15` }}>
              <Icon size={18} style={{ color: ACCENT }} />
            </div>
            <p className="text-xl font-bold text-gray-800">
              {loading ? <span className="text-gray-300">—</span> : value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 group-hover:underline transition-colors">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Recent Orders</h3>
          <Link href="/account/orders" className="text-xs font-medium hover:underline" style={{ color: ACCENT }}>
            View all
          </Link>
        </div>
        {loading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <ShoppingBag size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">You haven't placed any orders yet.</p>
            <Link href="/shop" className="inline-block mt-3 text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
              Start shopping →
            </Link>
          </div>
        ) : (
          <div>
            {orders.slice(0, 3).map(order => {
              const ref    = order.payment_reference || order.id || ''
              const status = order.status || 'pending'
              const date   = (order.created_at || order.createdAt)
                ? new Date(order.created_at || order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                : ''
              return (
                <Link key={order.id || ref} href={`/account/orders/${order.id || ref}`}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{ref || order.id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(order.items?.length ?? order.cart?.length ?? 0)} item{((order.items?.length ?? order.cart?.length ?? 0)) !== 1 ? 's' : ''} · {date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold" style={{ color: ACCENT }}>{formatPrice(order.total ?? 0)}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: status === 'delivered' ? '#f0fdf4' : `${ACCENT}15`,
                        color:           status === 'delivered' ? '#16a34a' : ACCENT,
                      }}>
                      {status}
                    </span>
                    <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Link href="/account/profile"
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3.5 hover:shadow-sm transition-shadow group">
          <User size={16} style={{ color: ACCENT }} />
          <div>
            <p className="text-xs font-semibold text-gray-700 group-hover:underline transition-colors">Edit Profile</p>
            <p className="text-[10px] text-gray-400">Update name, email, address</p>
          </div>
        </Link>
        <Link href="/account/wishlist"
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3.5 hover:shadow-sm transition-shadow group">
          <Heart size={16} style={{ color: ACCENT }} />
          <div>
            <p className="text-xs font-semibold text-gray-700 group-hover:underline transition-colors">My Wishlist</p>
            <p className="text-[10px] text-gray-400">{wishlistItems.length} saved item{wishlistItems.length !== 1 ? 's' : ''}</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
