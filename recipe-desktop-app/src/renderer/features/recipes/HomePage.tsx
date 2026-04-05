import { useMemo } from 'react'
import { useInView } from 'react-intersection-observer'
import { useRecipeSearch } from '@/hooks/useRecipes'
import { RecipeCard } from './RecipeCard'
import { FilterBar } from './FilterBar'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader } from '@/components/ui/loader'

export function HomePage(): JSX.Element {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useRecipeSearch()

  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  })

  const recipes = useMemo(
    () => data?.pages.flatMap((page) => page.recipes) ?? [],
    [data]
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Recipes</h1>
        {data?.pages[0] && (
          <span className="text-sm text-muted-foreground">
            {data.pages[0].totalCount} recipe{data.pages[0].totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <FilterBar />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3.5 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>Failed to load recipes. Please try again.</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>No recipes found. Try adjusting your filters or create a new recipe.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-6">
              {isFetchingNextPage && <Loader />}
            </div>
          )}
        </>
      )}
    </div>
  )
}
