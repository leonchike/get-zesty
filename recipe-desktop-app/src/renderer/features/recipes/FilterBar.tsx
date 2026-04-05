import { useState } from 'react'
import { SlidersHorizontal, X, Heart, Pin, User, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFilterStore } from '@/stores/filterStore'
import { useFilterOptions } from '@/hooks/useRecipes'

export function FilterBar(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const {
    isFavorite,
    isPinned,
    isPersonal,
    isPublic,
    selectedCuisineTypes,
    selectedMealTypes,
    setIsFavorite,
    setIsPinned,
    setIsPersonal,
    setIsPublic,
    setSelectedCuisineTypes,
    setSelectedMealTypes,
    resetFilters,
    hasActiveFilters
  } = useFilterStore()
  const { data: options } = useFilterOptions()
  const active = hasActiveFilters()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={active ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <SlidersHorizontal size={14} />
          Filters
          {active && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">
              {[isFavorite, isPinned, isPersonal, isPublic].filter(Boolean).length +
                selectedCuisineTypes.length +
                selectedMealTypes.length}
            </span>
          )}
        </Button>

        {active && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-xs">
            <X size={12} />
            Clear
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="glass rounded-lg p-4 space-y-4 animate-slide-up">
          {/* Quick toggles */}
          <div className="flex flex-wrap gap-2">
            <ToggleChip active={isFavorite} onClick={() => setIsFavorite(!isFavorite)} icon={Heart}>
              Favorites
            </ToggleChip>
            <ToggleChip active={isPinned} onClick={() => setIsPinned(!isPinned)} icon={Pin}>
              Pinned
            </ToggleChip>
            <ToggleChip active={isPersonal} onClick={() => setIsPersonal(!isPersonal)} icon={User}>
              My Recipes
            </ToggleChip>
            <ToggleChip active={isPublic} onClick={() => setIsPublic(!isPublic)} icon={Globe}>
              Public
            </ToggleChip>
          </div>

          {/* Cuisine types */}
          {options?.cuisineTypes && options.cuisineTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Cuisine</p>
              <div className="flex flex-wrap gap-1.5">
                {options.cuisineTypes.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => {
                      const next = selectedCuisineTypes.includes(ct)
                        ? selectedCuisineTypes.filter((t) => t !== ct)
                        : [...selectedCuisineTypes, ct]
                      setSelectedCuisineTypes(next)
                    }}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs transition-colors',
                      selectedCuisineTypes.includes(ct)
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meal types */}
          {options?.mealTypes && options.mealTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Meal Type</p>
              <div className="flex flex-wrap gap-1.5">
                {options.mealTypes.map((mt) => (
                  <button
                    key={mt}
                    onClick={() => {
                      const next = selectedMealTypes.includes(mt)
                        ? selectedMealTypes.filter((t) => t !== mt)
                        : [...selectedMealTypes, mt]
                      setSelectedMealTypes(next)
                    }}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs transition-colors',
                      selectedMealTypes.includes(mt)
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {mt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ToggleChip({
  active,
  onClick,
  icon: Icon,
  children
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ size: number }>
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      <Icon size={12} />
      {children}
    </button>
  )
}
