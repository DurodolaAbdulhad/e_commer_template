import type { Metadata } from 'next'
import { client } from '@/config/client'

export const metadata: Metadata = {
  title: `Blog | ${client.name}`,
  description: `Tips, guides and stories from the ${client.name} team. Stay up to date with the latest trends.`,
  openGraph: {
    title: `Blog | ${client.name}`,
    description: `Tips, guides and stories from the ${client.name} team.`,
    images: [client.seo.ogImage],
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
