import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CookingState {
  isActive: boolean
  currentRecipeId: string | null
  currentStep: number
  totalSteps: number
  showIngredients: boolean
  startedAt: number | null

  startCooking: (recipeId: string, totalSteps: number) => void
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  toggleIngredients: () => void
  stopCooking: () => void
}

export const useCookingStore = create<CookingState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentRecipeId: null,
      currentStep: 0,
      totalSteps: 0,
      showIngredients: false,
      startedAt: null,

      startCooking: (recipeId, totalSteps) =>
        set({
          isActive: true,
          currentRecipeId: recipeId,
          currentStep: 0,
          totalSteps,
          showIngredients: false,
          startedAt: Date.now()
        }),

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep, totalSteps } = get()
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      toggleIngredients: () => set((s) => ({ showIngredients: !s.showIngredients })),

      stopCooking: () =>
        set({
          isActive: false,
          currentRecipeId: null,
          currentStep: 0,
          totalSteps: 0,
          showIngredients: false,
          startedAt: null
        })
    }),
    {
      name: 'cooking-progress',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
