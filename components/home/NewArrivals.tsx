import { createClient } from '@/lib/supabase-server'
import ProductCard from '@/components/product/ProductCard'
import Link from 'next/link'

async function getNewArrivals() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)
    return data ?? []
  } catch {
    return []
  }
}

export default async function NewArrivals() {
  const products = await getNewArrivals()

  if (products.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            New Arrivals
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Just landed in store</p>
        </div>
        <Link href="/shop?sort=newest" className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
