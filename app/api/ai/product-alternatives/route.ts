import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

// Returns one cheaper + one more-expensive active product in the same category.
// Falls back to store-wide if no same-category matches exist.

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  if (!isServiceClientReady()) return NextResponse.json({ cheaper: null, premium: null })

  const supabase = getServiceClient()

  // 1. Find the current product
  const { data: current } = await supabase
    .from('products')
    .select('id, name, price, category, images, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!current) return NextResponse.json({ cheaper: null, premium: null })

  const price    = current.price    ?? 0
  const category = current.category ?? ''

  // 2. Helper: pick best match from a candidate list (prefer same category)
  async function findAlternative(direction: 'cheaper' | 'premium') {
    const op        = direction === 'cheaper' ? 'lt' : 'gt'
    const order     = direction === 'cheaper' ? 'desc' : 'asc' // cheapest of the "cheaper" set; priciest of "premium"

    // Same-category first
    if (category) {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, images, slug')
        .eq('is_active', true)
        .eq('category', category)
        .neq('id', current.id)
        .filter('price', op, price)
        .order('price', { ascending: order === 'asc' })
        .limit(1)
      if (data?.[0]) return data[0]
    }

    // Fallback: any category
    const { data } = await supabase
      .from('products')
      .select('id, name, price, images, slug')
      .eq('is_active', true)
      .neq('id', current.id)
      .filter('price', op, price)
      .order('price', { ascending: order === 'asc' })
      .limit(1)
    return data?.[0] ?? null
  }

  const [cheaper, premium] = await Promise.all([
    findAlternative('cheaper'),
    findAlternative('premium'),
  ])

  return NextResponse.json({
    current: { name: current.name, price: current.price, slug: current.slug },
    cheaper,
    premium,
  })
}
