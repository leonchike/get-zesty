import { create } from "zustand";

export interface RecipeStore {
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  isFavorite: boolean;
  isPinned: boolean;
  isPersonal: boolean;
  isPublic: boolean;
  selectedCuisineTypes: string[];
  selectedMealTypes: string[];
  availableMealTypes: string[];
  availableCuisineTypes: string[];
  setIsFavorite: (isFavorite: boolean) => void;
  setIsPinned: (isPinned: boolean) => void;
  setIsPersonal: (isPersonal: boolean) => void;
  setIsPublic: (isPublic: boolean) => void;
  toggleSelectedCuisineType: (cuisineType: string) => void;
  toggleSelectedMealType: (mealType: string) => void;
  setAvailableMealTypes: (availableMealTypes: string[]) => void;
  setAvailableCuisineTypes: (availableCuisineTypes: string[]) => void;
  resetFilters: () => void;
}

const initialState = {
  searchInput: "",
  isFavorite: false,
  isPinned: false,
  isPersonal: true,
  isPublic: false,
  selectedCuisineTypes: [] as string[],
  selectedMealTypes: [] as string[],
  availableMealTypes: [] as string[],
  availableCuisineTypes: [] as string[],
};

export const useRecipeStore = create<RecipeStore>((set) => ({
  ...initialState,
  setSearchInput: (searchInput) => set({ searchInput }),
  setIsFavorite: (isFavorite) => set({ isFavorite }),
  setIsPinned: (isPinned) => set({ isPinned }),
  setIsPersonal: (isPersonal) => set({ isPersonal }),
  setIsPublic: (isPublic) => set({ isPublic }),
  toggleSelectedCuisineType: (cuisineType) =>
    set((state) => ({
      selectedCuisineTypes: state.selectedCuisineTypes.includes(cuisineType)
        ? state.selectedCuisineTypes.filter((type) => type !== cuisineType)
        : [...state.selectedCuisineTypes, cuisineType],
    })),
  toggleSelectedMealType: (mealType) =>
    set((state) => ({
      selectedMealTypes: state.selectedMealTypes.includes(mealType)
        ? state.selectedMealTypes.filter((type) => type !== mealType)
        : [...state.selectedMealTypes, mealType],
    })),
  setAvailableMealTypes: (availableMealTypes) => set({ availableMealTypes }),
  setAvailableCuisineTypes: (availableCuisineTypes) =>
    set({ availableCuisineTypes }),
  resetFilters: () => set(initialState),
}));
