import { create } from "zustand";
import { Recipe } from "@/lib/types";

export interface GlobalUIStore {
  isFilterModalVisible: boolean;
  setFilterModalVisible: (visible: boolean) => void;
  isCookingExperienceModalVisible: boolean;
  setCookingExperienceModalVisible: (visible: boolean) => void;
  selectedRecipeForCookingExperience: Recipe | null;
  setSelectedRecipeForCookingExperience: (recipe: Recipe | null) => void;
  isAddIngredientsFromRecipeModalVisible: boolean;
  setAddIngredientsFromRecipeModalVisible: (visible: boolean) => void;
  isImageSheetModalVisible: boolean;
  setImageSheetModalVisible: (visible: boolean) => void;
  isSettingsModalVisible: boolean;
  setSettingsModalVisible: (visible: boolean) => void;
}

const useUIStore = create<GlobalUIStore>((set) => ({
  isFilterModalVisible: false,
  setFilterModalVisible: (visible: boolean) =>
    set({ isFilterModalVisible: visible }),
  isCookingExperienceModalVisible: false,
  setCookingExperienceModalVisible: (visible: boolean) =>
    set({ isCookingExperienceModalVisible: visible }),
  selectedRecipeForCookingExperience: null,
  setSelectedRecipeForCookingExperience: (recipe: Recipe | null) =>
    set({ selectedRecipeForCookingExperience: recipe }),
  isAddIngredientsFromRecipeModalVisible: false,
  setAddIngredientsFromRecipeModalVisible: (visible: boolean) =>
    set({ isAddIngredientsFromRecipeModalVisible: visible }),
  isImageSheetModalVisible: false,
  setImageSheetModalVisible: (visible: boolean) =>
    set({ isImageSheetModalVisible: visible }),
  isSettingsModalVisible: false,
  setSettingsModalVisible: (visible: boolean) =>
    set({ isSettingsModalVisible: visible }),
}));

export default useUIStore;
