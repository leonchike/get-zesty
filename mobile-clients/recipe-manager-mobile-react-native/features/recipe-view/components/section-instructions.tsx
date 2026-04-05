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
import { splitRecipeString } from "@/lib/helpers/split-recipe-string";

// cooking timer
import { ParsedInstructionText } from "@/features/cooking-timer/components/parsed-instruction-text";

export default function SectionInstructions({
  recipe,
}: {
  recipe: Recipe | undefined;
}) {
  const { isIPhone16Pro, dimensions } = useDeviceType();
  const { width } = dimensions;

  // Determine if we're in grid layout
  const isGridLayout = width >= 768;

  if (!recipe) return null;
  const { instructions } = recipe;
  if (!instructions) return null;

  const instructionsArray = splitRecipeString(instructions) as string[];

  // Adjust padding based on whether we're in grid layout
  const gridPaddingClass = isGridLayout ? "px-4" : horizontalPaddingValue;

  return (
    <View className={clsx("items-center gap-3", gridPaddingClass)}>
      <View className="w-full border-t border-border-light dark:border-border-dark">
        <View className="pt-10">
          <SectionHeader title="Instructions" />
        </View>

        <View className="mt-6 gap-5">
          {instructionsArray.map((instruction, index) => (
            <ToggleableItem key={index}>
              <View className="flex-row items-start gap-3">
                {/* Circled step number */}
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: "#FF385C",
                    minWidth: 28,
                  }}
                >
                  <Text
                    className="font-body-semibold text-white text-sm"
                    style={{ lineHeight: 18 }}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View className="flex-1 pt-0.5">
                  <ParsedInstructionText
                    text={instruction}
                    recipeId={recipe.id}
                    recipeName={recipe.title}
                    stepIndex={index}
                    textClassName={clsx(
                      isIPhone16Pro() ? "text-base" : "text-lg",
                      "font-body text-foreground-light dark:text-foreground-dark leading-6"
                    )}
                  />
                </View>
              </View>
            </ToggleableItem>
          ))}
        </View>
      </View>
    </View>
  );
}
