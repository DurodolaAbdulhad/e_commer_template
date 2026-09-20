import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { client } from '@/config/client'

export default function NotFound() {
  return (
    <>
      <Header />
      <PageBox>
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <p className="text-8xl font-black text-gray-100 select-none" style={{ fontFamily: 'var(--font-heading)' }}>
            404
          </p>
          <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Page not found
          </h1>
          <p className="text-sm text-gray-400 max-w-sm mb-8">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Browse Shop
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Home
            </Link>
          </div>
          {client.features?.blog && (
            <p className="mt-8 text-xs text-gray-400">
              Looking for articles?{' '}
              <Link href="/blog" className="underline hover:text-gray-600">Visit our blog</Link>
            </p>
          )}
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
