import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Zap } from 'lucide-react'
import { getBundles, getProducts } from '@/lib/admin-db'
import { formatPrice } from '@/lib/utils'
import { client } from '@/config/client'

const ACCENT = client.colors.primary

export default async function ComboDeals() {
  let bundles: any[] = []
  let productMap = new Map<string, any>()

  try {
    const [allBundles, allProducts] = await Promise.all([getBundles(), getProducts()])
    productMap = new Map(allProducts.map((p: any) => [p.id, p]))
    bundles = allBundles.filter((b: any) => b.is_active !== false).slice(0, 3)
  } catch {}

  if (!bundles.length) return null

  return (
    <section className="py-10 px-4">
      {/* Section header */}
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} style={{ color: ACCENT }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                Bundle &amp; Save
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Combo Deals
            </h2>
          </div>
          <Link href="/bundles"
            className="flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: ACCENT }}>
            View all <ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bundles.map(bundle => {
            const items: any[] = (bundle.product_ids ?? [])
              .map((pid: string) => productMap.get(pid))
              .filter(Boolean)
            const retailTotal = items.reduce((s: number, p: any) => s + (p.price ?? 0), 0)
            const bundlePrice = bundle.bundle_price ?? retailTotal
            const savings     = retailTotal - bundlePrice
            const pct         = retailTotal > 0 ? Math.round((savings / retailTotal) * 100) : 0

            return (
              <div key={bundle.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">

                {/* Stacked thumbnail images */}
                <div className="relative h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundColor: ACCENT }} />
                  <div className="relative flex items-center">
                    {items.slice(0, 3).map((p: any, i: number) => (
                      <div key={p.id}
                        className="w-16 h-16 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white relative"
                        style={{
                          marginLeft: i === 0 ? 0 : '-12px',
                          zIndex: items.length - i,
                          transform: i === 0 ? 'rotate(-5deg)' : i === 1 ? 'rotate(0)' : 'rotate(5deg)',
                        }}>
                        {p.images?.[0]
                          ? <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="64px" />
                          : <div className="w-full h-full flex items-center justify-center text-base font-bold text-gray-300">{p.name?.charAt(0)}</div>
                        }
                      </div>
                    ))}
                  </div>
                  {pct > 0 && (
                    <div className="absolute top-2 right-2 w-11 h-11 rounded-full flex flex-col items-center justify-center text-white font-extrabold shadow"
                      style={{ backgroundColor: ACCENT }}>
                      <span className="text-xs leading-none">{pct}%</span>
                      <span className="text-[8px] leading-none opacity-90">OFF</span>
                    </div>
                  )}
                </div>

                {/* Name + price */}
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                      {bundle.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{items.length} items</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold" style={{ color: ACCENT }}>{formatPrice(bundlePrice)}</p>
                    {savings > 0 && (
                      <p className="text-[10px] text-gray-400 line-through">{formatPrice(retailTotal)}</p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <Link href="/bundles"
                    className="block w-full py-2 text-sm font-bold text-white text-center rounded-xl transition-opacity hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}>
                    Get Combo
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
