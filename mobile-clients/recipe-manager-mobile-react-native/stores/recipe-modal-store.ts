import { create } from "zustand";

interface RecipeModalState {
  // Modal state
  isVisible: boolean;
  recipeId: string | null;
  
  // Navigation history for back handling
  navigationHistory: string[];
  
  // Actions
  openRecipe: (recipeId: string | number) => void;
  closeRecipe: () => void;
  navigateToRecipe: (recipeId: string | number) => void;
  goBack: () => boolean; // Returns true if handled, false if should close modal
  
  // State helpers
  reset: () => void;
}

export const useRecipeModalStore = create<RecipeModalState>((set, get) => ({
  // Initial state
  isVisible: false,
  recipeId: null,
  navigationHistory: [],
  
  // Open recipe modal with a specific recipe
  openRecipe: (recipeId: string | number) => {
    const id = String(recipeId);
    set({
      isVisible: true,
      recipeId: id,
      navigationHistory: [id],
    });
  },
  
  // Close the recipe modal completely
  closeRecipe: () => {
    set({
      isVisible: false,
      recipeId: null,
      navigationHistory: [],
    });
  },
  
  // Navigate to a different recipe within the modal
  navigateToRecipe: (recipeId: string | number) => {
    const id = String(recipeId);
    const { navigationHistory } = get();
    set({
      recipeId: id,
      navigationHistory: [...navigationHistory, id],
    });
  },
  
  // Handle back navigation
  goBack: () => {
    const { navigationHistory } = get();
    
    if (navigationHistory.length > 1) {
      // Pop the current recipe and go to previous
      const newHistory = navigationHistory.slice(0, -1);
      const previousRecipeId = newHistory[newHistory.length - 1];
      
      set({
        recipeId: previousRecipeId,
        navigationHistory: newHistory,
      });
      
      return true; // Handled the back action
    }
    
    return false; // Should close modal
  },
  
  // Reset the store
  reset: () => {
    set({
      isVisible: false,
      recipeId: null,
      navigationHistory: [],
    });
  },
}));