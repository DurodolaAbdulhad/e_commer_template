import Link from 'next/link'
import { WifiOff, ShoppingBag } from 'lucide-react'
import { client } from '@/config/client'

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: client.colors.background }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${client.colors.primary}15` }}
      >
        <WifiOff size={36} style={{ color: client.colors.primary }} />
      </div>

      <h1
        className="text-2xl font-bold text-gray-800 mb-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        You&apos;re offline
      </h1>
      <p className="text-gray-500 text-sm max-w-xs mb-8">
        No internet connection. Check your connection and try again.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ backgroundColor: client.colors.primary }}
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 text-sm font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center"
        >
          <ShoppingBag size={15} />
          {client.name}
        </Link>
      </div>
    </div>
  )
}
