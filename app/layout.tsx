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
    const { data } = await supabase.from('site_settings').select('id,value').in('id', ['site_title','site_favicon'])
    const map: Record<string, string> = {}
    data?.forEach((r: any) => { map[r.id] = typeof r.value === 'string' ? r.value : String(r.value) })
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { colors } = client;

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${poppins.variable} ${bricolage.variable}`}>
      <head>
        <style>{`
          :root {
            --brand-primary: ${colors.primary};
            --brand-secondary: ${colors.secondary};
            --brand-accent: ${colors.accent};
            --brand-background: ${colors.background};
            --brand-text: ${colors.text};
            --brand-text-light: ${colors.textLight};
            --font-heading: var(--font-bricolage), system-ui, sans-serif;
            --font-body: var(--font-poppins), system-ui, sans-serif;
          }
        `}</style>
        {/* Flutterwave SDK — only loaded when gateway is flutterwave */}
        {(client as any).paymentGateway === 'flutterwave' && (
          <Script src="https://checkout.flutterwave.com/v3.js" strategy="afterInteractive" />
        )}

        {/* Meta Pixel */}
        {client.tracking?.metaPixelId && (
          <script dangerouslySetInnerHTML={{ __html: `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${client.tracking.metaPixelId}');fbq('track','PageView');
          `}} />
        )}

        {/* Google Tag */}
        {client.tracking?.googleTagId && (
          <>
            <script src={`https://www.googletagmanager.com/gtag/js?id=${client.tracking.googleTagId}`} async />
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${client.tracking.googleTagId}');
            `}} />
          </>
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
