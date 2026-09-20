'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { client } from '@/config/client'

const faqs = [
  {
    category: 'Orders & Shipping',
    items: [
      { q: 'How long does delivery take?', a: 'Standard delivery takes 2–5 business days within Lagos and 3–7 business days to other states. Express options may be available at checkout.' },
      { q: 'Can I track my order?', a: "Yes. Once your order ships, you'll receive a tracking link via email or SMS. You can also check your order status under My Account → Orders." },
      { q: 'Do you deliver nationwide?', a: 'Yes, we deliver to all 36 states in Nigeria. Delivery fees vary by location and are shown at checkout.' },
      { q: "What happens if I'm not home during delivery?", a: 'Our courier will attempt redelivery or call you to arrange an alternative time. You can also pick up from a designated location.' },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      { q: 'What is your return policy?', a: 'We accept returns within 7 days of delivery for items in original, unused condition with packaging intact. Perishables and personal hygiene items are excluded.' },
      { q: 'How do I initiate a return?', a: "Contact our support team via WhatsApp or email with your order number and reason for return. We'll guide you through the process." },
      { q: 'When will I get my refund?', a: 'Refunds are processed within 3–5 business days after we receive and inspect the returned item. Funds appear in your account within 5–10 working days depending on your bank.' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept debit/credit cards (Visa, Mastercard, Verve), bank transfers, and USSD via Paystack. Pay-on-delivery is available in select areas.' },
      { q: 'Is it safe to pay on your site?', a: "Absolutely. All payments are processed by Paystack, a PCI-DSS certified payment processor. We never store your card details." },
      { q: 'Can I pay in installments?', a: 'Installment options (BNPL) may be available via Paystack for eligible orders. This will be shown as an option at checkout if available.' },
    ],
  },
  {
    category: 'Products',
    items: [
      { q: 'Are all products genuine?', a: "Yes. We source directly from authorised distributors and verified suppliers. All products sold on our platform are 100% authentic." },
      { q: 'What if I receive a damaged item?', a: "Please take photos immediately and contact us within 24 hours of delivery. We'll arrange a replacement or full refund at no cost to you." },
      { q: "Can I get a product that's out of stock?", a: "Yes! Use the \"Notify me when back in stock\" feature on the product page and we'll email you the moment it's available again." },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-sm font-semibold text-gray-800">{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-500 leading-relaxed pb-4">{a}</p>}
    </div>
  )
}

export default function FaqPageContent({ customItems }: { customItems?: Array<{ q: string; a: string }> }) {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Frequently Asked Questions
      </h1>
      <p className="text-sm text-gray-500 mb-8">Everything you need to know about shopping with {client.name}.</p>

      <div className="max-w-2xl space-y-8">
        {customItems ? (
          /* Custom items from admin — flat list */
          <div>
            {customItems.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        ) : (
          /* Default hardcoded sections */
          faqs.map(section => (
            <div key={section.category}>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b border-gray-100"
                style={{ color: 'var(--brand-primary)' }}>
                {section.category}
              </h2>
              <div>
                {section.items.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="max-w-2xl mt-10 p-5 bg-gray-50 border border-gray-100 rounded-xl">
        <p className="text-sm font-semibold text-gray-800 mb-1">Still have questions?</p>
        <p className="text-xs text-gray-500 mb-3">Our team is ready to help — reach us anytime.</p>
        <Link href="/pages/contact"
          className="inline-block px-5 py-2 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-primary)' }}>
          Contact Us
        </Link>
      </div>
    </>
  )
}
