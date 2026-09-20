import { createClient } from '@/lib/supabase-server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import ProductCard from '@/components/product/ProductCard'
import ShopSidebar from '@/components/shop/ShopSidebar'
import ShopToolbar from '@/components/shop/ShopToolbar'
import MobileFilterDrawer from '@/components/shop/MobileFilterDrawer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const revalidate = 60

interface SearchParams {
  category?: string
  sort?: string
  min?: string
  max?: string
  featured?: string
  sale?: string
  rating?: string
  brand?: string
  color?: string
  size?: string
  q?: string
  show?: string
  view?: string
}

async function getProducts(params: SearchParams) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('products')
      .select('*, categories(name,slug)')
      .eq('is_active', true)

    if (params.category) {
      const { data: cat } = await supabase
        .from('categories').select('id').eq('slug', params.category).single()
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (params.featured === 'true') query = query.eq('is_featured', true)
    if (params.sale === 'true')     query = query.not('compare_price', 'is', null)
    if (params.min)  query = query.gte('price', Number(params.min))
    if (params.max)  query = query.lte('price', Number(params.max))
    if (params.q)    query = query.ilike('name', `%${params.q}%`)
    if (params.rating) query = query.gte('rating', Number(params.rating))
    if (params.brand)  query = query.eq('brand', params.brand)

    switch (params.sort) {
      case 'price_asc':  query = query.order('price', { ascending: true });  break
      case 'price_desc': query = query.order('price', { ascending: false }); break
      case 'newest':     query = query.order('created_at', { ascending: false }); break
      default:           query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
    }

    const limit = Number(params.show ?? 12)
    const { data } = await query.limit(limit)
    return data ?? []
  } catch { return [] }
}

async function getCategories() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories').select('*').eq('is_active', true).order('sort_order')
    return data ?? []
  } catch { return [] }
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params   = await searchParams
  const [products, categories] = await Promise.all([getProducts(params), getCategories()])
  const view     = params.view ?? 'grid'

  const pageTitle =
    params.featured === 'true' ? 'Best Sellers'
    : params.sale === 'true'   ? 'Sale Items'
    : params.sort === 'newest' ? 'New Arrivals'
    : params.q                 ? `"${params.q}"`
    : params.category
      ? (categories.find((c: any) => c.slug === params.category)?.name ?? 'Products')
    : 'All Products'

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-6 py-5">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <ChevronRight size={11} />
            <Link href="/shop" className="hover:text-gray-600 transition-colors">Shop</Link>
            {params.category && (
              <>
                <ChevronRight size={11} />
                <span className="text-gray-700 font-medium capitalize">{pageTitle}</span>
              </>
            )}
          </nav>

          {/* Mobile filter drawer — hidden until Filter button clicked */}
          <MobileFilterDrawer
            categories={categories}
            activeCategory={params.category}
            activeMin={params.min}
            activeMax={params.max}
            activeFeatured={params.featured}
            activeSale={params.sale}
            activeRating={params.rating}
            activeBrand={params.brand}
            activeColor={params.color}
            activeSize={params.size}
          />

          <div className="flex gap-6">
            {/* Sidebar — desktop only */}
            <ShopSidebar
              categories={categories}
              activeCategory={params.category}
              activeMin={params.min}
              activeMax={params.max}
              activeFeatured={params.featured}
              activeSale={params.sale}
              activeRating={params.rating}
              activeBrand={params.brand}
              activeColor={params.color}
              activeSize={params.size}
            />

            {/* Main */}
            <div className="flex-1 min-w-0">
              <ShopToolbar
                count={products.length}
                sort={params.sort ?? ''}
                show={params.show ?? '12'}
                view={view}
                title={pageTitle}
              />

              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <p className="text-4xl">🔍</p>
                  <p className="font-semibold text-gray-600">No products found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters or search query</p>
                  <Link href="/shop"
                    className="mt-2 px-5 py-2 text-sm font-semibold text-white rounded"
                    style={{ backgroundColor: '#e84c3d' }}>
                    Clear Filters
                  </Link>
                </div>
              ) : view === 'list' ? (
                <div className="flex flex-col gap-3">
                  {products.map((p: any) => (
                    <ProductCard key={p.id} product={p} listView />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </PageBox>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
