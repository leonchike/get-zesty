import { useRouter } from "expo-router";
import { useRecipeModalStore } from "@/stores/recipe-modal-store";
import { APP_ROUTES } from "@/lib/routes";

/**
 * Hook for navigating to the recipes index and opening a specific recipe modal
 * 
 * @returns Function to navigate to recipe modal
 */
export const useNavigateToRecipeModal = () => {
  const router = useRouter();
  const { openRecipe } = useRecipeModalStore();

  /**
   * Navigate to the recipes index page and open the specified recipe modal
   * 
   * @param recipeId - The ID of the recipe to display in the modal
   * @param replace - Whether to replace the current route (default: true)
   */
  const navigateToRecipeModal = (recipeId: string | number, replace: boolean = true) => {
    // Navigate to recipes index
    if (replace) {
      router.replace(APP_ROUTES.home);
    } else {
      router.push(APP_ROUTES.home);
    }
    
    // Open the recipe modal with the specified ID
    // Small delay to ensure navigation completes first
    setTimeout(() => {
      openRecipe(recipeId);
    }, 100);
  };

  return navigateToRecipeModal;
};