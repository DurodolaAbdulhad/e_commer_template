import type { Metadata } from 'next'
import { client } from '@/config/client'
import BlogPostContent from '@/components/blog/BlogPostContent'

function isSupabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return url.startsWith('https://') && !url.includes('placeholder') && key.length > 20 && !key.includes('placeholder')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  if (!isSupabaseReady()) {
    return {
      title: `Blog | ${client.name}`,
      description: client.seo.description,
    }
  }

  try {
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()
    const { data: post } = await supabase
      .from('posts')
      .select('title, excerpt, cover_image, author, category')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (!post) return { title: `Blog | ${client.name}` }

    const title       = `${post.title} | ${client.name}`
    const description = post.excerpt?.slice(0, 160) ?? `Read ${post.title} on the ${client.name} blog.`
    const image       = post.cover_image ?? client.seo.ogImage

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [image],
        type: 'article',
        authors: post.author ? [post.author] : undefined,
      },
      twitter: { card: 'summary_large_image', title, description, images: [image] },
    }
  } catch {
    return { title: `Blog | ${client.name}`, description: client.seo.description }
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let articleSchema: object | null = null
  if (isSupabaseReady()) {
    try {
      const { createClient } = await import('@/lib/supabase-server')
      const supabase = await createClient()
      const { data: post } = await supabase
        .from('posts')
        .select('title, excerpt, cover_image, author, published_at, updated_at')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (post) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
        articleSchema = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt ?? '',
          image: post.cover_image ? [post.cover_image] : undefined,
          author: { '@type': 'Person', name: post.author ?? client.name },
          publisher: {
            '@type': 'Organization',
            name: client.name,
            logo: { '@type': 'ImageObject', url: `${siteUrl}${client.logo}` },
          },
          datePublished: post.published_at,
          dateModified: post.updated_at ?? post.published_at,
          mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/blog/${slug}` },
        }
      }
    } catch {}
  }

  return (
    <>
      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}
      <BlogPostContent slug={slug} />
    </>
  )
}
