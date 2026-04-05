import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface FilterState {
  search: string
  isFavorite: boolean
  isPinned: boolean
  isPersonal: boolean
  isPublic: boolean
  selectedCuisineTypes: string[]
  selectedMealTypes: string[]

  setSearch: (search: string) => void
  setIsFavorite: (v: boolean) => void
  setIsPinned: (v: boolean) => void
  setIsPersonal: (v: boolean) => void
  setIsPublic: (v: boolean) => void
  setSelectedCuisineTypes: (types: string[]) => void
  setSelectedMealTypes: (types: string[]) => void
  resetFilters: () => void
  hasActiveFilters: () => boolean
}

const initialFilters = {
  search: '',
  isFavorite: false,
  isPinned: false,
  isPersonal: false,
  isPublic: false,
  selectedCuisineTypes: [] as string[],
  selectedMealTypes: [] as string[]
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...initialFilters,
      setSearch: (search) => set({ search }),
      setIsFavorite: (isFavorite) => set({ isFavorite }),
      setIsPinned: (isPinned) => set({ isPinned }),
      setIsPersonal: (isPersonal) => set({ isPersonal }),
      setIsPublic: (isPublic) => set({ isPublic }),
      setSelectedCuisineTypes: (selectedCuisineTypes) => set({ selectedCuisineTypes }),
      setSelectedMealTypes: (selectedMealTypes) => set({ selectedMealTypes }),
      resetFilters: () => set(initialFilters),
      hasActiveFilters: () => {
        const s = get()
        return (
          s.isFavorite ||
          s.isPinned ||
          s.isPersonal ||
          s.isPublic ||
          s.selectedCuisineTypes.length > 0 ||
          s.selectedMealTypes.length > 0
        )
      }
    }),
    {
      name: 'recipe-filters',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
