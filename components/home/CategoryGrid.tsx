import Link from 'next/link'
import Image from 'next/image'
import {
  Smartphone, Laptop, Headphones, Camera, Gamepad2, Tv, Cpu,
  Shirt, Watch, ShoppingBag, Tag, Baby,
  Fish, Coffee, Wheat, Cookie, Leaf, Milk,
  Dumbbell, BookOpen, Home, Heart, GraduationCap,
  Car, Sofa, Utensils, Package, Zap, Apple,
  Sparkles, Pill, ShoppingCart, Bike, Music,
} from 'lucide-react'
import { client } from '@/config/client'
import { industries } from '@/config/industries'
import { slugify } from '@/lib/utils'
import { createClient, isSupabaseReady } from '@/lib/supabase-server'

// ── Keyword → icon map ──────────────────────────────────────────────────────
const ICON_MAP: [string, React.ComponentType<{ size?: number; strokeWidth?: number }>][] = [
  ['phone', Smartphone], ['tablet', Smartphone], ['laptop', Laptop], ['computer', Laptop],
  ['audio', Headphones], ['headphone', Headphones], ['earphone', Headphones],
  ['camera', Camera], ['photo', Camera],
  ['gaming', Gamepad2], ['game', Gamepad2], ['toy', Gamepad2],
  ['tv', Tv], ['theatre', Tv], ['theater', Tv], ['electronic', Cpu],
  ['fashion', Shirt], ['women', Shirt], ['men', Shirt], ['clothing', Shirt], ['apparel', Shirt],
  ['kids', Baby], ['baby', Baby], ['children', Baby],
  ['shoe', Tag], ['footwear', Tag],
  ['bag', ShoppingBag], ['luggage', ShoppingBag],
  ['watch', Watch],
  ['jewel', Sparkles], ['jeweller', Sparkles], ['beauty', Sparkles], ['cosmetic', Sparkles],
  ['fruit', Apple], ['vegetable', Leaf], ['meat', Utensils], ['fish', Fish], ['seafood', Fish],
  ['dairy', Milk], ['egg', Milk], ['beverage', Coffee], ['drink', Coffee], ['coffee', Coffee],
  ['snack', Cookie], ['confection', Cookie], ['grain', Wheat], ['staple', Wheat], ['bread', Wheat],
  ['household', Home], ['home', Home], ['garden', Leaf], ['plant', Leaf],
  ['furniture', Sofa], ['sport', Dumbbell], ['fitness', Dumbbell], ['gym', Dumbbell], ['bike', Bike],
  ['book', BookOpen], ['education', GraduationCap], ['stationery', BookOpen], ['school', GraduationCap],
  ['health', Pill], ['pharmacy', Pill], ['medical', Heart],
  ['car', Car], ['auto', Car], ['vehicle', Car],
  ['music', Music], ['instrument', Music],
  ['grocery', ShoppingCart], ['food', Utensils], ['electric', Zap],
]

function getIcon(name: string) {
  const lower = name.toLowerCase()
  for (const [kw, Icon] of ICON_MAP) { if (lower.includes(kw)) return Icon }
  return Package
}

const SLOT_COLORS = [
  { bg: '#EEF2FF', icon: '#4F46E5' },
  { bg: '#F0FDF4', icon: '#16A34A' },
  { bg: '#FFF7ED', icon: '#EA580C' },
  { bg: '#FDF2F8', icon: '#C026D3' },
  { bg: '#F0F9FF', icon: '#0284C7' },
  { bg: '#FEF9C3', icon: '#CA8A04' },
]

type Cat = { name: string; slug: string; image?: string | null }

async function fetchCategories(): Promise<Cat[]> {
  if (!isSupabaseReady()) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('name, slug, image')
      .eq('is_active', true)
      .is('parent_id', null)   // top-level only
      .order('sort_order', { ascending: true })
      .limit(12)
    if (error || !data?.length) return []
    return data
  } catch { return [] }
}

export default async function CategoryGrid() {
  const dbCats = await fetchCategories()

  // Use DB categories if available; otherwise fall back to industry preset
  const preset = industries[client.industry as keyof typeof industries] ?? industries.general
  const fallback: Cat[] = preset.categories.slice(0, 6).map(n => ({ name: n, slug: slugify(n) }))
  const categories = dbCats.length > 0 ? dbCats : fallback
  const display = categories.slice(0, 6)

  return (
    <section className="px-4 py-6 border-b border-gray-100">
      <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-widest"
        style={{ fontFamily: 'var(--font-heading)' }}>
        Top Categories
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {display.map((cat, i) => {
          const color = SLOT_COLORS[i % SLOT_COLORS.length]
          const Icon  = getIcon(cat.name)

          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden bg-white"
            >
              {/* Icon/image area */}
              <div
                className="w-full aspect-square flex items-center justify-center transition-transform duration-200 group-hover:scale-105 overflow-hidden relative"
                style={{ backgroundColor: cat.image ? '#f8f8f8' : color.bg }}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icon size={32} strokeWidth={1.5} style={{ color: color.icon }} />
                )}
              </div>

              {/* Label */}
              <div className="w-full text-center text-[11px] font-semibold text-gray-600 py-2 px-1 leading-tight group-hover:text-gray-900 transition-colors min-h-[36px] flex items-center justify-center">
                {cat.name}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
