import React, { useEffect } from "react";
import {
  Image,
  StyleSheet,
  ActivityIndicator,
  View,
  Pressable,
} from "react-native";
import { Text } from "react-native";
import { BlurView } from "expo-blur";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { FullScreenModal } from "@/components/full-screen-modal";
import SheetModalBase from "@/components/sheet-modal-base";

// stores
import { useRecipeModalStore } from "@/stores/recipe-modal-store";
import useUIStore from "@/stores/global-ui-store";

// types
import { Recipe } from "@/lib/types";

// icons
import icons from "@/constants/icons";

// hooks
import { useRecipeData } from "@/features/recipe-view/hooks/use-recipe-data";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useColorScheme } from "@/hooks/useColorScheme";

// components
import PageSectionTitle from "@/features/recipe-view/components/section-title";
import {
  SectionEditStartCooking,
  SectionPinFavorite,
} from "@/features/recipe-view/components/section-actions";
import Tags from "@/features/recipe-view/components/section-tags";
import MetadataView from "@/features/recipe-view/components/section-metadata";
import Description from "@/features/recipe-view/components/section-description";
import SectionIngredients from "@/features/recipe-view/components/section-ingredients";
import SectionInstructions from "@/features/recipe-view/components/section-instructions";
import SectionEquipment from "@/features/recipe-view/components/section-equipment";
import SectionNotes from "@/features/recipe-view/components/section-notes";
import SectionNutrition from "@/features/recipe-view/components/section-nutrition";
import CookingExperienceContent from "@/features/cooking-experience/components/cooking-experience-content";
import AddGroceriesFromRecipeContent from "@/features/groceries/components/add-groceries-from-recipe";

export const RecipeModal: React.FC = () => {
  const { isVisible, recipeId, closeRecipe, goBack } = useRecipeModalStore();
  const { isIpad, dimensions } = useDeviceType();
  const { width } = dimensions;

  // Check if cooking experience modal is open to disable swipe gestures
  const isCookingExperienceModalVisible = useUIStore(
    (state) => state.isCookingExperienceModalVisible
  );
  const setCookingExperienceModalVisible = useUIStore(
    (state) => state.setCookingExperienceModalVisible
  );
  const isAddIngredientsFromRecipeModalVisible = useUIStore(
    (state) => state.isAddIngredientsFromRecipeModalVisible
  );
  const setAddIngredientsFromRecipeModalVisible = useUIStore(
    (state) => state.setAddIngredientsFromRecipeModalVisible
  );

  // Determine if we should use grid layout (for larger displays)
  const useGridLayout = width >= 768;

  // Handle hardware back button on Android
  useEffect(() => {
    if (!isVisible) return;

    const handleHardwareBackPress = () => {
      const handled = goBack();
      if (!handled) {
        closeRecipe();
      }
      return true; // Prevent default back behavior
    };

    // Only relevant for Android
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("hardwareBackPress", handleHardwareBackPress);
      return () => {
        window.removeEventListener("hardwareBackPress", handleHardwareBackPress);
      };
    }
  }, [isVisible, goBack, closeRecipe]);

  if (!recipeId) return null;

  return (
    <FullScreenModal
      visible={isVisible}
      onClose={closeRecipe}
      gestureEnabled={!isCookingExperienceModalVisible}
      showCloseButton={true}
    >
      <RecipeContent recipeId={recipeId} useGridLayout={useGridLayout} />

      {/* These modals are nested inside FullScreenModal so iOS can present
          them from the recipe detail's view controller (sibling Modals
          can't stack on iOS) */}
      <SheetModalBase
        isVisible={isCookingExperienceModalVisible}
        onClose={() => setCookingExperienceModalVisible(false)}
      >
        <CookingExperienceContent />
      </SheetModalBase>

      <SheetModalBase
        isVisible={isAddIngredientsFromRecipeModalVisible}
        onClose={() => setAddIngredientsFromRecipeModalVisible(false)}
      >
        <AddGroceriesFromRecipeContent />
      </SheetModalBase>
    </FullScreenModal>
  );
};

interface RecipeContentProps {
  recipeId: string;
  useGridLayout: boolean;
}

const RecipeContent: React.FC<RecipeContentProps> = ({ recipeId, useGridLayout }) => {
  const { data, isLoading, error } = useRecipeData(recipeId);
  const { closeRecipe } = useRecipeModalStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF385C" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text className="font-body text-foreground-light dark:text-foreground-dark">
          Error: {error.message}
        </Text>
      </View>
    );
  }

  // Warm palette header background colors
  const headerBg = { light: "#F9F6F1", dark: "#1C1917" };

  // Grid layout for larger displays
  if (useGridLayout) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={headerBg}
        headerImage={<HeaderImage recipeId={recipeId} />}
        headerOverlay={undefined}
        title={data?.title}
      >
        <View className="flex-1 h-full pb-16">
          {/* Top sections remain in single column */}
          <PageSectionTitle recipe={data} />
          <Description recipe={data} />
          <SectionEditStartCooking recipe={data} />
          <Tags recipe={data} />
          <MetadataView recipe={data} />
          <SectionPinFavorite recipe={data} />

          {/* First row: Ingredients on left, Instructions on right */}
          <View className="flex-row pt-6">
            <View className="flex-1 border-r border-border-light dark:border-border-dark">
              <SectionIngredients recipe={data} />
            </View>
            <View className="flex-1">
              <SectionInstructions recipe={data} />
            </View>
          </View>

          {/* Second row: Equipment on left, Notes on right */}
          <View className="flex-row">
            <View className="flex-1 border-r border-border-light dark:border-border-dark">
              <SectionEquipment recipe={data} />
            </View>
            <View className="flex-1">
              <SectionNotes recipe={data} />
            </View>
          </View>

          {/* Nutrition remains in single column */}
          <SectionNutrition recipe={data} />
        </View>
      </ParallaxScrollView>
    );
  }

  // Default layout for smaller displays (original single column)
  return (
    <ParallaxScrollView
      headerBackgroundColor={headerBg}
      headerImage={<HeaderImage recipeId={recipeId} />}
      headerOverlay={undefined}
      title={data?.title}
    >
      <View className="flex-1 h-full pb-16">
        <PageSectionTitle recipe={data} />
        <Description recipe={data} />
        <SectionEditStartCooking recipe={data} />
        <Tags recipe={data} />
        <MetadataView recipe={data} />
        <SectionPinFavorite recipe={data} />
        <View className="flex-row pt-6"></View>
        <SectionIngredients recipe={data} />
        <SectionInstructions recipe={data} />
        <SectionEquipment recipe={data} />
        <SectionNotes recipe={data} />
        <SectionNutrition recipe={data} />
      </View>
    </ParallaxScrollView>
  );
};

function CloseButton() {
  const { closeRecipe } = useRecipeModalStore();
  const colorScheme = useColorScheme();

  return (
    <View className="flex-row justify-end w-full">
      <Pressable
        className="mt-12 overflow-hidden rounded-full"
        onPress={closeRecipe}
      >
        <BlurView
          intensity={60}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={closeBtnStyles.frostedPill}
        >
          <Image
            source={icons.closeIconLight}
            className="w-5 h-5"
            resizeMode="contain"
            style={{
              tintColor: colorScheme === "dark" ? "#F5F0EB" : "#292119",
            }}
          />
        </BlurView>
      </Pressable>
    </View>
  );
}

const closeBtnStyles = StyleSheet.create({
  frostedPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
});

function HeaderImage({ recipeId }: { recipeId: string }) {
  const { data } = useRecipeData(recipeId);

  return (
    <Image
      source={
        data?.imageUrl
          ? { uri: data.imageUrl }
          : require("@/assets/icons/placeholder-recipe.png")
      }
      style={styles.recipeImage}
    />
  );
}

const styles = StyleSheet.create({
  recipeImage: {
    height: "100%",
    width: "100%",
    position: "absolute",
  },
});
