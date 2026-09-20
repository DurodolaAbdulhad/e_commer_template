'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Heart, User, Menu, X, Phone, ChevronDown, ShoppingBag, MapPin, Package, Search } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { client } from '@/config/client'
import { industries } from '@/config/industries'
import CartDrawer from '@/components/cart/CartDrawer'
import SearchDropdown from '@/components/search/SearchDropdown'
import { getStoreSetting } from '@/lib/admin-db'

const H_BG     = (client as any).headerBg ?? '#1a2638'
const NAV_BG   = (client as any).headerBg ?? '#1e3045'
const ACCENT   = '#e84c3d'   // Martfury orange-red
const W        = '1200px'    // inner content width

const inner = {
  maxWidth: W,
  margin: '0 auto',
  padding: '0 24px',
  width: '100%',
  display: 'flex' as const,
  alignItems: 'center' as const,
}

export default function Header() {
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { user } = useAuth()
  const [menuOpen,       setMenuOpen]       = useState(false)
  const [cartOpen,       setCartOpen]       = useState(false)
  const [deptOpen,       setDeptOpen]       = useState(false)
  const [query,          setQuery]          = useState('')
  const [searchFocused,  setSearchFocused]  = useState(false)
  const [dynamicLogo,    setDynamicLogo]    = useState<string | null>(null)
  const [dynamicHeight,  setDynamicHeight]  = useState<number | null>(null)
  const [logoMode,       setLogoMode]       = useState<'image' | 'text'>('image')
  const [logoText,       setLogoText]       = useState<string | null>(null)
  const [logoTextSize,   setLogoTextSize]   = useState<number>(26)
  const [logoTextColor,  setLogoTextColor]  = useState<string>('#ffffff')
  const [logoTextWeight, setLogoTextWeight] = useState<string>('800')
  const [logoAccentWord, setLogoAccentWord] = useState<string>('')
  const [logoAccentColor,setLogoAccentColor]= useState<string>(ACCENT)
  const searchWrapRef = useRef<HTMLDivElement>(null)

  // Load logo from site_settings (overrides static config)
  useEffect(() => {
    getStoreSetting('logo_type').then((v: string | null)  => { if (v) setLogoMode(v as any) }).catch(() => {})
    getStoreSetting('logo').then((v: string | null)        => { if (v) setDynamicLogo(v) }).catch(() => {})
    getStoreSetting('logoHeight').then((v: string | null)  => { if (v) setDynamicHeight(Number(v)) }).catch(() => {})
    getStoreSetting('logo_text').then((v: string | null)   => { if (v) setLogoText(v) }).catch(() => {})
    getStoreSetting('logo_text_size').then((v: string | null)   => { if (v) setLogoTextSize(Number(v)) }).catch(() => {})
    getStoreSetting('logo_text_color').then((v: string | null)  => { if (v) setLogoTextColor(v) }).catch(() => {})
    getStoreSetting('logo_text_weight').then((v: string | null) => { if (v) setLogoTextWeight(v) }).catch(() => {})
    getStoreSetting('logo_accent_word').then((v: string | null) => { if (v) setLogoAccentWord(v) }).catch(() => {})
    getStoreSetting('logo_accent_color').then((v: string | null)=> { if (v) setLogoAccentColor(v) }).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const preset     = industries[client.industry as keyof typeof industries] ?? industries.general
  const categories = preset.categories

  // Split store name: white part + accent last word (mart·fury style)
  const words    = client.name.trim().split(' ')
  const nameFront = words.length > 1 ? words.slice(0, -1).join(' ') : words[0]
  const nameBack  = words.length > 1 ? ' ' + words[words.length - 1] : ''

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full" style={{ backgroundColor: H_BG }}>

        {/* ── UTILITY BAR ── */}
        <div style={{ backgroundColor: H_BG, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 0' }}>
          <div style={inner} className="justify-between">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Welcome to {client.name} Online Store!
            </span>
            <div className="hidden md:flex items-center text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <Link href="/pages/store-location" className="flex items-center gap-1 hover:text-white transition-colors px-3">
                <MapPin size={11} /> Store Location
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <Link href="/account/orders" className="flex items-center gap-1 hover:text-white transition-colors px-3">
                <Package size={11} /> Track Order
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span className="px-3">{client.currencySymbol} {client.currency}</span>
            </div>
          </div>
        </div>

        {/* ── MAIN ROW: Logo · Search · Icons ── */}
        <div style={{ backgroundColor: H_BG }}>
          <div style={{ ...inner, gap: '12px' }} className="py-3 md:py-4 gap-3 md:gap-5">

            {/* Logo — dynamic from site_settings, fallback to config, then text */}
            <Link href="/" className="shrink-0">
              {(() => {
                // ── Text logo mode ──
                if (logoMode === 'text') {
                  const label = logoText || client.name
                  if (logoAccentWord && label.includes(logoAccentWord)) {
                    const parts = label.split(logoAccentWord)
                    return (
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: logoTextWeight as any, fontSize: `${logoTextSize}px`, letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {parts[0] && <span style={{ color: logoTextColor }}>{parts[0]}</span>}
                        <span style={{ color: logoAccentColor }}>{logoAccentWord}</span>
                        {parts[1] && <span style={{ color: logoTextColor }}>{parts[1]}</span>}
                      </span>
                    )
                  }
                  return <span style={{ fontFamily: 'var(--font-heading)', fontWeight: logoTextWeight as any, fontSize: `${logoTextSize}px`, letterSpacing: '-0.5px', lineHeight: 1, color: logoTextColor }}>{label}</span>
                }

                // ── Image logo mode ──
                const logoSrc = dynamicLogo || (client as any).logo
                const h = dynamicHeight ?? (client as any).logoHeight ?? 48
                return logoSrc ? (
                  <div style={{ height: `${h}px`, display: 'flex', alignItems: 'center' }}>
                    <img
                      src={logoSrc}
                      alt={client.name}
                      style={{ height: `${h}px`, width: 'auto', display: 'block', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <span className="text-2xl md:text-[28px]" style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    color: '#fff',
                    lineHeight: 1,
                  }}>
                    {nameFront}
                    <span style={{ color: ACCENT }}>{nameBack}</span>
                  </span>
                )
              })()}
            </Link>

            {/* Search — minWidth:0 is required so flex-grow doesn't override flex-shrink:0 on icons */}
            <div ref={searchWrapRef} style={{ flex: '1 1 0', minWidth: 0, maxWidth: '620px', position: 'relative' }}>
              <form style={{ width: '100%' }} onSubmit={e => { handleSearch(e); setSearchFocused(false) }}>
                <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', height: '44px', width: '100%' }}>
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="I'm looking for..."
                    autoComplete="off"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '0 12px',
                      fontSize: '14px',
                      border: 'none',
                      outline: 'none',
                      color: '#333',
                      backgroundColor: '#fff',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0 20px',
                      backgroundColor: ACCENT,
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Search size={16} />
                    <span className="hidden md:inline">Search</span>
                  </button>
                </div>
              </form>
              {searchFocused && (
                <SearchDropdown
                  query={query}
                  onClose={() => setSearchFocused(false)}
                  onNavigate={() => { setSearchFocused(false); setQuery('') }}
                />
              )}
            </div>

            {/* Right icons — flex-shrink:0 prevents icons from being pushed off-screen on mobile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>

              {/* Wishlist — hidden on small screens to give search bar more room */}
              {client.features.wishlist && (
                <Link href="/account/wishlist" className="hidden sm:flex" style={{ position: 'relative', color: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={24} strokeWidth={1.5} />
                  {wishlistCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      backgroundColor: ACCENT, color: '#fff',
                      fontSize: '10px', fontWeight: 700,
                      width: '17px', height: '17px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                style={{ position: 'relative', color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ShoppingBag size={24} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    backgroundColor: ACCENT, color: '#fff',
                    fontSize: '10px', fontWeight: 700,
                    width: '17px', height: '17px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              {user ? (
                <Link href="/account" className="hidden md:flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: '#fff',
                  }}>
                    {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.user_metadata?.full_name?.split(' ')[0] || 'Account'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>My Account</div>
                  </div>
                </Link>
              ) : (
                <Link href="/auth/login" className="hidden md:flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
                  <User size={22} strokeWidth={1.5} />
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Log In</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>Register</div>
                  </div>
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                className="md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── NAV ROW ── */}
        <nav className="hidden md:block" style={{ backgroundColor: NAV_BG, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ ...inner, gap: 0 }}>

            {/* Shop By Department */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDeptOpen(!deptOpen)}
                onBlur={() => setTimeout(() => setDeptOpen(false), 180)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 20px 12px 0', marginRight: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Menu size={15} />
                Shop By Department
                <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: deptOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {deptOpen && (
                <div style={{
                  position: 'absolute', left: 0, top: '100%',
                  backgroundColor: '#fff', border: '1px solid #e5e7eb',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 100, minWidth: '220px', borderRadius: '0 0 6px 6px',
                }}>
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/category/${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      onClick={() => setDeptOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', color: '#444', fontSize: '13px',
                        textDecoration: 'none', borderBottom: '1px solid #f3f4f6',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                      onMouseLeave={e => (e.currentTarget.style.color = '#444')}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ccc', flexShrink: 0 }} />
                      {cat}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Nav links */}
            {[
              { label: 'Home',         href: '/' },
              { label: 'Shop',         href: '/shop' },
              { label: 'New Arrivals', href: '/shop?sort=newest' },
              { label: 'Best Sellers', href: '/shop?featured=true' },
              { label: 'Sale',         href: '/shop?sale=true' },
              { label: 'Collections',  href: '/shop/collections' },
              ...(client.features?.bundles ? [{ label: 'Bundles', href: '/bundles' }] : []),
              ...(client.features.blog ? [{ label: 'Blog', href: '/blog' }] : []),
            ].map(link => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  padding: '12px 16px', color: 'rgba(255,255,255,0.78)',
                  fontSize: '13px', fontWeight: 500, textDecoration: 'none',
                  whiteSpace: 'nowrap', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.78)')}
              >
                {link.label}
              </Link>
            ))}

            {/* Hotline */}
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
              color: 'rgba(255,255,255,0.65)', fontSize: '12px', whiteSpace: 'nowrap',
            }}>
              <Phone size={13} style={{ color: ACCENT }} />
              Hotline: <strong style={{ color: '#fff', marginLeft: '4px' }}>{client.phone}</strong>
            </div>
          </div>
        </nav>

        {/* ── Mobile menu overlay backdrop ── */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-[90] md:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            onClick={() => setMenuOpen(false)}
          />
        )}
      </header>

      {/* ── Mobile slide-in nav drawer ── */}
      <div
        className="fixed top-0 left-0 bottom-0 z-[100] md:hidden flex flex-col w-72 transition-transform duration-300"
        style={{
          backgroundColor: H_BG,
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: menuOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              {nameFront}<span style={{ color: ACCENT }}>{nameBack}</span>
            </span>
          </Link>
          <button onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <form onSubmit={e => { handleSearch(e); setMenuOpen(false) }} style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden' }}>
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search products…"
              style={{ flex: 1, padding: '9px 12px', fontSize: '13px', border: 'none', outline: 'none', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}
            />
            <button type="submit" style={{ padding: '0 14px', backgroundColor: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              Go
            </button>
          </form>
        </div>

        {/* Nav links */}
        <div className="overflow-y-auto flex-1 py-2">
          {[
            { label: 'Home',         href: '/' },
            { label: 'Shop All',     href: '/shop' },
            { label: 'New Arrivals', href: '/shop?sort=newest' },
            { label: 'Best Sellers', href: '/shop?featured=true' },
            { label: 'Sale',         href: '/shop?sale=true' },
            { label: 'Collections',  href: '/shop/collections' },
            ...(client.features?.bundles ? [{ label: 'Bundles', href: '/bundles' }] : []),
            ...(client.features.blog ? [{ label: 'Blog', href: '/blog' }] : []),
          ].map(link => (
            <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', padding: '11px 20px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {link.label}
            </Link>
          ))}

          {/* Divider + categories */}
          <p style={{ padding: '12px 20px 6px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Categories
          </p>
          {categories.map(cat => (
            <Link key={cat}
              href={`/shop?category=${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              onClick={() => setMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', color: 'rgba(255,255,255,0.65)', fontSize: '13px', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: ACCENT, flexShrink: 0 }} />
              {cat}
            </Link>
          ))}
        </div>

        {/* Bottom: account */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
          {user ? (
            <Link href="/account" onClick={() => setMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600 }}>{user.user_metadata?.full_name?.split(' ')[0] || 'My Account'}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>View account →</p>
              </div>
            </Link>
          ) : (
            <Link href="/auth/login" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: ACCENT }}>
              <User size={15} />
              Log In / Register
            </Link>
          )}
        </div>
      </div>

      {/* Cart drawer — outside header so it overlays everything */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
