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
      // Mobile recipe-search is a POST endpoint with body params
      const body: Record<string, unknown> = {
        page: pageParam,
        limit: PAGE_SIZE
      }
      if (search) body.search = search
      if (isFavorite) body.isFavorite = true
      if (isPinned) body.isPinned = true
      if (isPersonal) body.isPersonal = true
      if (isPublic) body.isPublic = true
      if (selectedCuisineTypes.length) body.cuisineTypes = selectedCuisineTypes
      if (selectedMealTypes.length) body.mealTypes = selectedMealTypes

      const { data } = await api.post(ENDPOINTS.RECIPE_SEARCH, body)
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
    staleTime: 60_000
  })
}

export function useRecipe(id: string | undefined) {
  return useQuery<Recipe>({
    queryKey: [QUERY_KEYS.RECIPE, id],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.RECIPE, { params: { id } })
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
      // Filter options is a POST endpoint
      const { data } = await api.post(ENDPOINTS.FILTER_OPTIONS, {})
      return data
    },
    staleTime: 300_000
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: RecipeFormData) => {
      const { data } = await api.post(ENDPOINTS.RECIPE, { recipe: formData })
      return data as { id: string }
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
      const { data } = await api.put(ENDPOINTS.RECIPE, { id, recipe: formData })
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
      await api.delete(ENDPOINTS.RECIPE, { params: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPES] })
    }
  })
}

export function useTogglePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recipeId }: { recipeId: string }) => {
      const { data } = await api.post(ENDPOINTS.PINNED_RECIPES, { recipeId })
      return data as { pinned: boolean }
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
