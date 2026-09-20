import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { Search } from 'lucide-react'
import SearchResults from '@/components/search/SearchResults'

export const revalidate = 0

function isSupabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return url.startsWith('https://') && !url.includes('placeholder') && key.length > 20 && !key.includes('placeholder')
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams

  // Demo mode — delegate all search to client component (localStorage)
  if (!isSupabaseReady()) {
    return (
      <>
        <Header />
        <PageBox>
          <SearchResults query={q ?? ''} serverProducts={[]} />
        </PageBox>
        <Footer />
        <WhatsAppButton />
      </>
    )
  }

  let products: any[] = []
  if (q) {
    try {
      const { createClient } = await import('@/lib/supabase-server')
      const supabase = await createClient()
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`)
        .order('is_featured', { ascending: false })
        .limit(40)
      products = data ?? []
    } catch {}
  }

  return (
    <>
      <Header />
      <PageBox>
        <SearchResults query={q ?? ''} serverProducts={products} />
      </PageBox>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
