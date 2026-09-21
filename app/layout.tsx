import type { Metadata } from "next";
import { Poppins, Bricolage_Grotesque } from "next/font/google";
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
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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
  const title = meta['site_title'] || client.seo.title
  const favicon = meta['site_favicon'] || null
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title,
    description: client.seo.description,
    icons: favicon ? [{ rel: 'icon', url: favicon }] : undefined,
    openGraph: {
      title,
      description: client.seo.description,
      images: [client.seo.ogImage],
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

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${poppins.variable} ${bricolage.variable}`}>
      <head>
        <style>{`
          :root {
            --brand-primary: ${brandPrimary};
            --brand-secondary: ${colors.secondary};
            --brand-accent: ${colors.accent};
            --brand-background: ${colors.background};
            --brand-text: ${colors.text};
            --brand-text-light: ${colors.textLight};
            --font-heading: var(--font-bricolage), system-ui, sans-serif;
            --font-body: var(--font-poppins), system-ui, sans-serif;
          }
        `}</style>
        {/* Flutterwave SDK */}
        {(client as any).paymentGateway === 'flutterwave' && (
          <Script src="https://checkout.flutterwave.com/v3.js" strategy="afterInteractive" />
        )}

        {/* Facebook / Meta Pixel */}
        {fbPixelId && (
          <script dangerouslySetInnerHTML={{ __html: `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${fbPixelId}');fbq('track','PageView');
          `}} />
        )}

        {/* Google Analytics 4 / Tag Manager */}
        {gaId && (
          <>
            <script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} async />
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');
            `}} />
          </>
        )}

        {/* TikTok Pixel */}
        {tiktokId && (
          <script dangerouslySetInnerHTML={{ __html: `
            !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktokId}');ttq.page();}(window,document,'ttq');
          `}} />
        )}

        {/* Microsoft Clarity — heatmaps & session recordings */}
        {clarityId && (
          <script dangerouslySetInnerHTML={{ __html: `
            (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");
          `}} />
        )}
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
