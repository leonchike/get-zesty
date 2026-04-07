import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const SCALE_OPTIONS = [0.5, ...Array.from({ length: 200 }, (_, i) => i + 1)]

interface RecipeDisplayState {
  recipeScales: Record<string, number>
  scaleOptions: number[]
  setRecipeScale: (recipeId: string, scale: number) => void
  getRecipeScale: (recipeId: string) => number
}

export const useRecipeDisplayStore = create<RecipeDisplayState>()(
  persist(
    (set, get) => ({
      recipeScales: {},
      scaleOptions: SCALE_OPTIONS,

      setRecipeScale: (recipeId, scale) => {
        if (!SCALE_OPTIONS.includes(scale)) return
        set((state) => ({
          recipeScales: { ...state.recipeScales, [recipeId]: scale }
        }))
      },

      getRecipeScale: (recipeId) => {
        return get().recipeScales[recipeId] ?? 1
      }
    }),
    {
      name: 'recipe-display-storage-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
