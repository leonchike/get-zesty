// stores/filterStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";

export interface FilterState {
  search: string;
  isFavorite: boolean;
  isPinned: boolean;
  isPersonal: boolean;
  isPublic: boolean;
  selectedCuisineTypes: string[];
  selectedMealTypes: string[];
  availableMealTypes: string[];
  availableCuisineTypes: string[];
  setSearch: (search: string) => void;
  setIsFavorite: (isFavorite: boolean) => void;
  setIsPinned: (isPinned: boolean) => void;
  setIsPersonal: (isPersonal: boolean) => void;
  setIsPublic: (isPublic: boolean) => void;
  toggleSelectedCuisineType: (cuisineType: string) => void;
  toggleSelectedMealType: (mealType: string) => void;
  setAvailableMealTypes: (availableMealTypes: string[]) => void;
  setAvailableCuisineTypes: (availableCuisineTypes: string[]) => void;
  resetFilters: () => void;
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
}

const initialState = {
  search: "",
  isFavorite: false,
  isPinned: false,
  isPersonal: true,
  isPublic: false,
  selectedCuisineTypes: [],
  selectedMealTypes: [],
  availableMealTypes: [],
  availableCuisineTypes: [],
  globalSearch: "",
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ...initialState,
      setSearch: (search) => set({ search }),
      setIsFavorite: (isFavorite) => set({ isFavorite }),
      setIsPinned: (isPinned) => set({ isPinned }),
      setIsPersonal: (isPersonal) => set({ isPersonal }),
      setIsPublic: (isPublic) => set({ isPublic }),
      toggleSelectedCuisineType: (cuisineType) =>
        set(
          produce((state) => {
            const index = state.selectedCuisineTypes.indexOf(cuisineType);
            if (index > -1) {
              state.selectedCuisineTypes.splice(index, 1);
            } else {
              state.selectedCuisineTypes.push(cuisineType);
            }
          })
        ),
      toggleSelectedMealType: (mealType) =>
        set(
          produce((state) => {
            if (!mealType.trim()) return;
            const index = state.selectedMealTypes.indexOf(mealType);
            if (index > -1) {
              state.selectedMealTypes.splice(index, 1);
            } else {
              state.selectedMealTypes.push(mealType);
            }
          })
        ),
      setAvailableMealTypes: (availableMealTypes) =>
        set({ availableMealTypes }),
      setAvailableCuisineTypes: (availableCuisineTypes) =>
        set({ availableCuisineTypes }),
      resetFilters: () => set({ ...initialState, isPersonal: false }),
      setGlobalSearch: (search) => set({ globalSearch: search }),
    }),
    {
      name: "recipe-filters",
    }
  )
);
