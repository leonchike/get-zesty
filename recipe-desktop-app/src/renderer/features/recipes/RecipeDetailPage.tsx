import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Pin,
  Edit3,
  Trash2,
  Clock,
  Users,
  ShoppingCart,
  MessageSquare,
  PlayCircle,
  Globe,
  Utensils
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatImageUrl, formatTime } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useRecipe, useTogglePin, useDeleteRecipe } from '@/hooks/useRecipes'
import { useAuth } from '@/hooks/useAuth'
import { useCookingStore } from '@/stores/cookingStore'
import { useRecipeDisplayStore } from '@/stores/recipeDisplayStore'
import { formatScaledQuantity } from '@/lib/fractions'
import { useState } from 'react'
import { RecipeChatPanel } from '@/features/recipe-chat/RecipeChatPanel'
import { AddIngredientsModal } from '@/features/groceries/AddIngredientsModal'
import { ScaleControl } from './ScaleControl'
import { ParsedInstructionText } from '@/features/cooking/ParsedInstructionText'
import type { ParsedIngredient } from '@/types'

export function RecipeDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: recipe, isLoading } = useRecipe(id)
  const togglePin = useTogglePin()
  const deleteRecipe = useDeleteRecipe()
  const { startCooking } = useCookingStore()
  const recipeScales = useRecipeDisplayStore((s) => s.recipeScales)
  const [showChat, setShowChat] = useState(false)
  const [showGroceryModal, setShowGroceryModal] = useState(false)

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-[2/1] w-full rounded-xl" />
        <Skeleton className="h-6 w-2/3" />
        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Recipe not found</p>
        <Button variant="link" onClick={() => navigate('/')}>
          Back to recipes
        </Button>
      </div>
    )
  }

  const isOwner = user?.id === recipe.userId
  const imageUrl = formatImageUrl(recipe.imageUrl)
  const scale = recipeScales[recipe.id] ?? 1
  // Always parse from raw text — parsedInstructions JSON is unreliable
  const instructionsList = splitLines(recipe.instructions)
  const ingredientsList = parseIngredients(recipe.parsedIngredients, recipe.ingredients)
  const isFavorited = (recipe.FavoriteRecipe?.length ?? 0) > 0
  const isPinned = (recipe.PinnedRecipe?.length ?? 0) > 0

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete this recipe?')) return
    try {
      await deleteRecipe.mutateAsync(recipe.id)
      toast.success('Recipe deleted')
      navigate('/')
    } catch {
      toast.error('Failed to delete recipe')
    }
  }

  const handleAddToGroceries = (): void => {
    setShowGroceryModal(true)
  }

  const handleStartCooking = (): void => {
    if (instructionsList.length > 0) {
      startCooking(recipe.id, instructionsList.length)
      navigate(`/cooking/${recipe.id}`)
    }
  }

  return (
    <div className="flex h-full">
      <motion.div
        className="flex-1 overflow-y-auto scrollbar-thin"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-3xl mx-auto px-8 py-6 space-y-8 pb-16">
          {/* Back + actions bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Favorite">
                <Heart
                  size={16}
                  className={cn(
                    'text-muted-foreground',
                    isFavorited && 'fill-primary text-primary'
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => togglePin.mutate({ recipeId: recipe.id })}
                title="Pin"
              >
                <Pin
                  size={16}
                  className={cn(
                    'text-muted-foreground',
                    isPinned && 'fill-accent text-accent'
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowChat(!showChat)}
                title="Chat about this recipe"
              >
                <MessageSquare size={16} />
              </Button>
              {isOwner && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Edit">
                    <Link to={ROUTES.RECIPE_EDIT(recipe.id)}>
                      <Edit3 size={16} />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Hero image */}
          {imageUrl && (
            <div className="relative rounded-2xl overflow-hidden shadow-warm-lg -mx-2">
              <img
                src={imageUrl}
                alt={recipe.title}
                className="w-full aspect-[2.2/1] object-cover"
              />
            </div>
          )}

          {/* Title + description */}
          <div>
            <h1 className="font-heading text-3xl font-bold leading-tight">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-muted-foreground leading-relaxed mt-3">{recipe.description}</p>
            )}
          </div>

          {/* Metadata chips + scale control */}
          <div className="flex flex-wrap items-center gap-3">
            <ScaleControl recipeId={recipe.id} />
            {(recipe.totalTime || recipe.cookTime || recipe.prepTime) && (
              <MetaChip icon={Clock}>
                {formatTime(recipe.totalTime || recipe.cookTime || recipe.prepTime)}
              </MetaChip>
            )}
            {recipe.servings && (
              <MetaChip icon={Users}>
                {Math.round(recipe.servings * scale)} servings
              </MetaChip>
            )}
            {recipe.difficulty && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                  recipe.difficulty === 'EASY' && 'bg-success/10 text-success',
                  recipe.difficulty === 'MEDIUM' && 'bg-accent/10 text-accent',
                  recipe.difficulty === 'HARD' && 'bg-destructive/10 text-destructive'
                )}
              >
                {recipe.difficulty}
              </span>
            )}
            {recipe.cuisineType && <MetaChip icon={Globe}>{recipe.cuisineType}</MetaChip>}
            {recipe.mealType && <MetaChip icon={Utensils}>{recipe.mealType}</MetaChip>}
          </div>

          {/* Time breakdown */}
          {(recipe.prepTime || recipe.cookTime || recipe.restTime) && (
            <div className="flex gap-px rounded-xl overflow-hidden">
              {recipe.prepTime != null && (
                <TimeBlock label="Prep" value={formatTime(recipe.prepTime)} />
              )}
              {recipe.cookTime != null && (
                <TimeBlock label="Cook" value={formatTime(recipe.cookTime)} />
              )}
              {recipe.restTime != null && (
                <TimeBlock label="Rest" value={formatTime(recipe.restTime)} />
              )}
              {recipe.totalTime != null && (
                <TimeBlock label="Total" value={formatTime(recipe.totalTime)} highlight />
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {instructionsList.length > 0 && (
              <Button onClick={handleStartCooking} className="gap-2">
                <PlayCircle size={16} />
                Start Cooking
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleAddToGroceries}
              className="gap-2"
            >
              <ShoppingCart size={16} />
              Add to Groceries
            </Button>
          </div>

          {/* Ingredients + Instructions side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
            {/* Ingredients */}
            {ingredientsList.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-semibold mb-4">Ingredients</h2>
                <ul className="space-y-0">
                  {ingredientsList.map((ing, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0"
                    >
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-[15px] leading-relaxed">
                        {typeof ing === 'string' ? (
                          ing
                        ) : (
                          <>
                            {ing.quantity != null && (
                              <span className="font-semibold">
                                {formatScaledQuantity(ing.quantity, scale)}
                                {ing.unit ? ` ${ing.unit}` : ''}{' '}
                              </span>
                            )}
                            <span>{ing.ingredient}</span>
                            {ing.extra && (
                              <span className="text-muted-foreground"> ({ing.extra})</span>
                            )}
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Instructions */}
            {instructionsList.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-semibold mb-4">Instructions</h2>
                <ol className="space-y-5">
                  {instructionsList.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-[15px] leading-relaxed flex-1">
                        <ParsedInstructionText
                          text={step}
                          recipeId={recipe.id}
                          recipeName={recipe.title}
                          stepIndex={i}
                          variant="light"
                        />
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Equipment */}
          {recipe.equipment && (
            <section className="glass rounded-xl p-5">
              <h2 className="font-heading text-lg font-semibold mb-3">Equipment</h2>
              <p className="text-[15px] text-muted-foreground whitespace-pre-line">{recipe.equipment}</p>
            </section>
          )}

          {/* Nutrition */}
          {recipe.nutrition && Object.keys(recipe.nutrition).length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold mb-3">Nutrition</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {Object.entries(recipe.nutrition).map(([key, value]) =>
                  value ? (
                    <div key={key} className="glass rounded-lg p-3 text-center">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{formatNutritionKey(key)}</p>
                      <p className="font-semibold text-sm mt-0.5">{value}</p>
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}

          {/* Notes */}
          {recipe.notes && (
            <section className="glass rounded-xl p-5">
              <h2 className="font-heading text-lg font-semibold mb-3">Notes</h2>
              <p className="text-[15px] text-muted-foreground whitespace-pre-line leading-relaxed">{recipe.notes}</p>
            </section>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat panel */}
      {showChat && recipe && (
        <RecipeChatPanel recipe={recipe} onClose={() => setShowChat(false)} />
      )}

      {/* Add to groceries modal */}
      <AddIngredientsModal
        recipe={recipe}
        isOpen={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
      />
    </div>
  )
}

// --- Sub-components ---

function MetaChip({
  icon: Icon,
  children
}: {
  icon: React.ComponentType<{ size: number }>
  children: React.ReactNode
}): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
      <Icon size={12} />
      {children}
    </span>
  )
}

function TimeBlock({
  label,
  value,
  highlight
}: {
  label: string
  value: string
  highlight?: boolean
}): JSX.Element {
  return (
    <div
      className={cn(
        'flex-1 py-3 px-4 text-center',
        highlight ? 'bg-primary/10' : 'bg-muted/40'
      )}
    >
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('font-semibold text-sm mt-0.5', highlight && 'text-primary')}>{value}</p>
    </div>
  )
}

// --- Helpers ---

function splitLines(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((l) => l.trim().replace(/^\d+[\.\)]\s*/, ''))
    .filter(Boolean)
}

function parseIngredients(
  parsed: unknown,
  raw: string | null
): (string | ParsedIngredient)[] {
  // Try parsed ingredients first
  let arr: unknown[] | null = null
  if (parsed) {
    if (Array.isArray(parsed)) arr = parsed
    else if (typeof parsed === 'string') {
      try {
        const p = JSON.parse(parsed)
        if (Array.isArray(p)) arr = p
      } catch { /* ignore */ }
    }
  }
  if (arr && arr.length > 0) {
    // Validate that items have an ingredient field
    if (typeof arr[0] === 'object' && arr[0] !== null && 'ingredient' in arr[0]) {
      return arr as ParsedIngredient[]
    }
  }
  // Fall back to raw text
  if (!raw) return []
  return raw.split('\n').map((l) => l.trim()).filter(Boolean)
}

function formatNutritionKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}
