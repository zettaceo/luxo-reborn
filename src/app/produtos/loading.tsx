export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="h-10 w-48 bg-rose-light rounded animate-pulse mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-rose-light" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-rose-light rounded w-1/3" />
              <div className="h-4 bg-rose-light rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
