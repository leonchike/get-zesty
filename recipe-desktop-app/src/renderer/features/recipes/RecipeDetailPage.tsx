import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Pin,
  Edit3,
  Trash2,
  Clock,
  Users,
  ChefHat,
  ShoppingCart,
  MessageSquare,
  PlayCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatImageUrl, formatTime } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useRecipe, useToggleFavorite, useTogglePin, useDeleteRecipe } from '@/hooks/useRecipes'
import { useAddGroceriesFromRecipe } from '@/hooks/useGroceries'
import { useAuth } from '@/hooks/useAuth'
import { useCookingStore } from '@/stores/cookingStore'
import { useState } from 'react'
import { RecipeChatPanel } from '@/features/recipe-chat/RecipeChatPanel'

export function RecipeDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: recipe, isLoading } = useRecipe(id)
  const toggleFavorite = useToggleFavorite()
  const togglePin = useTogglePin()
  const deleteRecipe = useDeleteRecipe()
  const addToGroceries = useAddGroceriesFromRecipe()
  const { startCooking } = useCookingStore()
  const [showChat, setShowChat] = useState(false)

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-[16/9] w-full max-w-2xl rounded-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-3/4 max-w-lg" />
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
  const instructions = recipe.parsedInstructions || parseInstructions(recipe.instructions)
  const ingredients = recipe.parsedIngredients || parseIngredients(recipe.ingredients)

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

  const handleAddToGroceries = async (): Promise<void> => {
    try {
      await addToGroceries.mutateAsync(recipe.id)
      toast.success('Ingredients added to grocery list')
    } catch {
      toast.error('Failed to add ingredients')
    }
  }

  const handleStartCooking = (): void => {
    if (instructions.length > 0) {
      startCooking(recipe.id, instructions.length)
      navigate(`/cooking/${recipe.id}`)
    }
  }

  return (
    <div className="flex">
      <motion.div
        className="flex-1 p-6 space-y-8 max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                toggleFavorite.mutate({
                  recipeId: recipe.id,
                  isFavorited: recipe.isFavorited || false
                })
              }
            >
              <Heart
                size={18}
                className={cn(
                  recipe.isFavorited && 'fill-primary text-primary'
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                togglePin.mutate({
                  recipeId: recipe.id,
                  isPinned: recipe.isPinned || false
                })
              }
            >
              <Pin
                size={18}
                className={cn(recipe.isPinned && 'fill-accent text-accent')}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(!showChat)}
              title="Chat about this recipe"
            >
              <MessageSquare size={18} />
            </Button>
            {isOwner && (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={ROUTES.RECIPE_EDIT(recipe.id)}>
                    <Edit3 size={18} />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={18} />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Image */}
        {imageUrl && (
          <div className="relative rounded-xl overflow-hidden shadow-warm-lg">
            <img
              src={imageUrl}
              alt={recipe.title}
              className="w-full aspect-[16/9] object-cover"
            />
          </div>
        )}

        {/* Title & metadata */}
        <div className="space-y-3">
          <h1 className="font-heading text-3xl font-bold">{recipe.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {recipe.totalTime && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {formatTime(recipe.totalTime)}
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {recipe.servings} servings
              </span>
            )}
            {recipe.difficulty && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  recipe.difficulty === 'EASY' && 'bg-success/10 text-success',
                  recipe.difficulty === 'MEDIUM' && 'bg-accent/10 text-accent',
                  recipe.difficulty === 'HARD' && 'bg-destructive/10 text-destructive'
                )}
              >
                {recipe.difficulty}
              </span>
            )}
            {recipe.cuisineType && <span>{recipe.cuisineType}</span>}
            {recipe.mealType && <span>{recipe.mealType}</span>}
          </div>

          {recipe.description && (
            <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
          )}
        </div>

        {/* Time breakdown */}
        {(recipe.prepTime || recipe.cookTime || recipe.restTime) && (
          <div className="flex gap-6 glass rounded-lg p-4">
            {recipe.prepTime && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Prep</p>
                <p className="font-medium">{formatTime(recipe.prepTime)}</p>
              </div>
            )}
            {recipe.cookTime && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Cook</p>
                <p className="font-medium">{formatTime(recipe.cookTime)}</p>
              </div>
            )}
            {recipe.restTime && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Rest</p>
                <p className="font-medium">{formatTime(recipe.restTime)}</p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {instructions.length > 0 && (
            <Button onClick={handleStartCooking} className="gap-2">
              <PlayCircle size={16} />
              Start Cooking
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleAddToGroceries}
            disabled={addToGroceries.isPending}
            className="gap-2"
          >
            <ShoppingCart size={16} />
            Add to Groceries
          </Button>
        </div>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-semibold mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {ingredients.map((ing, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>
                    {typeof ing === 'string' ? (
                      ing
                    ) : (
                      <>
                        {ing.quantity && (
                          <span className="font-medium">
                            {ing.quantity}
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
        {instructions.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-semibold mb-4">Instructions</h2>
            <ol className="space-y-4">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed pt-0.5">
                    {typeof step === 'string' ? step : step.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Equipment */}
        {recipe.equipment && (
          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">Equipment</h2>
            <p className="text-muted-foreground whitespace-pre-line">{recipe.equipment}</p>
          </section>
        )}

        {/* Nutrition */}
        {recipe.nutrition && Object.keys(recipe.nutrition).length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">Nutrition</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(recipe.nutrition).map(([key, value]) =>
                value ? (
                  <div key={key} className="glass rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Notes */}
        {recipe.notes && (
          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">Notes</h2>
            <p className="text-muted-foreground whitespace-pre-line">{recipe.notes}</p>
          </section>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}
      </motion.div>

      {/* Chat panel */}
      {showChat && recipe && (
        <RecipeChatPanel recipe={recipe} onClose={() => setShowChat(false)} />
      )}
    </div>
  )
}

// Helpers to parse raw text ingredients/instructions when structured data isn't available
function parseIngredients(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function parseInstructions(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((l) => l.trim().replace(/^\d+[\.\)]\s*/, ''))
    .filter(Boolean)
}
