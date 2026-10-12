import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3030'

function url(path: string, priority = 0.8, changeFreq: MetadataRoute.Sitemap[0]['changeFrequency'] = 'weekly') {
  return { url: `${BASE}${path}`, lastModified: new Date(), changeFrequency: changeFreq, priority }
}

function isSupabaseReady() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return u.startsWith('https://') && !u.includes('placeholder') && k.length > 20 && !k.includes('placeholder')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    url('/',                    1.0, 'daily'),
    url('/shop',                0.9, 'daily'),
    url('/blog',                0.8, 'weekly'),
    url('/pages/about',         0.6, 'monthly'),
    url('/pages/contact',       0.6, 'monthly'),
    url('/pages/faq',           0.6, 'monthly'),
    url('/pages/privacy',       0.4, 'monthly'),
    url('/pages/terms',         0.4, 'monthly'),
    url('/pages/shipping',      0.5, 'monthly'),
    url('/pages/returns',       0.5, 'monthly'),
    url('/shop/collections',    0.7, 'weekly'),
  ]

  if (!isSupabaseReady()) return staticRoutes

  try {
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()

    const [{ data: products }, { data: posts }, { data: categories }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true),
      supabase.from('posts').select('slug, updated_at').eq('is_published', true),
      supabase.from('categories').select('slug'),
    ])

    const productUrls = (products ?? []).map(p => ({
      url: `${BASE}/shop/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const postUrls = (posts ?? []).map(p => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    const categoryUrls = (categories ?? []).map(c => ({
      url: `${BASE}/shop?category=${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))

    return [...staticRoutes, ...productUrls, ...postUrls, ...categoryUrls]
  } catch {
    return staticRoutes
  }
}
