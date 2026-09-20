'use client'

import { MessageCircle } from 'lucide-react'
import { client } from '@/config/client'

export default function WhatsAppButton() {
  if (!client.features.whatsappChat) return null

  return (
    <a
      href={`https://wa.me/${client.whatsapp}?text=Hi! I need help with my order.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} className="text-white" />
    </a>
  )
}
