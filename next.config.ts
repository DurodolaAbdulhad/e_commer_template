import type { NextConfig } from "next";

const securityHeaders = [
  // Fix 12: Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Paystack CDN + Google Tag Manager + Meta Pixel
      // 'unsafe-eval' only in dev — React needs it for dev tools; production never uses eval()
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://js.paystack.co https://checkout.flutterwave.com https://www.googletagmanager.com https://connect.facebook.net`,
      // Styles: self + inline (needed for Tailwind/Next.js)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + Supabase storage + Unsplash + Cloudinary + data URIs
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://images.unsplash.com https://plus.unsplash.com https://res.cloudinary.com https://lh3.googleusercontent.com",
      // API calls: self + Supabase + Paystack + Resend + Termii + Google Analytics
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.paystack.co https://api.resend.com https://v3.api.termii.com https://www.google-analytics.com https://analytics.google.com https://www.facebook.com",
      // Frames: Paystack uses iframes
      "frame-src https://js.paystack.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Upgrade insecure requests in production
      ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
    ].join('; '),
  },
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prevent MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions policy
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS (only in production)
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Standalone output for cPanel Node.js deployments. Vercel ignores this.
  ...(process.env.DEPLOY_TARGET === 'cpanel' ? { output: 'standalone' as const } : {}),
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Compress responses
  compress: true,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
