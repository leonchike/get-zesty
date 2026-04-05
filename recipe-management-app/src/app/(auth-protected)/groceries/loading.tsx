export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="h-8 w-48 rounded skeleton-shimmer" />
      <div className="h-12 w-full rounded-lg skeleton-shimmer" />
      <div className="space-y-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 w-full rounded-lg skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}
