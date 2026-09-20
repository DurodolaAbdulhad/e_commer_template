import { Truck, RotateCcw, CreditCard, Headphones } from 'lucide-react'
import { client } from '@/config/client'
import { industries } from '@/config/industries'

const iconMap: Record<string, React.ReactNode> = {
  truck: <Truck size={28} strokeWidth={1.5} />,
  'rotate-ccw': <RotateCcw size={28} strokeWidth={1.5} />,
  headphones: <Headphones size={28} strokeWidth={1.5} />,
  lock: <CreditCard size={28} strokeWidth={1.5} />,
  'shield-check': <CreditCard size={28} strokeWidth={1.5} />,
  'package-check': <Truck size={28} strokeWidth={1.5} />,
  zap: <Truck size={28} strokeWidth={1.5} />,
  leaf: <Truck size={28} strokeWidth={1.5} />,
  thermometer: <CreditCard size={28} strokeWidth={1.5} />,
  'badge-check': <CreditCard size={28} strokeWidth={1.5} />,
  heart: <RotateCcw size={28} strokeWidth={1.5} />,
  gift: <RotateCcw size={28} strokeWidth={1.5} />,
  wrench: <Headphones size={28} strokeWidth={1.5} />,
}

// Subtitles per badge type
const subtitles: Record<string, string> = {
  'Free Delivery': `For all orders over ${client.currencySymbol}${client.shipping.freeAbove.toLocaleString()}`,
  '90 Days Return': 'If goods have problems',
  'Secure Payment': '100% secure payment',
  '24/7 Support': 'Dedicated support',
  'Easy Returns': 'Hassle-free returns',
  'Genuine Products': 'Certified authentic',
  'Fast Delivery': 'Same-day available',
  '1-Year Warranty': 'All electronics covered',
  'Farm Fresh': 'Direct from the farm',
  'Quality Assured': 'Inspected every order',
}

export default function TrustBadges() {
  const preset = industries[client.industry as keyof typeof industries] ?? industries.general
  const badges = preset.trustBadges

  return (
    <section className="border-t border-b border-gray-100 bg-white">
      <div className="px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-5">
              <div className="shrink-0 text-gray-400">
                {iconMap[badge.icon] ?? <Truck size={28} strokeWidth={1.5} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{badge.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {subtitles[badge.text] ?? 'We guarantee quality'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
