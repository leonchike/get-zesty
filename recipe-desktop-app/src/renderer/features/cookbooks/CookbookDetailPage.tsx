import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Globe,
  Utensils,
  ShoppingCart,
  PlayCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCookbookRecipes, useCookbookRecipe } from '@/hooks/useCookbooks'
import { useCookingStore } from '@/stores/cookingStore'
import { ParsedInstructionText } from '@/features/cooking/ParsedInstructionText'
import { AddCookbookIngredientsModal } from './AddCookbookIngredientsModal'
import { useState, useEffect } from 'react'
import type { CookbookRecipe } from '@/types'

export function CookbookDetailPage(): JSX.Element {
  const { id, recipeId: recipeIdParam } = useParams<{ id: string; recipeId: string }>()
  const navigate = useNavigate()
  const { data: recipesData, isLoading } = useCookbookRecipes(id)
  const recipes = recipesData?.recipes
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(recipeIdParam || null)
  const { data: selectedRecipe } = useCookbookRecipe(selectedRecipeId || undefined)

  useEffect(() => {
    if (recipeIdParam) {
      setSelectedRecipeId(recipeIdParam)
    }
  }, [recipeIdParam])

  return (
    <div className="flex h-full">
      {/* Recipe list sidebar */}
      <div className="w-72 border-r border-border flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-border">
          <button
            onClick={() => navigate('/cookbooks')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft size={14} />
            Cookbooks
          </button>
          <h2 className="font-heading text-lg font-bold">Recipes</h2>
          {recipesData && (
            <p className="text-xs text-muted-foreground mt-1">{recipesData.totalCount} recipes</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {recipes?.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                  className={cn(
                    'w-full text-left rounded-lg px-3 py-2 text-sm transition-colors',
                    selectedRecipeId === recipe.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/60'
                  )}
                >
                  <span className="line-clamp-1">{recipe.title}</span>
                  {recipe.pageNumber && (
                    <span className="text-xs text-muted-foreground"> p.{recipe.pageNumber}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recipe content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {selectedRecipe ? (
          <CookbookRecipeView recipe={selectedRecipe} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <BookOpen size={48} className="opacity-20 mb-3" />
            <p>Select a recipe to view</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Full recipe view matching RecipeDetailPage styling ---

function CookbookRecipeView({ recipe }: { recipe: CookbookRecipe }): JSX.Element {
  const navigate = useNavigate()
  const { startCooking } = useCookingStore()
  const [showGroceryModal, setShowGroceryModal] = useState(false)

  const instructionsList = splitLines(recipe.instructions)
  const ingredientsList = splitLines(recipe.ingredients)

  const handleStartCooking = (): void => {
    if (instructionsList.length > 0) {
      startCooking(recipe.id, instructionsList.length)
      navigate(`/cooking/${recipe.id}`)
    }
  }

  return (
    <motion.div
      key={recipe.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-3xl mx-auto px-8 py-6 space-y-8 pb-16">
        {/* Cookbook source */}
        {recipe.cookbook && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen size={14} />
            <span>{recipe.cookbook.title}</span>
            {recipe.cookbook.author && <span>by {recipe.cookbook.author}</span>}
            {recipe.pageNumber && <span>- p.{recipe.pageNumber}</span>}
          </div>
        )}

        {/* Title + description */}
        <div>
          <h1 className="font-heading text-3xl font-bold leading-tight">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-muted-foreground leading-relaxed mt-3">{recipe.description}</p>
          )}
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap items-center gap-3">
          {recipe.prepTime && (
            <MetaChip icon={Clock}>Prep: {recipe.prepTime}</MetaChip>
          )}
          {recipe.cookTime && (
            <MetaChip icon={Clock}>Cook: {recipe.cookTime}</MetaChip>
          )}
          {recipe.servings && (
            <MetaChip icon={Users}>{recipe.servings} servings</MetaChip>
          )}
          {recipe.cuisineType && <MetaChip icon={Globe}>{recipe.cuisineType}</MetaChip>}
          {recipe.mealType && <MetaChip icon={Utensils}>{recipe.mealType}</MetaChip>}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {instructionsList.length > 0 && (
            <Button onClick={handleStartCooking} className="gap-2">
              <PlayCircle size={16} />
              Start Cooking
            </Button>
          )}
          {ingredientsList.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowGroceryModal(true)}
              className="gap-2"
            >
              <ShoppingCart size={16} />
              Add to Groceries
            </Button>
          )}
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
                    <span className="text-[15px] leading-relaxed">{ing}</span>
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
      </div>

      {/* Add to groceries modal */}
      <AddCookbookIngredientsModal
        recipe={recipe}
        isOpen={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
      />
    </motion.div>
  )
}

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

function splitLines(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((l) => l.trim().replace(/^\d+[\.\)]\s*/, ''))
    .filter(Boolean)
}
