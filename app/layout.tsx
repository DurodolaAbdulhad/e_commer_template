import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { AuthProvider } from "@/hooks/useAuth";
import { CompareProvider } from "@/hooks/useCompare";
import { client } from "@/config/client";
import { createClient } from "@/lib/supabase-server";
import QuickViewModal from "@/components/product/QuickViewModal";
import CompareBar from "@/components/compare/CompareBar";
import NewsletterPopup from "@/components/ui/NewsletterPopup";
import AbandonedCartTracker from "@/components/ui/AbandonedCartTracker";
import PageViewTracker from "@/components/ui/PageViewTracker";
import ServiceWorkerRegistration from "@/components/ui/ServiceWorkerRegistration";
import AiAssistant from "@/components/ui/AiAssistant";
import ComboBuilder from "@/components/ui/ComboBuilder";
import CookieConsent from "@/components/ui/CookieConsent";
import TrackingScripts from "@/components/ui/TrackingScripts";
import AgentRefCapture from "@/components/ui/AgentRefCapture";
import "./globals.css";


async function getSiteMeta() {
  try {
    const supabase = await createClient()
    const KEYS = [
      'store_site_title','store_site_favicon',
      'store_brand_color',
      'store_ga_id','store_fb_pixel','store_tiktok_pixel','store_clarity_id',
    ]
    const { data } = await supabase.from('site_settings').select('id,value').in('id', KEYS)
    const map: Record<string, string> = {}
    data?.forEach((r: any) => {
      const key = r.id.replace(/^store_/, '')
      map[key] = typeof r.value === 'string' ? r.value : String(r.value ?? '')
    })
    return map
  } catch { return {} }
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getSiteMeta()
  const title       = meta['site_title'] || client.seo.title
  const description = client.seo.description
  const favicon     = meta['site_favicon'] || null
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const ogImage     = client.seo.ogImage.startsWith('http') ? client.seo.ogImage : `${siteUrl}${client.seo.ogImage}`

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${client.name}` },
    description,
    icons: favicon ? [{ rel: 'icon', url: favicon }] : undefined,
    alternates: { canonical: siteUrl },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: client.name,
      type: 'website',
      locale: 'en_NG',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { colors } = client;
  const meta = await getSiteMeta()

  const brandPrimary = meta['brand_color'] || colors.primary

  // Tracking IDs: admin settings override client config
  const gaId       = meta['ga_id']        || (client as any).tracking?.googleTagId   || ''
  const fbPixelId  = meta['fb_pixel']     || (client as any).tracking?.metaPixelId   || ''
  const tiktokId   = meta['tiktok_pixel'] || (client as any).tracking?.tiktokPixelId || ''
  const clarityId  = meta['clarity_id']   || ''

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: client.name,
    url: siteUrl,
    logo: (client as any).logo ? `${siteUrl}${(client as any).logo}` : siteUrl,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: client.phone || undefined,
      email: client.email || undefined,
      contactType: 'customer service',
      areaServed: 'NG',
      availableLanguage: 'English',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: client.address || 'Lagos',
      addressCountry: 'NG',
    },
    sameAs: [
      (client as any).socials?.instagram,
      (client as any).socials?.facebook,
      (client as any).socials?.twitter,
    ].filter(Boolean),
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: client.name,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([orgSchema, websiteSchema]) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --brand-primary: ${brandPrimary};
            --brand-secondary: ${colors.secondary};
            --brand-accent: ${colors.accent};
            --brand-background: ${colors.background};
            --brand-text: ${colors.text};
            --brand-text-light: ${colors.textLight};
            --font-heading: 'Bricolage Grotesque', system-ui, sans-serif;
            --font-body: 'Poppins', system-ui, sans-serif;
          }
        `}</style>
        {/* PWA theme color */}
        <meta name="theme-color" content={brandPrimary} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={client.name.split(' ')[0]} />
        {/* Flutterwave SDK */}
        {(client as any).paymentGateway === 'flutterwave' && (
          <Script src="https://checkout.flutterwave.com/v3.js" strategy="afterInteractive" />
        )}

        {/* Tracking scripts are loaded client-side after cookie consent (NDPA 2023) */}
      </head>
      {/* Gray body — Header/Footer extend full width, page content is boxed per-page */}
      <body
        className="antialiased"
        style={{ backgroundColor: '#f0f0f0', fontFamily: 'var(--font-body)' }}
      >
        <AuthProvider>
        <CartProvider>
          <WishlistProvider>
          <CompareProvider>
            {children}
            <QuickViewModal />
            <CompareBar />
            <NewsletterPopup />
            <AbandonedCartTracker />
            <PageViewTracker />
            <ServiceWorkerRegistration />
            <AiAssistant />
            <ComboBuilder />
            <TrackingScripts fbPixelId={fbPixelId || undefined} gaId={gaId || undefined} tiktokId={tiktokId || undefined} clarityId={clarityId || undefined} />
            <CookieConsent />
            <Suspense fallback={null}><AgentRefCapture /></Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#1f2937",
                  color: "#f9fafb",
                  borderRadius: "8px",
                  fontSize: "14px",
                },
              }}
            />
          </CompareProvider>
          </WishlistProvider>
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
