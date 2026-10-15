'use client'

import { useEffect, useState } from 'react'

interface FxState {
  rate: number | null
  enabled: boolean
  loading: boolean
}

// Module-level cache so all mounted components share one fetch per page load.
let _cache: { rate: number | null; enabled: boolean } | null = null
let _promise: Promise<void> | null = null

function fetchOnce(): Promise<void> {
  if (_cache) return Promise.resolve()
  if (_promise) return _promise
  _promise = fetch('/api/fx/rate')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      _cache = { rate: data?.rate ?? null, enabled: Boolean(data?.enabled) }
    })
    .catch(() => {
      _cache = { rate: null, enabled: false }
    })
  return _promise
}

export function useFxRate(): FxState {
  const [state, setState] = useState<FxState>({
    rate: _cache?.rate ?? null,
    enabled: _cache?.enabled ?? false,
    loading: !_cache,
  })

  useEffect(() => {
    if (_cache) return
    fetchOnce().then(() => {
      setState({ rate: _cache!.rate, enabled: _cache!.enabled, loading: false })
    })
  }, [])

  return state
}
