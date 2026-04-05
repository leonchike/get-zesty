import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { QUERY_KEYS } from '@/lib/constants'
import type { Cookbook, CookbookRecipe } from '@/types'
import { useAuth } from './useAuth'

export function useCookbooks() {
  const { isAuthenticated } = useAuth()

  return useQuery<Cookbook[]>({
    queryKey: [QUERY_KEYS.COOKBOOKS],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COOKBOOKS)
      return data
    },
    enabled: isAuthenticated,
    staleTime: 60_000
  })
}

export function useCookbookRecipes(cookbookId: string | undefined) {
  return useQuery<{ recipes: CookbookRecipe[]; totalCount: number; nextPage: number | null }>({
    queryKey: [QUERY_KEYS.COOKBOOK_RECIPES, cookbookId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COOKBOOK_RECIPES, {
        params: { cookbook_id: cookbookId }
      })
      return data
    },
    enabled: !!cookbookId,
    staleTime: 60_000
  })
}

export function useCookbookRecipe(recipeId: string | undefined) {
  return useQuery<CookbookRecipe>({
    queryKey: [QUERY_KEYS.COOKBOOK_RECIPE, recipeId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COOKBOOK_RECIPES, {
        params: { recipe_id: recipeId }
      })
      return data
    },
    enabled: !!recipeId,
    staleTime: 60_000
  })
}

interface SearchResult {
  recipe: CookbookRecipe & { cookbook: { title: string; author: string | null } }
  score: number
  matchType: 'hybrid' | 'semantic' | 'fulltext'
}

export function useSearchCookbooks(query: string) {
  const { isAuthenticated } = useAuth()

  return useQuery<{ results: SearchResult[]; totalCount: number }>({
    queryKey: [QUERY_KEYS.COOKBOOK_RECIPES, 'search', query],
    queryFn: async () => {
      const { data } = await api.post(ENDPOINTS.COOKBOOK_SEARCH, { query })
      return data
    },
    enabled: query.length > 2 && isAuthenticated,
    staleTime: 30_000
  })
}
