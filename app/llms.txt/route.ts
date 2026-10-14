import { client } from '@/config/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const text = `# ${client.name}

> ${client.tagline}

${client.name} is an online fashion and lifestyle store based in ${client.address || 'Lagos, Nigeria'}.
We sell premium products with fast delivery across Nigeria.

## What we sell

- Fashion accessories — belts, bags, shoes, and more
- Luxury perfumes and fragrances
- Eyewear and sunglasses
- Jewellery and watches
- Clothing and apparel

## How to shop

- Browse products at ${siteUrl}/shop
- Filter by category, price, and availability
- Pay securely with Paystack (card, bank transfer, USSD)
- Pay on delivery available
- Fast delivery: ${client.shipping?.estimatedDays || '2–7 business days'}
- Free shipping on orders above ₦${(client.shipping?.freeAbove ?? 50000).toLocaleString()}

## Contact

- Phone: ${client.phone || 'See website'}
- Email: ${client.email || 'See website'}
- Address: ${client.address || 'Lagos, Nigeria'}
- WhatsApp: ${client.whatsapp ? `https://wa.me/${client.whatsapp}` : 'See website'}

## Key pages

- Homepage: ${siteUrl}/
- Shop all products: ${siteUrl}/shop
- Collections: ${siteUrl}/shop/collections
- About us: ${siteUrl}/pages/about
- Contact: ${siteUrl}/pages/contact
- FAQ: ${siteUrl}/pages/faq
- Shipping policy: ${siteUrl}/pages/shipping
- Returns policy: ${siteUrl}/pages/returns

## Trust signals

- Secure checkout powered by Paystack
- Verified Nigerian business
- Physical store: ${client.address || 'Lagos, Nigeria'}
- Customer reviews on every product

## Policies

- Returns: 7-day return window on most items
- Privacy: ${siteUrl}/pages/privacy
- Terms: ${siteUrl}/pages/terms
`

  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
