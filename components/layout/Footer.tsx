'use client'

import Link from 'next/link'
import { client } from '@/config/client'
import NewsletterForm from '@/components/ui/NewsletterForm'

const W = '1200px'
const inner = {
  maxWidth: W,
  margin: '0 auto',
  padding: '0 24px',
}

/* ─── Social SVGs ─── */
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}
function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

const colHead: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: '#333',
  marginBottom: '20px',
}

const linkStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: '#666',
  textDecoration: 'none',
  marginBottom: '10px',
  transition: 'color 0.15s',
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: '#fff', borderTop: '3px solid #1a2638', width: '100%' }}>

      {/* ── Main columns ── */}
      <div style={{ ...inner }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 py-10 md:py-12">

          {/* Col 1 — Quick Links */}
          <div>
            <p style={colHead}>Quick Links</p>
            {[
              { label: 'Support Center',   href: '/pages/support' },
              { label: 'Policy',           href: '/pages/privacy' },
              { label: 'Term & Conditions', href: '/pages/terms' },
              { label: 'Shipping',         href: '/pages/shipping' },
              { label: 'Return',           href: '/pages/returns' },
              { label: 'FAQs',             href: '/pages/faq' },
            ].map(l => (
              <Link
                key={l.href} href={l.href} style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = '#e84c3d')}
                onMouseLeave={e => (e.currentTarget.style.color = '#666')}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Col 2 — Company */}
          <div>
            <p style={colHead}>Company</p>
            {[
              { label: 'About Us',   href: '/pages/about' },
              { label: 'Our Team',   href: '/pages/team' },
              { label: 'Careers',    href: '/pages/careers' },
              { label: 'Contact Us', href: '/pages/contact' },
              { label: 'Affiliate',  href: '/pages/affiliate' },
            ].map(l => (
              <Link
                key={l.href} href={l.href} style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = '#e84c3d')}
                onMouseLeave={e => (e.currentTarget.style.color = '#666')}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Col 3 — Business */}
          <div>
            <p style={colHead}>{client.name} Business</p>
            {[
              { label: 'Sell on ' + client.name, href: '/pages/sell' },
              { label: 'Advertise With Us',       href: '/pages/advertise' },
              { label: 'Affiliate Program',       href: '/pages/affiliate' },
              { label: 'Partnership',             href: '/pages/partnership' },
            ].map(l => (
              <Link
                key={l.href} href={l.href} style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = '#e84c3d')}
                onMouseLeave={e => (e.currentTarget.style.color = '#666')}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Col 4 — Newsletter */}
          <div>
            <p style={colHead}>Newsletter</p>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px', lineHeight: 1.5 }}>
              Register now to get updates on promotions &amp; coupons
            </p>

            {/* Email subscribe */}
            <NewsletterForm source="footer" className="mb-5" />

            {/* Follow us */}
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: '10px' }}>
              Follow us
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {client.socials.twitter && (
                <a href={client.socials.twitter} target="_blank" rel="noopener noreferrer"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1DA1F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TwitterIcon />
                </a>
              )}
              {client.socials.facebook && (
                <a href={client.socials.facebook} target="_blank" rel="noopener noreferrer"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1877F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FacebookIcon />
                </a>
              )}
              {client.socials.instagram && (
                <a href={client.socials.instagram} target="_blank" rel="noopener noreferrer"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E4405F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <InstagramIcon />
                </a>
              )}
              {client.socials.youtube && (
                <a href={client.socials.youtube} target="_blank" rel="noopener noreferrer"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FF0000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <YoutubeIcon />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ backgroundColor: '#f5f5f5', borderTop: '1px solid #e8e8e8' }}>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:justify-between py-3 px-6" style={{ maxWidth: W, margin: '0 auto' }}>
          <p style={{ fontSize: '12px', color: '#888' }}>
            © {year} {client.name}. All Rights Reserved
          </p>

          {/* Payment badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span style={{ fontSize: '12px', color: '#888', marginRight: '4px' }}>Safe Payment:</span>
            {['Paystack', 'VISA', 'Mastercard', 'Verve', 'Bank Transfer'].map(pm => (
              <span key={pm} style={{
                fontSize: '10px', fontWeight: 700, color: '#555',
                border: '1px solid #ddd', borderRadius: '3px',
                padding: '2px 6px', backgroundColor: '#fff',
                letterSpacing: '0.3px',
              }}>
                {pm}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
