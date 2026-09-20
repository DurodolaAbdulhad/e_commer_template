import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { client } from '@/config/client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ContactPageContent from '@/components/pages/ContactPageContent'
import FaqPageContent from '@/components/pages/FaqPageContent'
import { getPageContent } from '@/lib/page-content'

// Renders plain text with **bold** markers and double-newline paragraphs
function RichText({ text }: { text: string }) {
  return (
    <div className="prose-custom max-w-2xl space-y-4 text-sm text-gray-600 leading-relaxed">
      {text.split(/\n\n+/).map((para, i) => {
        const parts = para.split(/\*\*(.+?)\*\*/g)
        return (
          <p key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="text-gray-800">{part}</strong> : part
            )}
          </p>
        )
      })}
    </div>
  )
}

// ─── Page definitions ─────────────────────────────────────────────────────────

type PageDef = {
  title: string
  description: string
  content: React.ReactNode
}

function PrivacyContent() {
  return (
    <div className="prose-custom max-w-2xl space-y-6 text-sm text-gray-600 leading-relaxed">
      <p>Last updated: January 2025</p>
      <p>At {client.name}, we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Information We Collect</h2>
      <p>We collect information you provide directly to us, including your name, email address, phone number, shipping address, and payment details when you place an order or create an account.</p>
      <p>We also automatically collect certain information when you visit our site, including your IP address, browser type, pages visited, and the referring URL.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">How We Use Your Information</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Process and fulfil your orders</li>
        <li>Communicate with you about your orders and account</li>
        <li>Send promotional emails if you opt in</li>
        <li>Improve our website and services</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2 className="text-base font-bold text-gray-800 mt-6">Payment Security</h2>
      <p>All payment transactions are processed securely through Paystack, a PCI-DSS certified payment processor. We do not store your card details on our servers.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Sharing Your Information</h2>
      <p>We do not sell, trade, or transfer your personal information to third parties except as necessary to fulfil your orders (e.g., delivery companies) or as required by law.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Cookies</h2>
      <p>We use cookies to improve your shopping experience, remember your cart, and analyse site traffic. You can control cookie settings in your browser. Disabling cookies may affect site functionality.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal information at any time. Contact us at <strong>{client.email}</strong> to exercise these rights.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Contact Us</h2>
      <p>If you have questions about this policy, contact us at <strong>{client.email}</strong> or call <strong>{client.phone}</strong>.</p>
    </div>
  )
}

function TermsContent() {
  return (
    <div className="prose-custom max-w-2xl space-y-6 text-sm text-gray-600 leading-relaxed">
      <p>Last updated: January 2025</p>
      <p>By accessing and using {client.name}, you accept and agree to be bound by these Terms and Conditions. Please read them carefully before using our website.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">1. Use of the Website</h2>
      <p>You must be at least 18 years old to make purchases on our platform. You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of others.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">2. Product Descriptions</h2>
      <p>We strive to display our products as accurately as possible. Colours may vary slightly due to screen settings. We reserve the right to limit quantities and to correct errors in product descriptions or pricing.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">3. Pricing</h2>
      <p>All prices are listed in Nigerian Naira (₦) and are subject to change without notice. Prices at the time of your order placement will be honoured.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">4. Orders & Payment</h2>
      <p>By placing an order, you represent that the information you provide is accurate and complete. We reserve the right to refuse or cancel any order. Payment must be received in full before goods are dispatched.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">5. Delivery</h2>
      <p>Delivery timeframes are estimates and not guaranteed. Risk of loss passes to you upon delivery. We are not responsible for delays caused by courier services or circumstances beyond our control.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">6. Returns & Refunds</h2>
      <p>Returns are accepted within 7 days of delivery for eligible items. Please see our <Link href="/pages/returns" className="underline text-gray-800">Returns Policy</Link> for full details.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">7. Intellectual Property</h2>
      <p>All content on this website, including text, graphics, logos, and images, is the property of {client.name} and is protected by copyright law.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">8. Limitation of Liability</h2>
      <p>{client.name} shall not be liable for any indirect, incidental, or consequential damages arising from your use of this website or our products.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">9. Governing Law</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in Nigerian courts.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">10. Contact</h2>
      <p>For questions about these terms, email us at <strong>{client.email}</strong>.</p>
    </div>
  )
}

function ShippingContent() {
  return (
    <div className="max-w-2xl space-y-6 text-sm text-gray-600 leading-relaxed">
      <p>We deliver across all 36 states in Nigeria. Below are our standard shipping terms.</p>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 bg-gray-50 px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
          <span>Zone</span><span>Timeframe</span><span>Cost</span>
        </div>
        {[
          ['Lagos (same state)', '1–2 business days', '₦1,000'],
          ['South West', '2–3 business days', '₦1,500'],
          ['South East / South South', '3–5 business days', '₦2,000'],
          ['North (all zones)', '4–7 business days', '₦2,500'],
          ['FCT – Abuja', '2–3 business days', '₦1,500'],
        ].map(([zone, time, cost]) => (
          <div key={zone} className="grid grid-cols-3 px-5 py-3 border-t border-gray-50 hover:bg-gray-50">
            <span className="font-medium text-gray-700">{zone}</span>
            <span>{time}</span>
            <span className="font-semibold">{cost}</span>
          </div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm font-bold text-green-800 mb-1">Free shipping on orders over ₦50,000</p>
        <p className="text-xs text-green-600">Free delivery applies automatically at checkout when your cart total exceeds ₦50,000.</p>
      </div>

      <h2 className="text-base font-bold text-gray-800 mt-6">Order Processing</h2>
      <p>Orders placed before 2pm on business days are processed same day. Orders placed after 2pm or on weekends are processed the next business day.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Tracking</h2>
      <p>Once your order ships, you'll receive a tracking number via email and SMS. You can also track your order under <Link href="/account/orders" className="underline text-gray-800">My Orders</Link>.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Failed Delivery</h2>
      <p>If our courier is unable to reach you, they will attempt redelivery once and then hold the package for 48 hours before returning it to us. Re-delivery charges may apply.</p>
    </div>
  )
}

function ReturnsContent() {
  return (
    <div className="max-w-2xl space-y-6 text-sm text-gray-600 leading-relaxed">
      <p>We want you to be completely satisfied with your purchase. If you're not happy for any reason, we make returns simple.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Return Window</h2>
      <p>You have <strong>7 days</strong> from the date of delivery to request a return.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Eligible Items</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Items must be unused and in original condition</li>
        <li>Original packaging must be intact</li>
        <li>Tags and accessories must be included</li>
      </ul>

      <h2 className="text-base font-bold text-gray-800 mt-6">Non-Returnable Items</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Personal hygiene and beauty products (once opened)</li>
        <li>Perishable goods and food items</li>
        <li>Digital downloads</li>
        <li>Items marked "Final Sale"</li>
        <li>Custom or personalised orders</li>
      </ul>

      <h2 className="text-base font-bold text-gray-800 mt-6">How to Return</h2>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Contact us via WhatsApp or email with your order number and reason</li>
        <li>We'll provide a return authorisation and pickup/drop-off instructions</li>
        <li>Package the item securely in its original packaging</li>
        <li>Hand it to our courier or drop it off at the specified location</li>
      </ol>

      <h2 className="text-base font-bold text-gray-800 mt-6">Refunds</h2>
      <p>Once we receive and inspect the returned item (usually 2–3 days), we'll process your refund. Funds will be returned to your original payment method within 5–10 business days.</p>

      <h2 className="text-base font-bold text-gray-800 mt-6">Damaged or Wrong Items</h2>
      <p>Received a damaged or incorrect item? Contact us within <strong>24 hours</strong> of delivery with photos and we'll send a replacement or full refund at no cost to you.</p>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-6">
        <p className="text-xs font-semibold text-gray-700 mb-1">Need to start a return?</p>
        <Link href="/pages/contact" className="text-xs font-bold underline" style={{ color: 'var(--brand-primary)' }}>
          Contact our support team →
        </Link>
      </div>
    </div>
  )
}

function SupportContent({ data }: { data?: any }) {
  const email = data?.email || client.email
  const phone = data?.phone || client.phone
  const hours = data?.hours || 'Monday – Friday: 9:00am – 6:00pm | Saturday: 10:00am – 4:00pm'
  const intro = data?.intro || 'Our support team is here to help. Choose the channel that works best for you.'
  const responseTime = data?.response_time || 'Response within 24 hours on business days'

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-gray-600">{intro}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          client.whatsapp && { emoji: '💬', title: 'WhatsApp', desc: 'Fastest response — usually within minutes', action: `Chat now`, href: `https://wa.me/${client.whatsapp}` },
          email && { emoji: '📧', title: 'Email', desc: responseTime, action: email, href: `mailto:${email}` },
          phone && { emoji: '📞', title: 'Phone', desc: hours, action: phone, href: `tel:${phone}` },
          { emoji: '❓', title: 'FAQ', desc: 'Find answers to common questions instantly', action: 'Browse FAQ', href: '/pages/faq' },
        ].filter(Boolean).map((item: any) => (
          <a key={item.title} href={item.href}
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="block bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow group">
            <span className="text-2xl mb-3 block">{item.emoji}</span>
            <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:underline">{item.title}</h3>
            <p className="text-xs text-gray-400 mb-2">{item.desc}</p>
            <p className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>{item.action}</p>
          </a>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mt-4">
        <p className="text-sm font-bold text-gray-800 mb-1">Business Hours</p>
        {hours.split('|').map((h: string, i: number) => (
          <p key={i} className="text-xs text-gray-500">{h.trim()}</p>
        ))}
      </div>
    </div>
  )
}

const TEAM_MEMBERS = [
  { name: 'Adebayo Okafor',   role: 'Chief Executive Officer',      emoji: '👨🏿‍💼', bio: 'Passionate about building world-class commerce infrastructure for African businesses.' },
  { name: 'Ngozi Eze',        role: 'Head of Operations',            emoji: '👩🏾‍💼', bio: 'Ensures every order is fulfilled accurately and every customer is delighted.' },
  { name: 'Chukwuemeka Dike', role: 'Head of Technology',            emoji: '👨🏾‍💻', bio: 'Builds the systems that power fast, reliable, and secure shopping.' },
  { name: 'Fatima Al-Hassan',  role: 'Head of Customer Experience',  emoji: '👩🏽‍💼', bio: 'Champions customer satisfaction at every touchpoint of the journey.' },
  { name: 'Kelechi Amadi',    role: 'Head of Logistics',             emoji: '👨🏿‍🔧', bio: 'Coordinates nationwide delivery to get your orders to you fast.' },
  { name: 'Amina Bello',      role: 'Head of Marketing',             emoji: '👩🏾‍🎨', bio: 'Tells the story of our brand and connects us to customers across Nigeria.' },
]

function TeamContent({ data }: { data?: any }) {
  const members = data?.members ?? TEAM_MEMBERS
  const intro   = data?.intro ?? `We're a tight-knit team of builders, operators, and customer advocates united by one goal: making online shopping effortless and trustworthy.`

  return (
    <div className="max-w-3xl space-y-8">
      <p className="text-sm text-gray-600 leading-relaxed">{intro}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((m: any, i: number) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow text-center">
            <div className="text-4xl mb-3">{m.emoji}</div>
            <h3 className="text-sm font-bold text-gray-800 mb-0.5">{m.name}</h3>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--brand-primary)' }}>{m.role}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{m.bio}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
        <p className="text-sm font-bold text-gray-800 mb-1">Want to join us?</p>
        <p className="text-xs text-gray-500 mb-4">We're always looking for talented people who share our passion.</p>
        <Link href="/pages/careers"
          className="inline-block px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-primary)' }}>
          View Open Roles
        </Link>
      </div>
    </div>
  )
}

const OPEN_ROLES = [
  { title: 'Customer Support Specialist', dept: 'Operations', type: 'Full-time', location: 'Lagos', desc: 'Handle customer enquiries via WhatsApp, email, and phone. Resolve issues with speed and empathy.' },
  { title: 'Logistics Coordinator',       dept: 'Logistics',  type: 'Full-time', location: 'Lagos', desc: 'Coordinate last-mile delivery with courier partners and ensure on-time fulfilment.' },
  { title: 'Social Media Manager',        dept: 'Marketing',  type: 'Full-time', location: 'Remote', desc: 'Grow our presence on Instagram, TikTok, and Twitter. Create content that converts.' },
  { title: 'Frontend Developer',          dept: 'Technology', type: 'Full-time', location: 'Remote', desc: 'Build and improve our storefront and admin tools using Next.js and Tailwind CSS.' },
  { title: 'Sales Account Executive',     dept: 'Sales',      type: 'Full-time', location: 'Lagos', desc: 'Onboard new vendor partners and grow the product catalogue across categories.' },
]

function CareersContent({ data }: { data?: any }) {
  const jobs  = data?.jobs  ?? OPEN_ROLES
  const intro = data?.intro ?? `We're building the future of e-commerce — and we want exceptional people to build it with us. We offer competitive pay, remote flexibility, and real ownership of your work.`

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-gray-600 leading-relaxed">{intro}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { emoji: '💰', label: 'Competitive pay' },
          { emoji: '🏠', label: 'Flexible / remote' },
          { emoji: '📈', label: 'Equity for key roles' },
        ].map(p => (
          <div key={p.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{p.emoji}</div>
            <p className="text-xs font-semibold text-gray-700">{p.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-bold text-gray-800 pt-2">Open Roles</h2>
      <div className="space-y-3">
        {jobs.map((role: any, i: number) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-sm font-bold text-gray-800">{role.title}</h3>
              <div className="flex gap-1.5 shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{role.type}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{role.location}</span>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{role.dept}</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{role.desc}</p>
            <Link href="/pages/contact"
              className="text-xs font-bold transition-opacity hover:opacity-80"
              style={{ color: 'var(--brand-primary)' }}>
              Apply now →
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-800 mb-1">Don't see the right role?</p>
        <p className="text-xs text-gray-500 mb-3">Send us your CV and tell us how you can contribute.</p>
        <Link href="/pages/contact"
          className="inline-block px-5 py-2 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-primary)' }}>
          Contact Us
        </Link>
      </div>
    </div>
  )
}

function AffiliateContent() {
  const steps = [
    { step: '01', title: 'Sign Up',       desc: 'Apply for our affiliate programme. Approval takes 24–48 hours.' },
    { step: '02', title: 'Get Your Link', desc: 'Receive a unique referral link and promotional materials.' },
    { step: '03', title: 'Promote',       desc: 'Share products on your blog, social media, or WhatsApp.' },
    { step: '04', title: 'Earn',          desc: 'Earn a commission on every sale driven by your link.' },
  ]
  return (
    <div className="max-w-2xl space-y-8">
      {/* Hero stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: 'Up to 10%', label: 'Commission rate' },
          { value: '30 days',   label: 'Cookie window'   },
          { value: 'Monthly',   label: 'Payout cycle'    },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-xl font-extrabold text-gray-800 mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4">How It Works</h2>
        <div className="space-y-4">
          {steps.map(s => (
            <div key={s.step} className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                style={{ backgroundColor: 'var(--brand-primary)' }}>
                {s.step}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-0.5">{s.title}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">Who This Is For</h2>
        <ul className="space-y-1.5">
          {['Bloggers and content creators', 'Social media influencers', 'WhatsApp broadcast list owners', 'Deal and coupon websites', 'Anyone with an audience interested in shopping'].map(item => (
            <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500 font-bold">✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl p-6 text-white text-center" style={{ backgroundColor: 'var(--brand-primary)' }}>
        <h3 className="text-lg font-extrabold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Ready to start earning?</h3>
        <p className="text-sm text-white/70 mb-4">Join our affiliate programme and earn every time someone buys through your link.</p>
        <Link href="/pages/contact"
          className="inline-block px-8 py-3 text-sm font-bold bg-white rounded-lg transition-opacity hover:opacity-90"
          style={{ color: 'var(--brand-primary)' }}>
          Apply Now
        </Link>
      </div>
    </div>
  )
}

function PartnershipContent() {
  const types = [
    { emoji: '🏪', title: 'Vendor / Supplier',      desc: 'List your products on our platform and reach thousands of customers across Nigeria.' },
    { emoji: '🚚', title: 'Logistics Partner',       desc: 'Help us fulfil last-mile delivery across states. We need reliable courier partners.' },
    { emoji: '💳', title: 'Payment & Fintech',       desc: 'Integrate your payment or BNPL solution with our checkout for mutual growth.' },
    { emoji: '📢', title: 'Marketing & Media',       desc: 'Co-marketing, sponsored placements, or brand collaborations that reach our audience.' },
    { emoji: '🏢', title: 'Corporate Procurement',   desc: 'Source products in bulk for your office, staff, or business operations at preferential rates.' },
    { emoji: '🤝', title: 'Strategic Alliances',     desc: 'Long-term partnerships that create shared value and expand our collective reach.' },
  ]
  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-gray-600 leading-relaxed">
        We believe in building together. Whether you're a supplier, logistics provider, tech company, or media brand — there's a partnership model that works for both of us.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {types.map(t => (
          <div key={t.title} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="text-2xl mb-2">{t.emoji}</div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">{t.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Interested in partnering with us?</h3>
        <p className="text-xs text-gray-500 mb-4">Tell us about your organisation, the type of partnership you have in mind, and how we can create value together.</p>
        <Link href="/pages/contact"
          className="inline-block px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-primary)' }}>
          Send Partnership Enquiry
        </Link>
      </div>
    </div>
  )
}

function StoreLocationContent({ data }: { data?: any }) {
  const address       = data?.address        || client.address || 'Lagos, Nigeria'
  const directions    = data?.directions     || `We're conveniently located on the main commercial strip. Bus stops within 200m. Parking available on-site.`
  const hoursWeekday  = data?.hours_weekday  || '9:00 AM – 6:00 PM'
  const hoursSaturday = data?.hours_saturday || '10:00 AM – 4:00 PM'
  const mapUrl        = data?.map_embed_url  || ''

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Address</p>
          <p className="text-sm text-gray-700 leading-relaxed">{address}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Opening Hours</p>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between"><span>Monday – Friday</span><span className="font-semibold">{hoursWeekday}</span></div>
            <div className="flex justify-between"><span>Saturday</span><span className="font-semibold">{hoursSaturday}</span></div>
            <div className="flex justify-between text-gray-400"><span>Sunday</span><span>Closed</span></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact</p>
          <div className="space-y-1 text-sm text-gray-700">
            {client.phone && <p>📞 {client.phone}</p>}
            {client.email && <p>✉️ {client.email}</p>}
            {client.whatsapp && (
              <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-green-600 font-semibold hover:underline">
                💬 WhatsApp Us
              </a>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Getting Here</p>
          <p className="text-sm text-gray-600 leading-relaxed">{directions}</p>
        </div>
      </div>

      <div className="bg-gray-100 rounded-xl overflow-hidden" style={{ height: '260px' }}>
        {mapUrl ? (
          <iframe src={mapUrl} width="100%" height="260" style={{ border: 0 }} allowFullScreen loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-4xl">📍</span>
            <p className="text-sm font-medium text-gray-500">Map view</p>
            <p className="text-xs text-gray-400">Add a Google Maps embed URL in Admin → Pages</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/pages/contact"
          className="inline-block px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-primary)' }}>
          Contact Us
        </Link>
        {client.whatsapp && (
          <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg transition-colors hover:bg-green-100">
            WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Page map ─────────────────────────────────────────────────────────────────

function getPage(slug: string): { title: string; description: string; node: React.ReactNode } | null {
  switch (slug) {
    case 'privacy':
      return { title: 'Privacy Policy', description: `How ${client.name} collects and protects your personal information.`, node: <PrivacyContent /> }
    case 'terms':
      return { title: 'Terms & Conditions', description: `Terms of service for shopping at ${client.name}.`, node: <TermsContent /> }
    case 'shipping':
      return { title: 'Shipping Information', description: `Delivery zones, timeframes, and costs for ${client.name} orders.`, node: <ShippingContent /> }
    case 'returns':
      return { title: 'Returns & Refunds', description: `Return policy and refund process at ${client.name}.`, node: <ReturnsContent /> }
    case 'support':
      return { title: 'Support Center', description: `Get help from the ${client.name} team.`, node: <SupportContent /> }
    case 'faq':
      return { title: 'Frequently Asked Questions', description: `Common questions about shopping at ${client.name}.`, node: <FaqPageContent /> }
    case 'about':
      return { title: `About ${client.name}`, description: `Learn about our story, mission, and values.`, node: null }  // redirected below
    case 'contact':
      return { title: 'Contact Us', description: `Get in touch with the ${client.name} team.`, node: null }              // redirected below
    case 'team':
      return { title: 'Our Team', description: `Meet the people behind ${client.name}.`, node: <TeamContent /> }
    case 'careers':
      return { title: 'Careers', description: `Join the ${client.name} team.`, node: <CareersContent /> }
    case 'affiliate':
      return { title: 'Affiliate Program', description: `Earn commissions by promoting ${client.name}.`, node: <AffiliateContent /> }
    case 'sell':
      return { title: `Sell on ${client.name}`, description: `List your products on ${client.name}.`, node: <PartnershipContent /> }
    case 'advertise':
      return { title: 'Advertise With Us', description: `Reach our audience through ${client.name}.`, node: <AffiliateContent /> }
    case 'partnership':
      return { title: 'Partnership', description: `Partner with ${client.name}.`, node: <PartnershipContent /> }
    case 'store-location':
      return { title: 'Store Location', description: `Find ${client.name} — our address, hours, and directions.`, node: <StoreLocationContent /> }
    default:
      return null
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = getPage(slug)
  if (!page) return { title: `${client.name}` }
  return {
    title: `${page.title} | ${client.name}`,
    description: page.description,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Redirect to dedicated pages
  if (slug === 'about')   redirect('/about')
  if (slug === 'contact') redirect('/contact')

  const page = getPage(slug)
  if (!page) notFound()

  // Fetch saved content from Supabase
  const savedData = await getPageContent(slug)

  // Resolve the content node — structured pages pass savedData as props
  function resolveNode() {
    switch (slug) {
      case 'faq':
        return <FaqPageContent customItems={savedData?.items} />
      case 'support':
        return <SupportContent data={savedData} />
      case 'team':
        return <TeamContent data={savedData} />
      case 'careers':
        return <CareersContent data={savedData} />
      case 'store-location':
        return <StoreLocationContent data={savedData} />
      case 'returns':
      case 'terms':
      case 'privacy':
        return savedData?.content
          ? <RichText text={savedData.content} />
          : page.node
      default:
        return page.node
    }
  }

  return (
    <>
      <Header />
      <PageBox>
        <div className="px-6 py-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700">{page.title}</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {page.title}
          </h1>
          <p className="text-sm text-gray-500 mb-8">{page.description}</p>
          {resolveNode()}
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
