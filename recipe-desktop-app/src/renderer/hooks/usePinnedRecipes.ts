import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { QUERY_KEYS } from '@/lib/constants'
import type { PinnedRecipe } from '@/types'
import { useAuth } from './useAuth'

export function usePinnedRecipes() {
  const { isAuthenticated } = useAuth()

  return useQuery<PinnedRecipe[]>({
    queryKey: [QUERY_KEYS.PINNED_RECIPES],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.PINNED_RECIPES)
      return data
    },
    enabled: isAuthenticated,
    staleTime: 60_000
  })
}
