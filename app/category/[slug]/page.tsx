import { createClient } from '@/lib/supabase-server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import ProductGrid from '@/components/product/ProductGrid'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const revalidate = 60

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let category: any = null
  let products: any[] = []

  try {
    const supabase = await createClient()
    const { data: cat } = await supabase.from('categories').select('*').eq('slug', slug).single()
    category = cat
    if (category) {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      products = prods ?? []
    }
  } catch {}

  if (!category) {
    return (
      <>
        <Header />
        <PageBox>
          <main className="px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-gray-700 mb-2">Category not found</h1>
            <p className="text-gray-400 mb-6">This category doesn&apos;t exist or has been removed.</p>
            <Link href="/shop" className="text-sm font-semibold" style={{ color: 'var(--brand-secondary)' }}>
              Browse All Products →
            </Link>
          </main>
        </PageBox>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <Link href="/shop" className="hover:text-gray-600">Shop</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">{category.name}</span>
          </nav>

          {/* Category header */}
          <div className="rounded-lg px-6 py-8 mb-6 flex items-center justify-between" style={{ backgroundColor: '#f9f6f0' }}>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
                {category.name}
              </h1>
              {category.description && (
                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">{products.length} products</p>
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: 'var(--brand-secondary)' }}
            >
              {category.name.charAt(0)}
            </div>
          </div>

          <ProductGrid products={products} emptyMessage={`No products in ${category.name} yet.`} />
        </main>
      </PageBox>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
