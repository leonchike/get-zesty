import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Search, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatImageUrl } from '@/lib/utils'
import { useCookbooks, useSearchCookbooks } from '@/hooks/useCookbooks'
import { ROUTES } from '@/lib/constants'
import { motion } from 'framer-motion'

export function CookbooksPage(): JSX.Element {
  const navigate = useNavigate()
  const { data: cookbooks, isLoading } = useCookbooks()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: searchData, isLoading: isSearching } = useSearchCookbooks(searchQuery)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Cookbooks</h1>
      </div>

      {/* Search across all cookbooks */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search all cookbook recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Search results */}
      {searchQuery.length > 2 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {isSearching
              ? 'Searching...'
              : `${searchData?.totalCount || 0} results for "${searchQuery}"`}
          </h2>
          {searchData?.results.map((result) => (
            <motion.button
              key={result.recipe.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => navigate(`/cookbooks/${result.recipe.cookbookId}/recipes/${result.recipe.id}`)}
              className="w-full text-left glass-elevated rounded-lg p-4 hover:shadow-warm transition-shadow"
            >
              <h3 className="font-heading font-semibold">{result.recipe.title}</h3>
              {result.recipe.cookbook && (
                <p className="text-xs text-muted-foreground">
                  {result.recipe.cookbook.title}{result.recipe.cookbook.author ? ` — ${result.recipe.cookbook.author}` : ''}
                </p>
              )}
              {result.recipe.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {result.recipe.description}
                </p>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Cookbook list */}
      {searchQuery.length <= 2 && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : !cookbooks || cookbooks.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p>No cookbooks yet.</p>
              <p className="text-sm mt-1">
                Cookbooks are added via the web app&apos;s ingestion pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {cookbooks.map((cookbook) => (
                <motion.button
                  key={cookbook.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(ROUTES.COOKBOOK(cookbook.id))}
                  className="text-left glass-elevated rounded-xl overflow-hidden shadow-warm hover:shadow-warm-md transition-all group"
                >
                  {cookbook.coverUrl ? (
                    <img
                      src={formatImageUrl(cookbook.coverUrl) || cookbook.coverUrl}
                      alt={cookbook.title}
                      className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <BookOpen size={48} className="text-primary/30" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-heading font-semibold line-clamp-2">{cookbook.title}</h3>
                    {cookbook.author && (
                      <p className="text-sm text-muted-foreground mt-1">{cookbook.author}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>{cookbook.recipeCount} recipes</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
