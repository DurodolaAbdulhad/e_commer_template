'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { getPostBySlug, getPosts } from '@/lib/admin-db'
import { Clock, ChevronRight, ArrowLeft, Tag } from 'lucide-react'
import MidPromoBanner from '@/components/home/MidPromoBanner'
import FlashDealsMinimal from '@/components/home/FlashDealsMinimal'
import ShareButtons from '@/components/ui/ShareButtons'
import NewsletterForm from '@/components/ui/NewsletterForm'

const ACCENT = '#e84c3d'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
}

function renderContent(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-gray-800 mt-6 mb-2">{line.replace(/\*\*/g, '')}</h3>
      )
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-extrabold text-gray-900 mt-6 mb-3">{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold text-gray-800 mt-5 mb-2">{line.slice(3)}</h2>)
    } else {
      const html = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
      elements.push(
        <p key={i} className="text-sm text-gray-600 leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: html }} />
      )
    }
    i++
  }
  return elements
}

export default function BlogPostContent({ slug }: { slug: string }) {
  const router = useRouter()
  const [post, setPost]       = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    getPostBySlug(slug).then(async data => {
      if (!data || !data.is_published) { setLoading(false); return }
      setPost(data)
      const all = await getPosts({ published: true })
      setRelated(all.filter((p: any) => p.id !== data.id).slice(0, 3))
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return (
      <>
        <Header />
        <PageBox>
          <div className="py-12 space-y-4 animate-pulse px-6">
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="h-80 bg-gray-100 rounded-2xl" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        </PageBox>
        <Footer />
      </>
    )
  }

  if (!post) {
    return (
      <>
        <Header />
        <PageBox>
          <div className="py-24 text-center">
            <p className="text-gray-500 text-lg mb-4">Post not found.</p>
            <Link href="/blog" className="text-sm font-semibold" style={{ color: ACCENT }}>
              ← Back to Blog
            </Link>
          </div>
        </PageBox>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <PageBox>
        <div className="px-6 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <Link href="/blog" className="hover:text-gray-600">Blog</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 truncate max-w-[200px]">{post.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
            {/* Article */}
            <article>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                {post.category}
              </span>
              <h1 className="mt-2 mb-4 text-3xl font-extrabold text-gray-900 leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-100">
                <span className="font-medium text-gray-600">{post.author}</span>
                <span>·</span>
                <span>{formatDate(post.created_at)}</span>
                {post.read_time && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />{post.read_time} min read
                    </span>
                  </>
                )}
              </div>

              {post.cover_image && (
                <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-8">
                  <Image src={post.cover_image} alt={post.title} fill unoptimized
                    className="object-cover" sizes="800px" priority />
                </div>
              )}

              <p className="text-base text-gray-500 leading-relaxed mb-6 italic border-l-4 pl-4"
                style={{ borderColor: ACCENT }}>
                {post.excerpt}
              </p>

              <div className="prose-custom">
                {renderContent(post.content)}
              </div>

              {post.tags?.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500 capitalize">
                      <Tag size={10} />{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <ShareButtons title={post.title} description={post.excerpt} />
              </div>

              <div className="mt-6">
                <Link href="/blog"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft size={14} /> Back to Blog
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {related.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
                    More Articles
                  </h3>
                  <div className="space-y-4">
                    {related.map(r => (
                      <Link key={r.id} href={`/blog/${r.slug}`}
                        className="group flex gap-3 items-start">
                        <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {r.cover_image && (
                            <Image src={r.cover_image} alt={r.title} fill unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="64px" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase tracking-widest mb-0.5"
                            style={{ color: ACCENT }}>{r.category}</p>
                          <p className="text-xs font-medium text-gray-700 leading-snug line-clamp-2 group-hover:text-red-500 transition-colors">
                            {r.title}
                          </p>
                          {r.read_time && (
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-0.5">
                              <Clock size={9} />{r.read_time}m
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl p-5" style={{ backgroundColor: '#1a2638' }}>
                <h3 className="text-sm font-bold text-white mb-1">Stay in the loop</h3>
                <p className="text-xs text-white/60 mb-4">Get new posts and deals delivered to your inbox.</p>
                <NewsletterForm source="blog-sidebar" dark buttonColor={ACCENT} />
              </div>
            </aside>
          </div>
        </div>

        {/* Promo + Flash Deals */}
        <div className="border-t border-gray-100 pt-6 pb-8 px-6 space-y-6">
          <MidPromoBanner />
          <FlashDealsMinimal />
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
