import { SkeletonCard, SkeletonCardText } from "./skeleton-card";

export function SkeletonGrid({
  count = 8,
  variant = "image",
}: {
  count?: number;
  variant?: "image" | "text";
}) {
  const Card = variant === "image" ? SkeletonCard : SkeletonCardText;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

export function SkeletonRecipeDetail() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Hero image */}
      <div className="aspect-[16/9] max-h-[400px] rounded-xl skeleton-shimmer" />
      {/* Title */}
      <div className="h-8 w-2/3 rounded skeleton-shimmer" />
      {/* Metadata pills */}
      <div className="flex gap-3">
        <div className="h-8 w-24 rounded-full skeleton-shimmer" />
        <div className="h-8 w-20 rounded-full skeleton-shimmer" />
        <div className="h-8 w-28 rounded-full skeleton-shimmer" />
      </div>
      {/* Description */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-4/5 rounded skeleton-shimmer" />
      </div>
      {/* Content columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="space-y-3">
          <div className="h-6 w-24 rounded skeleton-shimmer" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
          ))}
        </div>
        <div className="md:col-span-2 space-y-3">
          <div className="h-6 w-28 rounded skeleton-shimmer" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
