import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

function buildUrl(searchParams: Record<string, string | undefined>, page: number) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v && k !== 'page') p.set(k, v)
  }
  if (page > 1) p.set('page', String(page))
  const qs = p.toString()
  return `/shop${qs ? `?${qs}` : ''}`
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)
  return pages
}

export default function ShopPagination({ currentPage, totalPages, searchParams }: Props) {
  const pages = getPageNumbers(currentPage, totalPages)

  const btnBase = "flex items-center justify-center w-9 h-9 rounded text-sm font-medium transition-colors"
  const btnActive = "text-white"
  const btnInactive = "border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800"
  const btnDisabled = "border border-gray-100 text-gray-300 cursor-not-allowed pointer-events-none"

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 mb-4">
      {/* Prev */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(searchParams, currentPage - 1)}
          className={`${btnBase} ${btnInactive}`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`}>
          <ChevronLeft size={16} />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="flex items-center justify-center w-9 h-9 text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(searchParams, p)}
            className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
            style={p === currentPage ? { backgroundColor: 'var(--brand-secondary)' } : {}}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(searchParams, currentPage + 1)}
          className={`${btnBase} ${btnInactive}`}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`}>
          <ChevronRight size={16} />
        </span>
      )}
    </div>
  )
}
