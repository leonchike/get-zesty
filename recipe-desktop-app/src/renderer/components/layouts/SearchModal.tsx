import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChefHat, BookOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchResults, type SearchResultItem } from '@/hooks/useSearchResults'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps): JSX.Element | null {
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { recipeResults, cookbookResults, isLoading, isEmpty, isActive } =
    useSearchResults(query)
  const allItems: SearchResultItem[] = [...recipeResults, ...cookbookResults]

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setHighlightIndex(-1)
    }
  }, [isOpen])

  // Reset highlight on results change
  useEffect(() => {
    setHighlightIndex(-1)
  }, [recipeResults.length, cookbookResults.length])

  const selectResult = useCallback(
    (item: SearchResultItem) => {
      navigate(item.href)
      onClose()
    },
    [navigate, onClose]
  )

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        allItems.length > 0 ? (prev < allItems.length - 1 ? prev + 1 : 0) : -1
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        allItems.length > 0 ? (prev > 0 ? prev - 1 : allItems.length - 1) : -1
      )
    } else if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < allItems.length) {
      e.preventDefault()
      selectResult(allItems[highlightIndex])
    }
  }

  if (!isOpen) return null

  const hasQuery = query.trim().length >= 2
  const hasResults = recipeResults.length > 0 || cookbookResults.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[640px] mx-4 rounded-2xl bg-popover shadow-glass-lg border border-border overflow-hidden animate-slide-up">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 border-b border-border">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search recipes & cookbooks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
          {!hasQuery && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Search size={28} className="mx-auto mb-3 opacity-20" />
              <p>Start typing to search...</p>
            </div>
          )}

          {hasQuery && isLoading && !hasResults && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2">
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Search size={28} className="mx-auto mb-3 opacity-20" />
              <p>No results found</p>
            </div>
          )}

          {/* Recipe results */}
          {recipeResults.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Recipes
              </p>
              {recipeResults.map((item, i) => (
                <ResultRow
                  key={item.id}
                  item={item}
                  icon={ChefHat}
                  isHighlighted={highlightIndex === i}
                  onClick={() => selectResult(item)}
                />
              ))}
            </div>
          )}

          {/* Separator */}
          {recipeResults.length > 0 && cookbookResults.length > 0 && (
            <div className="mx-4 border-t border-border/50" />
          )}

          {/* Cookbook results */}
          {cookbookResults.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
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
                    onClick={() => selectResult(item)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultRow({
  item,
  icon: Icon,
  isHighlighted,
  onClick
}: {
  item: SearchResultItem
  icon: React.ComponentType<{ size?: number; className?: string }>
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
        'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        isHighlighted ? 'bg-primary/10' : 'hover:bg-muted/60'
      )}
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
        )}
      </div>
      <Icon size={14} className="text-muted-foreground/30 flex-shrink-0" />
    </button>
  )
}
