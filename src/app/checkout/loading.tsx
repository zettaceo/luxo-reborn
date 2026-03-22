export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="bg-white rounded-3xl border border-rose-light p-7 animate-pulse">
          <div className="h-8 w-48 bg-rose-light rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_,i) => <div key={i} className="h-12 bg-rose-light rounded-xl" />)}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-rose-light p-6 h-64 animate-pulse" />
      </div>
    </div>
  )
}
