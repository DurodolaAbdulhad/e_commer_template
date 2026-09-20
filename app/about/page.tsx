import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { client } from '@/config/client'
import Link from 'next/link'
import { ChevronRight, ShieldCheck, Truck, HeartHandshake, Award } from 'lucide-react'
import { getPageContent } from '@/lib/page-content'

const ACCENT = 'var(--brand-primary)'

const pillars = [
  { icon: <ShieldCheck size={22} />, title: 'Quality Guaranteed', desc: 'Every product is vetted for quality before it reaches you.' },
  { icon: <Truck size={22} />,       title: 'Fast Delivery',       desc: 'Swift nationwide delivery so you get what you ordered, fast.' },
  { icon: <HeartHandshake size={22} />, title: 'Customer First',   desc: 'Dedicated support team ready to resolve any issue.' },
  { icon: <Award size={22} />,       title: 'Best Prices',         desc: 'We work directly with suppliers to give you the best value.' },
]

export default async function AboutPage() {
  const saved = await getPageContent('about')
  const d = {
    headline: `About ${client.name}`,
    tagline: `We're on a mission to make quality products accessible to everyone across Nigeria. Discover our story.`,
    story_1: `${client.name} was founded with a simple belief: shopping online should be easy, affordable, and reliable. We started small, curating only the products we'd buy ourselves — and grew into the store you see today.`,
    story_2: `We're proud to serve thousands of happy customers across Nigeria, with a constantly growing catalogue. Every decision we make is guided by what's best for you — our customer.`,
    mission: '',
    ...saved,
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
            <span className="text-gray-700">About</span>
          </nav>

          {/* Hero */}
          <div className="rounded-2xl text-white px-8 py-12 mb-10 text-center"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #1a2638 100%)` }}>
            <h1 className="text-3xl font-extrabold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              {d.headline}
            </h1>
            <p className="text-white/80 max-w-xl mx-auto text-sm leading-relaxed">{d.tagline}</p>
          </div>

          {/* Story */}
          <div className="max-w-2xl mx-auto mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Our Story</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{d.story_1}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{d.story_2}</p>
            {d.mission && (
              <p className="text-sm text-gray-600 leading-relaxed mt-4 font-medium">{d.mission}</p>
            )}
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {pillars.map(p => (
              <div key={p.title} className="bg-white border border-gray-100 rounded-xl p-5 text-center hover:shadow-sm transition-shadow">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white"
                  style={{ backgroundColor: ACCENT }}>
                  {p.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1.5">{p.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center py-8 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-4">Ready to shop?</p>
            <Link href="/shop"
              className="inline-block px-8 py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}>
              Browse Our Store
            </Link>
          </div>
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
