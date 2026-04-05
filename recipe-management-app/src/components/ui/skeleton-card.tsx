export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-surface border border-border/50">
      <div className="aspect-[4/3] skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonCardText() {
  return (
    <div className="rounded-xl p-4 bg-surface border border-border/50 space-y-3">
      <div className="h-5 w-3/4 rounded skeleton-shimmer" />
      <div className="h-4 w-full rounded skeleton-shimmer" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        <div className="h-6 w-20 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}
