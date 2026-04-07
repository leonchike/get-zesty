import { useRef, useEffect, useCallback, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, BookOpen, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { SearchResultItem } from '@/hooks/useSearchResults'

interface SearchDropdownProps {
  recipeResults: SearchResultItem[]
  cookbookResults: SearchResultItem[]
  isLoading: boolean
  isEmpty: boolean
  highlightIndex: number
  onSelect: (item: SearchResultItem) => void
}

export const SearchDropdown = forwardRef<HTMLDivElement, SearchDropdownProps>(
  function SearchDropdown(
    { recipeResults, cookbookResults, isLoading, isEmpty, highlightIndex, onSelect },
    ref
  ) {
    // Flatten for index-based highlighting
    const allItems = [...recipeResults, ...cookbookResults]

    return (
      <div
        ref={ref}
        className="absolute left-0 right-0 top-full mt-1.5 rounded-xl shadow-glass-lg border border-border overflow-hidden z-50 bg-popover"
      >
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin py-2">
          {isLoading ? (
            <div className="px-4 py-3 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <Search size={20} className="mx-auto mb-2 opacity-40" />
              No results found
            </div>
          ) : (
            <>
              {/* Recipe results */}
              {recipeResults.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Recipes
                  </p>
                  {recipeResults.map((item, i) => {
                    const globalIndex = i
                    return (
                      <ResultRow
                        key={item.id}
                        item={item}
                        icon={ChefHat}
                        isHighlighted={highlightIndex === globalIndex}
                        onClick={() => onSelect(item)}
                      />
                    )
                  })}
                </div>
              )}

              {/* Cookbook results */}
              {cookbookResults.length > 0 && (
                <div>
                  {recipeResults.length > 0 && (
                    <div className="mx-4 my-1 border-t border-border/50" />
                  )}
                  <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Cookbook Recipes
                  </p>
                  {cookbookResults.map((item, i) => {
                    const globalIndex = recipeResults.length + i
                    return (
                      <ResultRow
                        key={item.id}
                        item={item}
                        icon={BookOpen}
                        isHighlighted={highlightIndex === globalIndex}
                        onClick={() => onSelect(item)}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }
)

function ResultRow({
  item,
  icon: Icon,
  isHighlighted,
  onClick
}: {
  item: SearchResultItem
  icon: React.ComponentType<{ size: number; className?: string }>
  isHighlighted: boolean
  onClick: () => void
}): JSX.Element {
  const rowRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isHighlighted) {
      rowRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [isHighlighted])

  return (
    <button
      ref={rowRef}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
        isHighlighted ? 'bg-primary/10' : 'hover:bg-muted/60'
      )}
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
        )}
      </div>
      <Icon size={14} className="text-muted-foreground/40 flex-shrink-0" />
    </button>
  )
}
