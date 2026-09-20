export default function Loading() {
  return (
    <div className="px-4 py-10">
      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
            <div className="aspect-square bg-gray-100 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
