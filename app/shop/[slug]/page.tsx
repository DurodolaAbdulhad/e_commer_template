import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import ProductDetailClient from '@/components/product/ProductDetailClient'
import ProductDetailDemo from '@/components/product/ProductDetailDemo'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { client } from '@/config/client'

export const revalidate = 60

function isSupabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return url.startsWith('https://') && !url.includes('placeholder') && key.length > 20 && !key.includes('placeholder')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  if (!isSupabaseReady()) {
    return {
      title: `${client.seo.title}`,
      description: client.seo.description,
    }
  }

  try {
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()
    const { data: product } = await supabase
      .from('products')
      .select('name, description, images, price, brand')
      .eq('slug', slug)
      .single()

    if (!product) return { title: client.name }

    const title       = `${product.name} | ${client.name}`
    const description = product.description
      ? product.description.slice(0, 160)
      : `Buy ${product.name} at ${client.name}. Fast delivery across Nigeria.`
    const image = product.images?.[0] ?? client.seo.ogImage

    return {
      title,
      description,
      openGraph: { title, description, images: [image], type: 'website' },
      twitter:   { card: 'summary_large_image', title, description, images: [image] },
    }
  } catch {
    return { title: client.name, description: client.seo.description }
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Demo mode: no real Supabase — let client component load from localStorage
  if (!isSupabaseReady()) {
    return (
      <>
        <Header />
        <PageBox>
          <main className="px-4 sm:px-6 py-5">
            <ProductDetailDemo slug={slug} />
          </main>
        </PageBox>
        <Footer />
        <WhatsAppButton />
      </>
    )
  }

  // Real Supabase mode
  const { createClient } = await import('@/lib/supabase-server')

  let product: any = null
  let related: any[]       = []
  let upsell: any[]        = []
  let specialOffers: any[] = []

  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from('products')
      .select('*, categories(*), product_variants(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    product = data

    if (product) {
      if (product.category_id) {
        const { data: rel } = await supabase
          .from('products')
          .select('id, name, slug, price, compare_price, images, rating, review_count')
          .eq('category_id', product.category_id)
          .eq('is_active', true)
          .neq('id', product.id)
          .limit(8)
        related = rel ?? []
      }

      const { data: ups } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_price, images, rating, review_count')
        .eq('is_active', true)
        .neq('id', product.id)
        .gt('price', product.price)
        .order('price', { ascending: true })
        .limit(8)
      upsell = ups ?? []

      const { data: offers } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_price, images')
        .eq('is_active', true)
        .neq('id', product.id)
        .not('compare_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3)
      specialOffers = offers ?? []
    }
  } catch {}

  if (!product) notFound()

  const category = product.categories

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-4 sm:px-6 py-5">
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-5 flex-wrap">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight size={11} />
            {category && (
              <>
                <Link href={`/shop?category=${category.slug}`} className="hover:text-gray-700">{category.name}</Link>
                <ChevronRight size={11} />
              </>
            )}
            <span className="text-gray-600 font-medium line-clamp-1">{product.name}</span>
          </nav>

          <ProductDetailClient
            product={product}
            related={related}
            upsell={upsell}
            specialOffers={specialOffers}
          />
        </main>
      </PageBox>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
