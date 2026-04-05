import { useState } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";

// components
import CustomButton from "@/components/custom-button";

// actions
import { deleteRecipe } from "../actions/recipe-actions";

// constants
import { APP_ROUTES } from "@/lib/routes";

export function DeleteRecipe({ recipeId }: { recipeId: string }) {
  const router = useRouter();

  const [currentState, setCurrentState] = useState<
    "Default" | "DeleteConfirmation"
  >("Default");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setCurrentState("DeleteConfirmation");
  };

  const handleCancel = () => {
    setCurrentState("Default");
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteRecipe({ recipeId });
      router.push(APP_ROUTES.home);
    } catch (error) {
      Alert.alert("Error", "Unable to delete the recipe. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View>
      {currentState === "Default" && (
        <CustomButton
          onPress={handleDeleteClick}
          variant="danger"
          title="Delete Recipe"
        />
      )}

      {currentState === "DeleteConfirmation" && (
        <View className="flex flex-row gap-4">
          <CustomButton
            onPress={handleCancel}
            isDisabled={isDeleting}
            variant="secondary"
            title="Cancel"
          />

          <CustomButton
            onPress={handleConfirmDelete}
            isDisabled={isDeleting}
            isLoading={isDeleting}
            variant="danger"
            containerStyles="flex-1"
            title={isDeleting ? "Deleting..." : "Confirm delete"}
          />
        </View>
      )}
    </View>
  );
}
