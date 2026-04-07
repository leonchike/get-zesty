import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRecipeDisplayStore } from '@/stores/recipeDisplayStore'

interface ScaleControlProps {
  recipeId: string
}

export function ScaleControl({ recipeId }: ScaleControlProps): JSX.Element {
  const { getRecipeScale, setRecipeScale, scaleOptions } = useRecipeDisplayStore()
  const currentScale = getRecipeScale(recipeId)
  const currentIndex = scaleOptions.indexOf(currentScale)
  const isScaled = currentScale !== 1

  const decrement = (): void => {
    if (currentIndex > 0) {
      setRecipeScale(recipeId, scaleOptions[currentIndex - 1])
    }
  }

  const increment = (): void => {
    if (currentIndex < scaleOptions.length - 1) {
      setRecipeScale(recipeId, scaleOptions[currentIndex + 1])
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={decrement}
        disabled={currentIndex <= 0}
        title="Decrease scale"
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-30',
          isScaled
            ? 'border-accent/40 text-accent hover:bg-accent/10'
            : 'border-border text-muted-foreground hover:bg-muted'
        )}
      >
        <Minus size={12} strokeWidth={2.5} />
      </button>

      <span
        className={cn(
          'min-w-[2.5rem] text-center text-sm font-bold tabular-nums',
          isScaled ? 'text-accent' : 'text-muted-foreground'
        )}
      >
        {currentScale}x
      </span>

      <button
        onClick={increment}
        disabled={currentIndex >= scaleOptions.length - 1}
        title="Increase scale"
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-30',
          isScaled
            ? 'border-accent/40 text-accent hover:bg-accent/10'
            : 'border-border text-muted-foreground hover:bg-muted'
        )}
      >
        <Plus size={12} strokeWidth={2.5} />
      </button>
    </div>
  )
}
