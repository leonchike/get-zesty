import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { QUERY_KEYS } from '@/lib/constants'
import type {
  Recipe,
  RecipeSearchResponse,
  RecipeFormData,
  FilterOptions
} from '@/types'
import { useFilterStore } from '@/stores/filterStore'

const PAGE_SIZE = 20

export function useRecipeSearch() {
  const {
    search,
    isFavorite,
    isPinned,
    isPersonal,
    isPublic,
    selectedCuisineTypes,
    selectedMealTypes
  } = useFilterStore()

  return useInfiniteQuery<RecipeSearchResponse>({
    queryKey: [
      QUERY_KEYS.RECIPES,
      { search, isFavorite, isPinned, isPersonal, isPublic, selectedCuisineTypes, selectedMealTypes }
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      params.set('page', String(pageParam))
      params.set('pageSize', String(PAGE_SIZE))
      if (search) params.set('search', search)
      if (isFavorite) params.set('isFavorite', 'true')
      if (isPinned) params.set('isPinned', 'true')
      if (isPersonal) params.set('isPersonal', 'true')
      if (isPublic) params.set('isPublic', 'true')
      if (selectedCuisineTypes.length)
        params.set('cuisineTypes', selectedCuisineTypes.join(','))
      if (selectedMealTypes.length)
        params.set('mealTypes', selectedMealTypes.join(','))

      const { data } = await api.get(`${ENDPOINTS.RECIPE_SEARCH}?${params.toString()}`)
      return data
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60_000
  })
}

export function useRecipe(id: string | undefined) {
  return useQuery<Recipe>({
    queryKey: [QUERY_KEYS.RECIPE, id],
    queryFn: async () => {
      const { data } = await api.get(`${ENDPOINTS.RECIPE}/${id}`)
      return data
    },
    enabled: !!id,
    staleTime: 60_000
  })
}

export function useFilterOptions() {
  return useQuery<FilterOptions>({
    queryKey: [QUERY_KEYS.FILTER_OPTIONS],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.FILTER_OPTIONS)
      return data
    },
    staleTime: 300_000
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: RecipeFormData) => {
      const { data } = await api.post(ENDPOINTS.RECIPE, { data: formData })
      return data as Recipe
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPES] })
    }
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...formData }: RecipeFormData & { id: string }) => {
      const { data } = await api.put(`${ENDPOINTS.RECIPE}/${id}`, { data: formData })
      return data as Recipe
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPE, variables.id] })
    }
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${ENDPOINTS.RECIPE}/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPES] })
    }
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recipeId,
      isFavorited
    }: {
      recipeId: string
      isFavorited: boolean
    }) => {
      if (isFavorited) {
        await api.delete(`${ENDPOINTS.RECIPE}/${recipeId}/favorite`)
      } else {
        await api.post(`${ENDPOINTS.RECIPE}/${recipeId}/favorite`)
      }
    },
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPE, recipeId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPES] })
    }
  })
}

export function useTogglePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recipeId,
      isPinned
    }: {
      recipeId: string
      isPinned: boolean
    }) => {
      if (isPinned) {
        await api.delete(`${ENDPOINTS.RECIPE}/${recipeId}/pin`)
      } else {
        await api.post(`${ENDPOINTS.RECIPE}/${recipeId}/pin`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PINNED_RECIPES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPES] })
    }
  })
}

export function useScrapeRecipe() {
  return useMutation({
    mutationFn: async (url: string) => {
      const { data } = await api.post(ENDPOINTS.SCRAPE_RECIPE, { url })
      return data
    }
  })
}

export function useGenerateRecipe() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const { data } = await api.post(ENDPOINTS.GENERATE_RECIPE, { data: { prompt } })
      return data
    }
  })
}
