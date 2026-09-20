'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FileText, ChevronRight, Save, Check, Loader2,
  Plus, Trash2, GripVertical, ExternalLink,
} from 'lucide-react'
import { getStoreSetting, saveStoreSetting } from '@/lib/admin-db'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

// ─── Page definitions ─────────────────────────────────────────────────────────

const PAGES = [
  { slug: 'about',          label: 'About Us',          url: '/about',               type: 'about' },
  { slug: 'contact',        label: 'Contact',           url: '/contact',             type: 'contact' },
  { slug: 'store-location', label: 'Store Location',    url: '/pages/store-location',type: 'store' },
  { slug: 'team',           label: 'Our Team',          url: '/pages/team',          type: 'team' },
  { slug: 'careers',        label: 'Careers',           url: '/pages/careers',       type: 'careers' },
  { slug: 'faq',            label: 'FAQ',               url: '/faq',                 type: 'faq' },
  { slug: 'returns',        label: 'Returns & Refunds', url: '/pages/returns',       type: 'text' },
  { slug: 'terms',          label: 'Terms & Conditions',url: '/pages/terms',         type: 'text' },
  { slug: 'privacy',        label: 'Privacy Policy',    url: '/pages/privacy',       type: 'text' },
  { slug: 'support',        label: 'Support Centre',    url: '/pages/support',       type: 'support' },
]

// ─── Default content per page ─────────────────────────────────────────────────

function defaultsFor(slug: string, type: string): any {
  if (type === 'about') return {
    headline: `About ${client.name}`,
    tagline: `We're on a mission to make quality products accessible to everyone.`,
    story_1: `${client.name} was founded with a simple belief: shopping online should be easy, affordable, and reliable. We started small, curating only the products we'd buy ourselves — and grew into the store you see today.`,
    story_2: `We're proud to serve thousands of happy customers, with a constantly growing catalogue. Every decision we make is guided by what's best for you.`,
    mission: `Our mission is to deliver the best products at the best prices, backed by exceptional customer service.`,
  }
  if (type === 'contact') return {
    intro: `Have a question or need help with your order? Our team is here for you.`,
    phone: client.phone,
    email: client.email,
    address: client.address,
    hours_weekday: '9:00 AM – 6:00 PM',
    hours_saturday: '10:00 AM – 4:00 PM',
  }
  if (type === 'store') return {
    address: client.address,
    landmark: '',
    hours_weekday: '9:00 AM – 6:00 PM',
    hours_saturday: '10:00 AM – 4:00 PM',
    map_embed_url: '',
    directions: `We're conveniently located on the main commercial strip. Bus stops within 200m. Parking available on-site.`,
  }
  if (type === 'support') return {
    intro: `Our support team is available to help you with any questions about your order, returns, or products.`,
    email: client.email,
    phone: client.phone,
    hours: 'Monday – Friday, 9 AM – 6 PM WAT',
    response_time: 'We typically reply within 2 hours on business days.',
  }
  if (type === 'faq') return {
    items: [
      { q: 'How do I place an order?', a: 'Browse our store, add items to your cart, then proceed to checkout and complete payment.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major debit cards, bank transfers, and USSD payments via Paystack.' },
      { q: 'How long does delivery take?', a: `Standard delivery takes ${client.shipping?.estimatedDays ?? '2–5 business days'} depending on your location.` },
      { q: 'Can I return an item?', a: 'Yes. Items can be returned within 7 days of delivery if unused and in original packaging. See our returns policy for details.' },
      { q: 'How do I track my order?', a: 'You will receive an SMS and email with tracking details once your order is dispatched.' },
    ],
  }
  if (type === 'team') return {
    intro: `Meet the passionate people who make ${client.name} what it is.`,
    members: [
      { name: 'Founder & CEO', role: 'Founder & CEO', bio: `Founded ${client.name} with a vision to make quality shopping accessible to all.`, emoji: '👑' },
      { name: 'Head of Operations', role: 'Head of Operations', bio: 'Ensures every order is fulfilled on time and every customer is satisfied.', emoji: '⚙️' },
      { name: 'Customer Care Lead', role: 'Customer Care Lead', bio: 'First point of contact for all customer enquiries and resolutions.', emoji: '💬' },
    ],
  }
  if (type === 'careers') return {
    intro: `We're building something great and we'd love you to be part of it.`,
    jobs: [
      { title: 'Customer Service Representative', type: 'Full-time', dept: 'Operations', location: 'Lagos', desc: 'Handle customer enquiries across phone, email, and social media.' },
      { title: 'Social Media Manager', type: 'Full-time', dept: 'Marketing', location: 'Remote', desc: 'Create and manage content across Instagram, Twitter, and TikTok.' },
    ],
  }
  if (type === 'text') {
    if (slug === 'returns') return { content: `Returns are accepted within 7 days of delivery. Items must be unused, in original packaging, with tags attached.\n\nTo initiate a return, contact us at ${client.email} with your order number and reason for return. Once approved, you will receive return instructions.\n\nRefunds are processed within 3–5 business days after we receive the returned item. Delivery fees are non-refundable.\n\nItems purchased on sale are final and cannot be returned unless faulty.` }
    if (slug === 'terms') return { content: `By placing an order on ${client.name}, you agree to these terms.\n\n**Orders & Payment**\nAll prices are in Nigerian Naira (₦). Payment must be completed before orders are processed. We reserve the right to cancel any order due to stock availability or payment issues.\n\n**Delivery**\nWe aim to deliver within the timeframe stated at checkout. Delays caused by third-party couriers are outside our control.\n\n**Returns**\nPlease see our Returns & Refunds policy for full details.\n\n**Intellectual Property**\nAll content on this site belongs to ${client.name} and may not be reproduced without written permission.\n\n**Contact**\nFor any questions, reach us at ${client.email}.` }
    if (slug === 'privacy') return { content: `At ${client.name}, we are committed to protecting your personal information.\n\n**What We Collect**\nWe collect your name, email, phone number, delivery address, and payment details when you place an order.\n\n**How We Use It**\nYour information is used to process orders, send updates, and improve our services. We do not sell your data.\n\n**Security**\nPayments are processed by Paystack (PCI-DSS certified). We never store card details.\n\n**Your Rights**\nYou may request access to, correction of, or deletion of your data at any time by emailing ${client.email}.\n\n**Cookies**\nWe use cookies to improve your shopping experience. You can disable them in your browser settings.` }
    return { content: '' }
  }
  return {}
}

// ─── Field editors ────────────────────────────────────────────────────────────

function TextField({ label, value, onChange, multiline = false, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-y"
          style={{ focusRingColor: 'var(--brand-primary)' } as any}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-0"
        />
      )}
    </div>
  )
}

function AboutEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const set = (k: string) => (v: string) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-4">
      <TextField label="Page Headline" value={data.headline ?? ''} onChange={set('headline')} />
      <TextField label="Tagline / Hero Subtitle" value={data.tagline ?? ''} onChange={set('tagline')} multiline rows={2} />
      <TextField label="Our Story — Paragraph 1" value={data.story_1 ?? ''} onChange={set('story_1')} multiline rows={4} />
      <TextField label="Our Story — Paragraph 2" value={data.story_2 ?? ''} onChange={set('story_2')} multiline rows={4} />
      <TextField label="Mission Statement" value={data.mission ?? ''} onChange={set('mission')} multiline rows={3} />
    </div>
  )
}

function ContactEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const set = (k: string) => (v: string) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-4">
      <TextField label="Intro Text" value={data.intro ?? ''} onChange={set('intro')} multiline rows={2} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Phone Number" value={data.phone ?? ''} onChange={set('phone')} />
        <TextField label="Email Address" value={data.email ?? ''} onChange={set('email')} />
      </div>
      <TextField label="Address" value={data.address ?? ''} onChange={set('address')} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Hours (Mon – Fri)" value={data.hours_weekday ?? ''} onChange={set('hours_weekday')} />
        <TextField label="Hours (Saturday)" value={data.hours_saturday ?? ''} onChange={set('hours_saturday')} />
      </div>
    </div>
  )
}

function StoreEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const set = (k: string) => (v: string) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-4">
      <TextField label="Street Address" value={data.address ?? ''} onChange={set('address')} />
      <TextField label="Landmark / Directions Help" value={data.landmark ?? ''} onChange={set('landmark')} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Hours (Mon – Fri)" value={data.hours_weekday ?? ''} onChange={set('hours_weekday')} />
        <TextField label="Hours (Saturday)" value={data.hours_saturday ?? ''} onChange={set('hours_saturday')} />
      </div>
      <TextField label="Getting Here (directions text)" value={data.directions ?? ''} onChange={set('directions')} multiline rows={3} />
      <TextField label="Google Maps Embed URL (optional)" value={data.map_embed_url ?? ''} onChange={set('map_embed_url')} />
    </div>
  )
}

function SupportEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const set = (k: string) => (v: string) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-4">
      <TextField label="Intro Text" value={data.intro ?? ''} onChange={set('intro')} multiline rows={3} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Email" value={data.email ?? ''} onChange={set('email')} />
        <TextField label="Phone" value={data.phone ?? ''} onChange={set('phone')} />
      </div>
      <TextField label="Support Hours" value={data.hours ?? ''} onChange={set('hours')} />
      <TextField label="Response Time Note" value={data.response_time ?? ''} onChange={set('response_time')} />
    </div>
  )
}

function TextPageEditor({ data, onChange, slug }: { data: any; onChange: (d: any) => void; slug: string }) {
  const labels: Record<string, string> = {
    returns: 'Returns & Refunds Policy',
    terms:   'Terms & Conditions',
    privacy: 'Privacy Policy',
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Use **bold** for headings. Each paragraph on a new line.</p>
      <TextField
        label={labels[slug] ?? 'Page Content'}
        value={data.content ?? ''}
        onChange={v => onChange({ ...data, content: v })}
        multiline
        rows={20}
      />
    </div>
  )
}

function FaqEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const items: Array<{ q: string; a: string }> = data.items ?? []

  function update(i: number, field: 'q' | 'a', val: string) {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item)
    onChange({ ...data, items: next })
  }
  function add() {
    onChange({ ...data, items: [...items, { q: '', a: '' }] })
  }
  function remove(i: number) {
    onChange({ ...data, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 size={14} />
            </button>
          </div>
          <TextField label="Question" value={item.q} onChange={v => update(i, 'q', v)} />
          <TextField label="Answer" value={item.a} onChange={v => update(i, 'a', v)} multiline rows={3} />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 w-full justify-center transition-colors"
      >
        <Plus size={16} /> Add Question
      </button>
    </div>
  )
}

function TeamEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const members: Array<{ name: string; role: string; bio: string; emoji: string }> = data.members ?? []

  function update(i: number, k: string, v: string) {
    const next = members.map((m, idx) => idx === i ? { ...m, [k]: v } : m)
    onChange({ ...data, members: next })
  }
  function add() {
    onChange({ ...data, members: [...members, { name: '', role: '', bio: '', emoji: '👤' }] })
  }
  function remove(i: number) {
    onChange({ ...data, members: members.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <TextField label="Section Intro" value={data.intro ?? ''} onChange={v => onChange({ ...data, intro: v })} multiline rows={2} />
      {members.map((m, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Member {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <TextField label="Emoji / Icon" value={m.emoji} onChange={v => update(i, 'emoji', v)} />
            <div className="col-span-2">
              <TextField label="Name" value={m.name} onChange={v => update(i, 'name', v)} />
            </div>
          </div>
          <TextField label="Role / Title" value={m.role} onChange={v => update(i, 'role', v)} />
          <TextField label="Bio" value={m.bio} onChange={v => update(i, 'bio', v)} multiline rows={2} />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 w-full justify-center transition-colors"
      >
        <Plus size={16} /> Add Team Member
      </button>
    </div>
  )
}

function CareersEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const jobs: Array<{ title: string; type: string; dept: string; location: string; desc: string }> = data.jobs ?? []

  function update(i: number, k: string, v: string) {
    const next = jobs.map((j, idx) => idx === i ? { ...j, [k]: v } : j)
    onChange({ ...data, jobs: next })
  }
  function add() {
    onChange({ ...data, jobs: [...jobs, { title: '', type: 'Full-time', dept: '', location: 'Lagos', desc: '' }] })
  }
  function remove(i: number) {
    onChange({ ...data, jobs: jobs.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <TextField label="Section Intro" value={data.intro ?? ''} onChange={v => onChange({ ...data, intro: v })} multiline rows={2} />
      {jobs.map((j, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 size={14} />
            </button>
          </div>
          <TextField label="Job Title" value={j.title} onChange={v => update(i, 'title', v)} />
          <div className="grid grid-cols-3 gap-3">
            <TextField label="Type" value={j.type} onChange={v => update(i, 'type', v)} />
            <TextField label="Department" value={j.dept} onChange={v => update(i, 'dept', v)} />
            <TextField label="Location" value={j.location} onChange={v => update(i, 'location', v)} />
          </div>
          <TextField label="Description" value={j.desc} onChange={v => update(i, 'desc', v)} multiline rows={3} />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 w-full justify-center transition-colors"
      >
        <Plus size={16} /> Add Job Opening
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPagesEditor() {
  const [activeSlug, setActiveSlug] = useState(PAGES[0].slug)
  const [pageData, setPageData]     = useState<Record<string, any>>({})
  const [loading,  setLoading]      = useState<Record<string, boolean>>({})
  const [saving,   setSaving]       = useState(false)
  const [saved,    setSaved]        = useState(false)

  const activePage = PAGES.find(p => p.slug === activeSlug)!

  // Load content for active page
  useEffect(() => {
    if (pageData[activeSlug] !== undefined) return
    setLoading(l => ({ ...l, [activeSlug]: true }))
    getStoreSetting(`page_${activeSlug}`).then(raw => {
      const defaults = defaultsFor(activeSlug, activePage.type)
      const merged   = raw ? { ...defaults, ...raw } : defaults
      setPageData(d => ({ ...d, [activeSlug]: merged }))
    }).finally(() => setLoading(l => ({ ...l, [activeSlug]: false })))
  }, [activeSlug])

  function onChange(data: any) {
    setSaved(false)
    setPageData(d => ({ ...d, [activeSlug]: data }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveStoreSetting(`page_${activeSlug}`, pageData[activeSlug])
      setSaved(true)
      toast.success('Page saved!')
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const data    = pageData[activeSlug]
  const isLoading = loading[activeSlug]

  function renderEditor() {
    if (isLoading || !data) return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading…
      </div>
    )
    switch (activePage.type) {
      case 'about':   return <AboutEditor   data={data} onChange={onChange} />
      case 'contact': return <ContactEditor data={data} onChange={onChange} />
      case 'store':   return <StoreEditor   data={data} onChange={onChange} />
      case 'support': return <SupportEditor data={data} onChange={onChange} />
      case 'faq':     return <FaqEditor     data={data} onChange={onChange} />
      case 'team':    return <TeamEditor    data={data} onChange={onChange} />
      case 'careers': return <CareersEditor data={data} onChange={onChange} />
      case 'text':    return <TextPageEditor data={data} onChange={onChange} slug={activeSlug} />
      default:        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Pages Editor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Edit the content shown on each public page of your store.</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {PAGES.map(page => (
                <button
                  key={page.slug}
                  onClick={() => { setActiveSlug(page.slug); setSaved(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors border-b border-gray-50 last:border-0 ${
                    activeSlug === page.slug
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={activeSlug === page.slug ? { backgroundColor: 'var(--brand-primary)' } : {}}
                >
                  <FileText size={14} className="shrink-0" />
                  {page.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{activePage.label}</h2>
                  <a
                    href={activePage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-0.5"
                  >
                    <ExternalLink size={11} /> {activePage.url}
                  </a>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ backgroundColor: saved ? '#16a34a' : 'var(--brand-primary)' }}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
                  {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Page'}
                </button>
              </div>

              {/* Editor body */}
              <div className="px-6 py-6">
                {renderEditor()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
