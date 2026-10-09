'use client'

import { useEffect, useState, useCallback } from 'react'
import { Star, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STAR_F = '#F5A623'
const STATUSES = ['', 'pending', 'approved', 'rejected']

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#fff7ed', text: '#c2410c', label: 'Pending' },
  approved: { bg: '#f0fdf4', text: '#16a34a', label: 'Approved' },
  rejected: { bg: '#f9fafb', text: '#6b7280', label: 'Rejected' },
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={12} height={12} viewBox="0 0 24 24" fill={s <= n ? STAR_F : '#e5e7eb'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews,  setReviews]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('')
  const [dbError,  setDbError]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setDbError(null)
    try {
      const url = `/api/admin/reviews${filter ? `?status=${encodeURIComponent(filter)}` : ''}`
      const res  = await fetch(url)
      const json = await res.json()
      if (!json.dbReady && !json.reviews?.length) {
        setDbError('Run the product_reviews migration SQL in your Supabase project.')
      }
      setReviews(json.reviews ?? [])
    } catch (e: any) {
      setDbError(e?.message ?? 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function setStatus(id: string, status: string) {
    const res  = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!res.ok) { toast.error('Failed to update'); return }
    toast.success(`Review ${status}`)
    load()
  }

  async function deleteReview(id: string) {
    if (!confirm('Delete this review? This cannot be undone.')) return
    const res = await fetch('/api/admin/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Review deleted')
    load()
  }

  const pending  = reviews.filter(r => r.status === 'pending').length
  const approved = reviews.filter(r => r.status === 'approved').length

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex gap-3">
        {[
          { label: 'Pending', value: pending,  color: '#c2410c', bg: '#fff7ed' },
          { label: 'Approved', value: approved, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Total', value: reviews.length, color: '#374151', bg: '#f9fafb' },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded-xl border border-gray-100 bg-white px-4 py-3">
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {dbError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Database not ready</p>
            <p className="text-xs mt-0.5">{dbError}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden w-fit">
        {STATUSES.map(s => (
          <button key={s || 'all'} onClick={() => setFilter(s)}
            className="px-4 py-2 text-xs font-medium transition-colors capitalize"
            style={{ backgroundColor: filter === s ? '#e84c3d' : 'transparent', color: filter === s ? '#fff' : '#6b7280' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center">
            <Star size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No reviews found.</p>
          </div>
        ) : (
          reviews.map(review => {
            const styles = STATUS_STYLES[review.status] ?? STATUS_STYLES.pending
            const date   = review.created_at
              ? new Date(review.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''

            return (
              <div key={review.id} className="px-5 py-4 border-b border-gray-50 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-800">{review.nickname}</p>
                      <Stars n={review.rating} />
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: styles.bg, color: styles.text }}>
                        {styles.label}
                      </span>
                      <span className="text-xs text-gray-400">{date}</span>
                    </div>
                    {review.products?.name && (
                      <p className="text-xs text-gray-400 mb-1">Product: {review.products.name}</p>
                    )}
                    {review.summary && (
                      <p className="text-sm font-medium text-gray-700 mb-0.5">{review.summary}</p>
                    )}
                    <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {review.status !== 'approved' && (
                      <button onClick={() => setStatus(review.id, 'approved')}
                        title="Approve"
                        className="p-1.5 rounded-lg hover:bg-green-50 transition-colors">
                        <CheckCircle size={16} className="text-green-600" />
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button onClick={() => setStatus(review.id, 'rejected')}
                        title="Reject"
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <XCircle size={16} className="text-gray-400" />
                      </button>
                    )}
                    <button onClick={() => deleteReview(review.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-gray-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
