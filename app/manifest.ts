import { MetadataRoute } from 'next'
import { client } from '@/config/client'

export default function manifest(): MetadataRoute.Manifest {
  const name    = client.name
  const short   = name.split(' ')[0]           // e.g. "Mynnat"
  const primary = client.colors.primary
  const bg      = client.colors.background

  return {
    name,
    short_name:        short,
    description:       client.seo.description,
    start_url:         '/',
    display:           'standalone',
    background_color:  bg,
    theme_color:       primary,
    orientation:       'portrait',
    scope:             '/',
    categories:        ['shopping', 'fashion'],
    icons: [
      {
        src:     '/api/pwa-icon?size=192',
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/api/pwa-icon?size=512',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name:       'Shop Now',
        url:        '/shop',
        description: 'Browse all products',
      },
      {
        name:       'My Cart',
        url:        '/cart',
        description: 'View your shopping cart',
      },
    ],
  }
}
