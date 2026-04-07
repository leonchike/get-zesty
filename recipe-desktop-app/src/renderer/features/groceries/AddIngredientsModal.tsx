import { useState, useEffect, useCallback } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { useAddGroceriesFromRecipe, type GroceryIngredientInput } from '@/hooks/useGroceries'
import { useRecipeDisplayStore } from '@/stores/recipeDisplayStore'
import { formatScaledQuantity } from '@/lib/fractions'
import type { Recipe, ParsedIngredient } from '@/types'

interface SelectableIngredient {
  name: string
  displayText: string
  quantity: number | null
  quantityUnit: string | null
  selected: boolean
}

interface AddIngredientsModalProps {
  recipe: Recipe
  isOpen: boolean
  onClose: () => void
}

export function AddIngredientsModal({
  recipe,
  isOpen,
  onClose
}: AddIngredientsModalProps): JSX.Element | null {
  const navigate = useNavigate()
  const addGroceries = useAddGroceriesFromRecipe()
  const scale = useRecipeDisplayStore((s) => s.getRecipeScale(recipe.id))
  const [ingredients, setIngredients] = useState<SelectableIngredient[]>([])

  // Build ingredient list when modal opens — quantities are pre-scaled
  useEffect(() => {
    if (!isOpen) return

    const parsed = safeParsedIngredients(recipe.parsedIngredients)
    if (parsed && parsed.length > 0) {
      setIngredients(
        parsed.map((ing) => {
          const scaledQty = ing.quantity != null ? ing.quantity * scale : null
          return {
            name: ing.ingredient,
            displayText: formatIngredientDisplay(ing, scale),
            quantity: scaledQty,
            quantityUnit: ing.unit,
            selected: true
          }
        })
      )
    } else if (recipe.ingredients) {
      const lines = recipe.ingredients
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      setIngredients(
        lines.map((line) => ({
          name: line,
          displayText: line,
          quantity: null,
          quantityUnit: null,
          selected: true
        }))
      )
    }
  }, [isOpen, recipe, scale])

  const toggleIngredient = useCallback((index: number) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, selected: !ing.selected } : ing))
    )
  }, [])

  const allSelected = ingredients.length > 0 && ingredients.every((i) => i.selected)
  const noneSelected = ingredients.every((i) => !i.selected)
  const selectedCount = ingredients.filter((i) => i.selected).length

  const toggleAll = useCallback(() => {
    const newState = !allSelected
    setIngredients((prev) => prev.map((ing) => ({ ...ing, selected: newState })))
  }, [allSelected])

  const handleAdd = async (): Promise<void> => {
    const selected: GroceryIngredientInput[] = ingredients
      .filter((ing) => ing.selected)
      .map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        quantityUnit: ing.quantityUnit,
        recipeId: recipe.id
      }))

    if (selected.length === 0) return

    try {
      const result = await addGroceries.mutateAsync(selected)
      if (result.success) {
        toast.success(`${selected.length} items added to grocery list`, {
          action: {
            label: 'View list',
            onClick: () => navigate('/groceries')
          }
        })
        onClose()
      } else {
        toast.error(result.error || 'Failed to add ingredients')
      }
    } catch {
      toast.error('Failed to add ingredients')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-card shadow-glass-lg border border-border overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            Add to Grocery List
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select ingredients from <span className="font-medium text-foreground">{recipe.title}</span>
            {scale !== 1 && (
              <span className="ml-2 text-accent font-semibold">({scale}x)</span>
            )}
          </p>
        </div>

        {/* Ingredient list */}
        <div className="px-6 max-h-[50vh] overflow-y-auto scrollbar-thin">
          {ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No ingredients found.</p>
          ) : (
            <div className="space-y-0">
              {ingredients.map((ing, index) => (
                <button
                  key={index}
                  onClick={() => toggleIngredient(index)}
                  className={cn(
                    'flex items-center gap-3 w-full text-left py-2.5 border-b border-border/40 last:border-0 transition-opacity',
                    !ing.selected && 'opacity-40'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      ing.selected
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {ing.selected && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span className="text-sm leading-snug">{ing.displayText}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={noneSelected || addGroceries.isPending}
              className="gap-2"
            >
              {addGroceries.isPending ? (
                <>
                  <Loader size={14} className="text-white" />
                  Adding...
                </>
              ) : (
                <>Add {selectedCount} item{selectedCount !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Helpers ---

function safeParsedIngredients(value: unknown): ParsedIngredient[] | null {
  if (!value) return null
  let arr: unknown[] | null = null
  if (Array.isArray(value)) arr = value
  else if (typeof value === 'string') {
    try {
      const p = JSON.parse(value)
      if (Array.isArray(p)) arr = p
    } catch {
      return null
    }
  }
  if (!arr || arr.length === 0) return null
  if (typeof arr[0] === 'object' && arr[0] !== null && 'ingredient' in arr[0]) {
    return arr as ParsedIngredient[]
  }
  return null
}

function formatIngredientDisplay(ing: ParsedIngredient, scale: number): string {
  const parts: string[] = []
  if (ing.quantity) {
    parts.push(formatScaledQuantity(ing.quantity, scale))
  }
  if (ing.unit) {
    parts.push(ing.unit)
  }
  parts.push(ing.ingredient)
  if (ing.extra) {
    parts.push(`(${ing.extra})`)
  }
  return parts.join(' ')
}
