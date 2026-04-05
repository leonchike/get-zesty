import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { QUERY_KEYS } from '@/lib/constants'
import type { Cookbook, CookbookRecipe } from '@/types'
import { useAuth } from './useAuth'

export function useCookbooks() {
  const { isAuthenticated, user } = useAuth()

  return useQuery<Cookbook[]>({
    queryKey: [QUERY_KEYS.COOKBOOKS],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COOKBOOKS, {
        params: { user_id: user?.id }
      })
      return data
    },
    enabled: isAuthenticated && !!user,
    staleTime: 60_000
  })
}

export function useCookbookRecipes(cookbookId: string | undefined) {
  return useQuery<CookbookRecipe[]>({
    queryKey: [QUERY_KEYS.COOKBOOK_RECIPES, cookbookId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COOKBOOK_RECIPES_LIST, {
        params: { cookbook_id: cookbookId }
      })
      return data
    },
    enabled: !!cookbookId,
    staleTime: 60_000
  })
}

export function useCookbookRecipe(cookbookId: string | undefined, recipeId: string | undefined) {
  return useQuery<CookbookRecipe>({
    queryKey: [QUERY_KEYS.COOKBOOK_RECIPE, cookbookId, recipeId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COOKBOOK_RECIPE, {
        params: { cookbook_id: cookbookId, recipe_id: recipeId }
      })
      return data
    },
    enabled: !!cookbookId && !!recipeId,
    staleTime: 60_000
  })
}

export function useSearchCookbooks(query: string, userId: string | undefined) {
  return useQuery<CookbookRecipe[]>({
    queryKey: [QUERY_KEYS.COOKBOOK_RECIPES, 'search', query],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.COOKBOOK_SEARCH, {
        params: { query, user_id: userId }
      })
      return data
    },
    enabled: query.length > 2 && !!userId,
    staleTime: 30_000
  })
}
