'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import ProductGrid from '@/components/product/ProductGrid'

interface Props {
  query: string
  serverProducts: any[]   // populated by server in Supabase mode; empty in demo mode
}

export default function SearchResults({ query, serverProducts }: Props) {
  const [products, setProducts] = useState<any[]>(serverProducts)

  useEffect(() => {
    // Demo mode: serverProducts is empty — search localStorage instead
    if (serverProducts.length > 0 || !query.trim()) return

    try {
      const all: any[] = JSON.parse(localStorage.getItem('admin_products') ?? '[]')
      const q = query.toLowerCase()
      const matched = all.filter(p =>
        p.is_active &&
        (p.name?.toLowerCase().includes(q) ||
         p.description?.toLowerCase().includes(q) ||
         p.brand?.toLowerCase().includes(q) ||
         p.sku?.toLowerCase().includes(q))
      )
      setProducts(matched)
    } catch {
      setProducts([])
    }
  }, [query, serverProducts])

  return (
    <main className="px-4 py-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Search</span>
      </div>

      {query ? (
        <>
          <h1 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-xs text-gray-400 mb-6">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
          <ProductGrid
            products={products}
            emptyMessage={`No products found for "${query}". Try a different search term.`}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <Search size={48} className="text-gray-200" />
          <div>
            <p className="font-semibold text-gray-700">What are you looking for?</p>
            <p className="text-sm text-gray-400 mt-1">Use the search bar above to find products.</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold underline" style={{ color: 'var(--brand-secondary)' }}>
            Browse All Products
          </Link>
        </div>
      )}
    </main>
  )
}
