'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      <Printer size={14} />
      Print / Save PDF
    </button>
  )
}
