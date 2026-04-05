import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useCookbookRecipes, useCookbookRecipe } from '@/hooks/useCookbooks'
import { useState } from 'react'

export function CookbookDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: recipesData, isLoading } = useCookbookRecipes(id)
  const recipes = recipesData?.recipes
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const { data: selectedRecipe } = useCookbookRecipe(selectedRecipeId || undefined)

  return (
    <div className="flex h-full">
      {/* Recipe list sidebar */}
      <div className="w-72 border-r border-border flex flex-col overflow-hidden">
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
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedRecipeId === recipe.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/60'
                  }`}
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
          <motion.div
            key={selectedRecipe.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 max-w-2xl space-y-6"
          >
            <h1 className="font-heading text-2xl font-bold">{selectedRecipe.title}</h1>

            {selectedRecipe.description && (
              <p className="text-muted-foreground">{selectedRecipe.description}</p>
            )}

            <div className="flex gap-4 text-sm text-muted-foreground">
              {selectedRecipe.prepTime && <span>Prep: {selectedRecipe.prepTime}</span>}
              {selectedRecipe.cookTime && <span>Cook: {selectedRecipe.cookTime}</span>}
              {selectedRecipe.servings && <span>Serves: {selectedRecipe.servings}</span>}
              {selectedRecipe.cuisineType && <span>{selectedRecipe.cuisineType}</span>}
            </div>

            {selectedRecipe.ingredients && (
              <section>
                <h2 className="font-heading text-xl font-semibold mb-3">Ingredients</h2>
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {selectedRecipe.ingredients}
                </div>
              </section>
            )}

            {selectedRecipe.instructions && (
              <section>
                <h2 className="font-heading text-xl font-semibold mb-3">Instructions</h2>
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {selectedRecipe.instructions}
                </div>
              </section>
            )}
          </motion.div>
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
