import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { QUERY_KEYS } from '@/lib/constants'
import type { GroceryItem, GrocerySection } from '@/types'
import { useAuth } from './useAuth'

export function useGroceryList() {
  const { isAuthenticated } = useAuth()

  return useQuery<GroceryItem[]>({
    queryKey: [QUERY_KEYS.GROCERIES],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.GROCERY_LIST)
      return data
    },
    enabled: isAuthenticated,
    staleTime: 5_000
  })
}

export function useGrocerySections() {
  return useQuery<GrocerySection[]>({
    queryKey: [QUERY_KEYS.GROCERY_SECTIONS],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.GROCERY_SECTIONS)
      return data
    },
    staleTime: 300_000
  })
}

export function useAddGroceryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: { name: string; quantity?: number; quantityUnit?: string }) => {
      const { data } = await api.post(ENDPOINTS.GROCERY_UPDATE, { data: item })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERIES] })
    }
  })
}

export function useUpdateGroceryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      name?: string
      quantity?: number | null
      quantityUnit?: string | null
      status?: string
      sectionId?: string | null
    }) => {
      const { data } = await api.patch(ENDPOINTS.GROCERY_UPDATE, { data: { id, ...updates } })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERIES] })
    }
  })
}

export function useDeleteGroceryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${ENDPOINTS.GROCERY_LIST}/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERIES] })
    }
  })
}

export function useAddGroceriesFromRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const { data } = await api.post(ENDPOINTS.ADD_GROCERIES_FROM_RECIPE, {
        data: { recipeId }
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERIES] })
    }
  })
}

// Polling hook for real-time grocery updates (mirrors mobile client pattern)
export function useGroceryPolling(enabled: boolean) {
  const queryClient = useQueryClient()
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!enabled) return

    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(ENDPOINTS.GROCERY_UPDATES_POLL)
        if (data && Array.isArray(data)) {
          queryClient.setQueryData([QUERY_KEYS.GROCERIES], data)
        }
      } catch {
        // Silent fail on poll errors
      }
    }, 5_000)

    return () => clearInterval(intervalRef.current)
  }, [enabled, queryClient])
}
