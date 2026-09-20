'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { getCollections } from '@/lib/admin-db'
import Link from 'next/link'
import { ChevronRight, Layers, Package } from 'lucide-react'

const ACCENT = '#e84c3d'

const COLLECTION_COLORS = [
  '#fee2e2', '#fef3c7', '#d1fae5', '#dbeafe', '#ede9fe',
  '#fce7f3', '#e0f2fe', '#f0fdf4', '#fff7ed', '#fdf4ff',
]

export default function CollectionsIndexPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCollections()
      .then((c: any[]) => setCollections(c.filter(x => x.is_active !== false)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <Link href="/shop" className="hover:text-gray-600">Shop</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">Collections</span>
          </nav>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Shop by Collection
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Curated groups of products — find exactly what you're looking for.
          </p>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-24">
              <Layers size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No collections yet.</p>
              <Link href="/shop" className="text-sm font-semibold underline" style={{ color: ACCENT }}>
                Browse all products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {collections.map((col, i) => (
                <Link
                  key={col.id}
                  href={`/shop/collections/${col.slug || col.id}`}
                  className="group flex flex-col items-center justify-center rounded-2xl p-6 text-center transition-transform hover:scale-[1.02] hover:shadow-md"
                  style={{ backgroundColor: COLLECTION_COLORS[i % COLLECTION_COLORS.length], minHeight: '140px' }}
                >
                  <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center mb-3 shadow-sm">
                    <Layers size={22} style={{ color: ACCENT }} />
                  </div>
                  <p className="font-bold text-gray-800 text-sm leading-tight group-hover:text-gray-900">
                    {col.name}
                  </p>
                  {col.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{col.description}</p>
                  )}
                  <span className="mt-3 text-xs font-semibold" style={{ color: ACCENT }}>
                    Shop →
                  </span>
                </Link>
              ))}

              {/* Browse all card */}
              <Link
                href="/shop"
                className="group flex flex-col items-center justify-center rounded-2xl p-6 text-center border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                style={{ minHeight: '140px' }}
              >
                <Package size={28} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-400 group-hover:text-gray-600">Browse all products</p>
              </Link>
            </div>
          )}
        </main>
      </PageBox>
      <Footer />
    </>
  )
}
