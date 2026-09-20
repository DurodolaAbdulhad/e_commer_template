'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { client } from '@/config/client'
import { MapPin, Phone, Mail, MessageCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const ACCENT = 'var(--brand-primary)'

export default function ContactPage() {
  const [form,    setForm]    = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  function update(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
      toast.success('Message sent! We\'ll get back to you shortly.')
    }, 1000)
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
            <span className="text-gray-700">Contact</span>
          </nav>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Get in Touch
          </h1>
          <p className="text-sm text-gray-500 mb-8">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
            {/* Form */}
            <div>
              {sent ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={20} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">Message received!</h3>
                  <p className="text-sm text-green-600">We'll get back to you at <strong>{form.email}</strong> within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name <span className="text-red-400">*</span></label>
                      <input value={form.name} onChange={e => update('name', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                        placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email <span className="text-red-400">*</span></label>
                      <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                        placeholder="your@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
                    <input value={form.subject} onChange={e => update('subject', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                      placeholder="How can we help?" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message <span className="text-red-400">*</span></label>
                    <textarea value={form.message} onChange={e => update('message', e.target.value)}
                      rows={6}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
                      placeholder="Tell us more about your enquiry..." />
                  </div>
                  <button type="submit" disabled={loading}
                    className="px-8 py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: ACCENT }}>
                    {loading ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Info */}
            <aside className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-800">Contact Information</h3>
                {[
                  { icon: <MapPin size={15} />, label: 'Address', value: client.address },
                  { icon: <Phone size={15} />, label: 'Phone', value: client.phone },
                  { icon: <Mail size={15} />, label: 'Email', value: client.email },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: ACCENT }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {client.whatsapp && (
                <a href={`https://wa.me/${client.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#25D366' }}>
                  <MessageCircle size={20} />
                  <div>
                    <p className="text-sm font-bold">Chat on WhatsApp</p>
                    <p className="text-xs text-white/70">Fastest response — usually within minutes</p>
                  </div>
                </a>
              )}

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-700 mb-1">Business Hours</p>
                <p className="text-xs text-gray-500">Monday – Friday: 9am – 6pm</p>
                <p className="text-xs text-gray-500">Saturday: 10am – 4pm</p>
                <p className="text-xs text-gray-500">Sunday: Closed</p>
              </div>
            </aside>
          </div>
        </div>
      </PageBox>
      <Footer />
    </>
  )
}
