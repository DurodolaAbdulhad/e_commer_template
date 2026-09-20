'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { getPosts } from '@/lib/admin-db'
import { Clock, ArrowRight, Tag } from 'lucide-react'
import MidPromoBanner from '@/components/home/MidPromoBanner'
import FlashDealsMinimal from '@/components/home/FlashDealsMinimal'

const ACCENT = '#e84c3d'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const [posts, setPosts]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    getPosts({ published: true }).then(data => { setPosts(data); setLoading(false) })
  }, [])

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags ?? [])))
  const filtered = activeTag ? posts.filter(p => p.tags?.includes(activeTag)) : posts
  const [featured, ...rest] = filtered

  return (
    <>
      <Header />
      <PageBox>
        <div className="px-6 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Our Blog
            </h1>
            <p className="text-gray-500 text-sm">Tips, guides and stories from our team</p>
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setActiveTag(null)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={{
                  backgroundColor: !activeTag ? ACCENT : 'transparent',
                  borderColor: !activeTag ? ACCENT : '#e5e7eb',
                  color: !activeTag ? '#fff' : '#6b7280',
                }}
              >
                All
              </button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize"
                  style={{
                    backgroundColor: activeTag === tag ? ACCENT : 'transparent',
                    borderColor: activeTag === tag ? ACCENT : '#e5e7eb',
                    color: activeTag === tag ? '#fff' : '#6b7280',
                  }}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-center text-gray-400 py-20">No posts found.</p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="space-y-8">
              {/* Featured post */}
              <Link href={`/blog/${featured.slug}`}
                className="group grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-64 md:h-72 lg:h-80">
                  {featured.cover_image ? (
                    <Image src={featured.cover_image} alt={featured.title} fill unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="600px" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                  <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: ACCENT }}>
                    Featured
                  </span>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <span className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: ACCENT }}>
                    {featured.category}
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 leading-snug mb-3 group-hover:text-red-600 transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    {featured.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{featured.author}</span>
                      <span>·</span>
                      <span>{formatDate(featured.created_at)}</span>
                      {featured.read_time && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />{featured.read_time} min read
                          </span>
                        </>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold" style={{ color: ACCENT }}>
                      Read <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Grid posts */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map(post => (
                    <Link key={post.id} href={`/blog/${post.slug}`}
                      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      {/* Cover */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {post.cover_image ? (
                          <Image src={post.cover_image} alt={post.title} fill unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="400px" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[11px] font-bold uppercase tracking-widest mb-2"
                          style={{ color: ACCENT }}>
                          {post.category}
                        </span>
                        <h3 className="text-sm font-bold text-gray-800 leading-snug mb-2 line-clamp-2 group-hover:text-red-600 transition-colors"
                          style={{ fontFamily: 'var(--font-heading)' }}>
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-auto">
                          <div className="flex items-center gap-2">
                            <span>{formatDate(post.created_at)}</span>
                            {post.read_time && (
                              <span className="flex items-center gap-0.5">
                                <Clock size={10} />{post.read_time}m
                              </span>
                            )}
                          </div>
                          {post.tags?.[0] && (
                            <span className="flex items-center gap-0.5 capitalize">
                              <Tag size={10} />{post.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
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
