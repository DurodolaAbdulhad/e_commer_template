import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import HeroBanner from '@/components/home/HeroBanner'
import { client } from '@/config/client'
import TrustBadges from '@/components/home/TrustBadges'
import CategoryGrid from '@/components/home/CategoryGrid'
import FlashDeals from '@/components/home/FlashDeals'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import MidPromoBanner from '@/components/home/MidPromoBanner'
import NewArrivals from '@/components/home/NewArrivals'
import ComboDeals from '@/components/home/ComboDeals'
import Newsletter from '@/components/home/Newsletter'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { createClient, isSupabaseReady } from '@/lib/supabase-server'

type Section = { id: string; visible: boolean }

const DEFAULT_SECTIONS: Section[] = [
  { id: 'hero',         visible: true },
  { id: 'trust',        visible: true },
  { id: 'categories',   visible: true },
  { id: 'flash',        visible: true },
  { id: 'featured',     visible: true },
  { id: 'promo',        visible: true },
  { id: 'new_arrivals', visible: true },
  { id: 'combos',       visible: true },
  { id: 'newsletter',   visible: true },
]

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  hero:         HeroBanner,
  trust:        TrustBadges,
  categories:   CategoryGrid,
  flash:        FlashDeals,
  featured:     FeaturedProducts,
  promo:        MidPromoBanner,
  new_arrivals: NewArrivals,
  combos:       ComboDeals,
  newsletter:   Newsletter,
}

async function fetchSections(): Promise<Section[]> {
  if (!isSupabaseReady()) return DEFAULT_SECTIONS
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('id', 'homepage_sections')
      .single()
    return (data?.value as Section[]) ?? DEFAULT_SECTIONS
  } catch {
    return DEFAULT_SECTIONS
  }
}

export default async function HomePage() {
  const sections = await fetchSections()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: client.seo.title,
        description: client.seo.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/shop?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: client.name,
        url: siteUrl,
        logo: `${siteUrl}${client.logo}`,
        contactPoint: { '@type': 'ContactPoint', telephone: client.phone, contactType: 'customer service', areaServed: 'NG' },
        address: { '@type': 'PostalAddress', streetAddress: client.address, addressLocality: 'Lagos', addressCountry: 'NG' },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />
      <PageBox>
        <main>
          {sections
            .filter(s => s.visible)
            .map(s => {
              const Component = SECTION_COMPONENTS[s.id]
              return Component ? <Component key={s.id} /> : null
            })}
        </main>
      </PageBox>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
