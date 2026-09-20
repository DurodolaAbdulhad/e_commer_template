import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import HeroBanner from '@/components/home/HeroBanner'
import TrustBadges from '@/components/home/TrustBadges'
import CategoryGrid from '@/components/home/CategoryGrid'
import FlashDeals from '@/components/home/FlashDeals'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import MidPromoBanner from '@/components/home/MidPromoBanner'
import NewArrivals from '@/components/home/NewArrivals'
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

  return (
    <>
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
