import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { useAuth } from './useAuth'
import { formatImageUrl } from '@/lib/utils'

export interface SearchResultItem {
  id: string
  type: 'recipe' | 'cookbook-recipe'
  title: string
  subtitle: string | null
  imageUrl: string | null
  href: string
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export function useSearchResults(query: string) {
  const debouncedQuery = useDebounce(query.trim(), 300)
  const { isAuthenticated } = useAuth()
  const enabled = debouncedQuery.length > 1 && isAuthenticated

  // Quick recipe search (limit 5)
  const recipesQuery = useQuery({
    queryKey: ['quick-recipe-search', debouncedQuery],
    queryFn: async () => {
      const { data } = await api.post(ENDPOINTS.RECIPE_SEARCH, {
        search: debouncedQuery,
        limit: 100,
        page: 1
      })
      return data as { recipes: Array<{ id: string; title: string; cuisineType?: string; imageUrl?: string }>; totalCount: number }
    },
    enabled,
    staleTime: 30_000
  })

  // Cookbook recipe quick search (text-based, no embeddings)
  const cookbookQuery = useQuery({
    queryKey: ['quick-cookbook-search', debouncedQuery],
    queryFn: async () => {
      const { data } = await api.post(ENDPOINTS.COOKBOOK_QUICK_SEARCH, {
        query: debouncedQuery,
        limit: 100
      })
      return data as {
        recipes: Array<{
          id: string
          title: string
          description: string | null
          cookbookId: string
          cuisineType: string | null
          imageUrl: string | null
          cookbook: { title: string; author: string | null; coverUrl: string | null }
        }>
        totalCount: number
      }
    },
    enabled,
    staleTime: 30_000
  })

  const results = useMemo((): SearchResultItem[] => {
    const items: SearchResultItem[] = []

    // Recipes
    if (recipesQuery.data?.recipes) {
      for (const r of recipesQuery.data.recipes) {
        items.push({
          id: r.id,
          type: 'recipe',
          title: r.title,
          subtitle: r.cuisineType || null,
          imageUrl: formatImageUrl(r.imageUrl),
          href: `/recipes/${r.id}`
        })
      }
    }

    // Cookbook recipes
    if (cookbookQuery.data?.recipes) {
      for (const r of cookbookQuery.data.recipes) {
        items.push({
          id: r.id,
          type: 'cookbook-recipe',
          title: r.title,
          subtitle: r.cookbook?.title || null,
          imageUrl: formatImageUrl(r.cookbook?.coverUrl || r.imageUrl),
          href: `/cookbooks/${r.cookbookId}/recipes/${r.id}`
        })
      }
    }

    return items
  }, [recipesQuery.data, cookbookQuery.data])

  const recipeResults = results.filter((r) => r.type === 'recipe')
  const cookbookResults = results.filter((r) => r.type === 'cookbook-recipe')

  return {
    results,
    recipeResults,
    cookbookResults,
    isLoading: enabled && (recipesQuery.isLoading || cookbookQuery.isLoading),
    isEmpty: enabled && !recipesQuery.isLoading && !cookbookQuery.isLoading && results.length === 0,
    isActive: enabled
  }
}
