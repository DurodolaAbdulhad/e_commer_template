export default function ShopLoading() {
  return (
    <div className="px-4 py-6 flex gap-6">
      {/* Sidebar skeleton */}
      <div className="hidden md:block w-52 shrink-0 space-y-6">
        {[3, 5, 3].map((lines, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-3" />
            {Array.from({ length: lines }).map((_, j) => (
              <div key={j} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
            ))}
          </div>
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="flex-1">
        <div className="flex justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-32" />
          <div className="h-8 bg-gray-100 rounded animate-pulse w-36" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
    </div>
  )
}
