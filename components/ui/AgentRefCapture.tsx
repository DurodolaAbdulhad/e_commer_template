'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Captures ?ref=AGENTCODE from the URL and persists it to localStorage so
// the checkout page can attribute the order to the correct agent.
// Stored for 30 days; cleared after a successful order.
export default function AgentRefCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref) return
    const code = ref.trim().toUpperCase()
    if (!code) return
    try {
      localStorage.setItem('agent_ref', code)
      localStorage.setItem('agent_ref_ts', Date.now().toString())
    } catch {}
  }, [searchParams])

  return null
}
