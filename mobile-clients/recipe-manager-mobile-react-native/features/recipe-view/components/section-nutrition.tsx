import { Text, View } from "react-native";
import clsx from "clsx";

// types
import { Recipe } from "@/lib/types";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

// components
import {
  SectionHeader,
  ToggleableItem,
} from "@/features/recipe-view/components/reusable-components";

// helpers
import { splitRecipeStringCommaSemicolon } from "@/lib/helpers/split-recipe-string";
import EmptyRecipeSectionState from "./empty-state";

export default function SectionNutrition({
  recipe,
}: {
  recipe: Recipe | undefined;
}) {
  if (!recipe) return null;
  const { nutrition } = recipe;

  return (
    <View className={clsx("items-center gap-3 pt-10", horizontalPaddingValue)}>
      <View className="w-full border-t border-primary-dark/10 dark:border-primary-light/10">
        <View className="pt-10">
          <SectionHeader emoji="🥗" title="Nutrition" />
        </View>

        <View className={clsx("flex-row flex-wrap mt-6")}>
          {nutrition ? (
            <DisplayItems items={nutrition} />
          ) : (
            <EmptyRecipeSectionState message="Nutrition information is not available" />
          )}
        </View>
      </View>
    </View>
  );
}

function DisplayItems({ items }: { items: string | null }) {
  const { isIPhone16Pro } = useDeviceType();
  if (!items) return null;

  const itemsArray = splitRecipeStringCommaSemicolon(items) as string[];

  return (
    <View className={clsx(isIPhone16Pro() ? "gap-3" : "gap-4")}>
      {itemsArray.map((item, index) => (
        <ToggleableItem key={index}>
          <Text
            className={clsx(
              isIPhone16Pro() ? "text-base" : "text-lg",
              "text-primary-dark dark:text-primary-light"
            )}
          >
            {item}
          </Text>
        </ToggleableItem>
      ))}
    </View>
  );
}
