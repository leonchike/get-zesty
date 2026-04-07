import { useState, useEffect, useCallback } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { useAddGroceriesFromRecipe, type GroceryIngredientInput } from '@/hooks/useGroceries'
import type { CookbookRecipe } from '@/types'

interface SelectableIngredient {
  name: string
  selected: boolean
}

interface AddCookbookIngredientsModalProps {
  recipe: CookbookRecipe
  isOpen: boolean
  onClose: () => void
}

export function AddCookbookIngredientsModal({
  recipe,
  isOpen,
  onClose
}: AddCookbookIngredientsModalProps): JSX.Element | null {
  const navigate = useNavigate()
  const addGroceries = useAddGroceriesFromRecipe()
  const [ingredients, setIngredients] = useState<SelectableIngredient[]>([])

  useEffect(() => {
    if (!isOpen || !recipe.ingredients) return
    const lines = recipe.ingredients
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    setIngredients(lines.map((name) => ({ name, selected: true })))
  }, [isOpen, recipe.ingredients])

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
        quantity: null,
        quantityUnit: null,
        recipeId: null
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-card shadow-glass-lg border border-border overflow-hidden animate-slide-up">
        <div className="px-6 pt-6 pb-4">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            Add to Grocery List
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select ingredients from <span className="font-medium text-foreground">{recipe.title}</span>
          </p>
        </div>

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
                  <span className="text-sm leading-snug">{ing.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
