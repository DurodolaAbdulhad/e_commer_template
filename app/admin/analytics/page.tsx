'use client'

import { useEffect, useState } from 'react'
import { getAnalytics } from '@/lib/admin-db'
import { BarChart2, Users, Eye, Smartphone, Monitor, Tablet } from 'lucide-react'

const ACCENT = '#e84c3d'

type Analytics = {
  todayVisitors: number
  weekVisitors:  number
  totalViews:    number
  daily: { date: string; label: string; visitors: number }[]
  topPages: { path: string; count: number }[]
  deviceCounts: { mobile: number; tablet: number; desktop: number }
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: number | string; sub?: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${ACCENT}15` }}>
        <Icon size={18} style={{ color: ACCENT }} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value.toLocaleString()}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function BarChart({ data }: { data: Analytics['daily'] }) {
  const max = Math.max(...data.map(d => d.visitors), 1)
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-5">Unique Visitors — Last 7 Days</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map(d => {
          const pct = Math.round((d.visitors / max) * 100)
          const isToday = d.date === new Date().toISOString().slice(0, 10)
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-700">{d.visitors > 0 ? d.visitors : ''}</span>
              <div className="w-full rounded-t-lg transition-all duration-500 flex items-end"
                style={{
                  height: `${Math.max(pct, 4)}%`,
                  backgroundColor: isToday ? ACCENT : '#e5e7eb',
                  minHeight: '4px',
                }} />
              <span className="text-[10px] text-gray-400 font-medium"
                style={{ color: isToday ? ACCENT : undefined }}>{d.label}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: ACCENT }} /> Today
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block bg-gray-200" /> Previous days
        </span>
      </div>
    </div>
  )
}

function DeviceBreakdown({ counts }: { counts: Analytics['deviceCounts'] }) {
  const total = (counts.mobile ?? 0) + (counts.tablet ?? 0) + (counts.desktop ?? 0) || 1
  const items = [
    { key: 'mobile',  label: 'Mobile',  icon: Smartphone, count: counts.mobile  ?? 0, color: ACCENT },
    { key: 'desktop', label: 'Desktop', icon: Monitor,    count: counts.desktop ?? 0, color: '#6366f1' },
    { key: 'tablet',  label: 'Tablet',  icon: Tablet,     count: counts.tablet  ?? 0, color: '#0ea5e9' },
  ]
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-5">Device Breakdown (7 days)</h3>
      <div className="space-y-3.5">
        {items.map(item => {
          const pct = Math.round((item.count / total) * 100)
          const Icon = item.icon
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon size={13} style={{ color: item.color }} />
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800">{item.count.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: item.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopPages({ pages }: { pages: Analytics['topPages'] }) {
  const max = Math.max(...pages.map(p => p.count), 1)
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-4">Top Pages (7 days)</h3>
      {pages.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No page view data yet</p>
      ) : (
        <div className="space-y-2.5">
          {pages.map(p => {
            const pct = Math.round((p.count / max) * 100)
            const label = p.path === '/' ? 'Home' : p.path.replace(/^\//, '').replace(/-/g, ' ') || p.path
            return (
              <div key={p.path} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-gray-700 truncate font-medium capitalize">{label}</span>
                    <span className="text-xs font-bold text-gray-600 ml-2 flex-shrink-0">{p.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: `${ACCENT}80` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    getAnalytics().then(res => {
      if (res) setData(res as Analytics)
      else setError(true)
      setLoading(false)
    }).catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
    </div>
  )

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <BarChart2 size={36} className="text-gray-200" />
      <p className="text-sm font-semibold text-gray-500">Analytics not available</p>
      <p className="text-xs text-gray-400 text-center max-w-sm">
        Run the Supabase migration SQL to create the <code className="font-mono">page_views</code> table,
        then visitor data will start appearing here.
      </p>
    </div>
  )

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Visitors Today"     value={data.todayVisitors} sub="Unique sessions" icon={Users} />
        <StatCard label="Visitors This Week" value={data.weekVisitors}  sub="Last 7 days"    icon={Users} />
        <StatCard label="Total Page Views"   value={data.totalViews}    sub="All time"        icon={Eye}   />
      </div>

      {/* 7-day chart */}
      <BarChart data={data.daily} />

      {/* Devices + Top pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DeviceBreakdown counts={data.deviceCounts} />
        <TopPages pages={data.topPages} />
      </div>

      <p className="text-[10px] text-gray-300 text-center">
        Data refreshes on page load · Admin visits not counted
      </p>
    </div>
  )
}
