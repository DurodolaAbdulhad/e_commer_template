'use client'

interface Props {
  current: string
}

const sortOptions = [
  { value: '', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default function SortSelect({ current }: Props) {
  return (
    <select
      defaultValue={current}
      onChange={(e) => {
        const url = new URL(window.location.href)
        if (e.target.value) {
          url.searchParams.set('sort', e.target.value)
        } else {
          url.searchParams.delete('sort')
        }
        window.location.href = url.toString()
      }}
      className="text-sm border border-gray-200 rounded px-3 py-1.5 outline-none text-gray-600 cursor-pointer"
    >
      {sortOptions.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
