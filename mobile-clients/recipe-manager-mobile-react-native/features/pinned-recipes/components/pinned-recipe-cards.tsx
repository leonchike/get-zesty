import { View, Text, TouchableOpacity, Image } from "react-native";
import { Recipe } from "@/lib/types";
import { usePinnedRecipes } from "../hooks/use-pinned-recipes";
import { useRouter } from "expo-router";
import { useDeviceType } from "@/hooks/useDeviceType";
import {
  calculateTotalTime,
  humanReadableTime,
} from "@/lib/helpers/recipe-display-helpers";
import clsx from "clsx";
import icons from "@/constants/icons";
import { FlatList } from "react-native";
import { useRecipeModalStore } from "@/stores/recipe-modal-store";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

export const PinnedRecipeCards = () => {
  const { data: pinnedRecipes } = usePinnedRecipes();

  if (!pinnedRecipes || pinnedRecipes.length === 0) return null;

  return (
    <View className="">
      <View
        className={clsx(
          "mt-4 flex flex-row items-center gap-2",
          horizontalPaddingValue
        )}
      >
        <Text className="text-2xl">📍</Text>
        <Text className="text-lg font-bold text-primary-dark dark:text-primary-light">
          Pinned Recipes
        </Text>
      </View>
      <View className="mt-2">
        <FlatList
          data={pinnedRecipes}
          renderItem={({ item }) => <PinnedRecipeCard recipe={item} />}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>
    </View>
  );
};

const PinnedRecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const router = useRouter();
  const { openRecipe } = useRecipeModalStore();
  const { isIPhone16Pro } = useDeviceType();
  const { prepTime, cookTime, restTime, imageUrl, title } = recipe;
  const totalTime = calculateTotalTime(prepTime, cookTime, restTime);

  const handlePress = () => {
    openRecipe(recipe.id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="overflow-hidden w-44 mr-4"
      activeOpacity={0.9}
    >
      <View className="relative w-44 h-32 rounded-xl">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="rounded-xl w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center rounded-xl relative">
            <View className="w-1/3 h-auto">
              <ImagePlaceholder />
            </View>
          </View>
        )}
        {totalTime && (
          <View className="absolute top-2 left-2 bg-brandGold-light rounded-full px-3 py-1">
            <Text className="text-sm font-semibold text-gray-700">
              {humanReadableTime(totalTime)}
            </Text>
          </View>
        )}
      </View>
      <View className="py-2 space-y-1">
        <Text
          className={clsx(
            isIPhone16Pro() ? "text-base" : "text-lg",
            "font-medium dark:text-primary-light"
          )}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

function ImagePlaceholder() {
  return (
    <Image
      source={icons.recipePlaceholder}
      style={{ width: "100%", height: "100%", resizeMode: "contain" }}
    />
  );
}
