import {
  Image,
  StyleSheet,
  ActivityIndicator,
  View,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

// types
import { Recipe } from "@/lib/types";

// icons
import icons from "@/constants/icons";

// hooks
import {
  useRecipeData,
  getRecipeQueryKey,
} from "@/features/recipe-view/hooks/use-recipe-data";

// routes
import { APP_ROUTES } from "@/lib/routes";

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

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";

export default function RecipePage() {
  const { id } = useLocalSearchParams();
  const { isIpad, dimensions } = useDeviceType();
  const { width } = dimensions;

  // Determine if we should use grid layout (for larger displays)
  const useGridLayout = width >= 768;

  if (typeof id !== "string") return null;
  const { data, isLoading, error } = useRecipeData(id);

  if (isLoading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF385C" />
      </View>
    );
  if (error) return <Text>Error: {error.message}</Text>;

  // Grid layout for larger displays
  if (useGridLayout) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#F9F6F1", dark: "#1C1917" }}
        headerImage={<HeaderImage recipe={data} />}
        headerOverlay={<BackButton />}
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
      headerBackgroundColor={{ light: "#F9F6F1", dark: "#1C1917" }}
      headerImage={<HeaderImage recipe={data} />}
      headerOverlay={<BackButton />}
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
}

function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    router.replace({
      // @ts-ignore
      pathname: APP_ROUTES.home,
      params: {
        animation: "slide_from_right",
      },
    });
  };

  return (
    <Pressable className="p-2 mt-12" onPress={handleBack}>
      <Image
        source={icons.backChevronLight}
        className="w-8 h-8"
        resizeMode="contain"
      />
    </Pressable>
  );
}

function HeaderImage({ recipe }: { recipe?: Recipe }) {
  return (
    <Image
      source={
        recipe?.imageUrl
          ? { uri: recipe.imageUrl }
          : require("@/assets/icons/placeholder-recipe.png")
      }
      style={styles.recipeImage}
    />
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  recipeImage: {
    height: "100%",
    width: "100%",
    position: "absolute",
  },
});
