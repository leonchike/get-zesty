import React from "react";
import { View, Text, Pressable } from "react-native";
import { ParsedIngredient } from "@/lib/types";
import {
  humanReadableUnit,
  decimalToFraction,
} from "@/lib/helpers/recipe-display-helpers";
import { useDeviceType } from "@/hooks/useDeviceType";
import { cn } from "@/lib/helpers/cn";
import { ParsedInstructionText } from "@/features/cooking-timer/components/parsed-instruction-text";

export function InstructionsIngredientsDisplay({
  recipeId,
  recipeName,
  ingredients,
  currentAssociatedIngredients,
  currentStep,
  totalSteps,
  showIngredients,
  scale,
  parsedInstructions,
  onStepPress,
}: {
  recipeId: string;
  recipeName: string;
  ingredients: ParsedIngredient[];
  currentAssociatedIngredients: ParsedIngredient[];
  currentStep: number;
  totalSteps: number;
  showIngredients: boolean;
  scale: number;
  parsedInstructions: string[];
  onStepPress?: (stepIndex: number) => void;
}) {
  const { deviceType } = useDeviceType();

  const renderIngredientPill = (
    ingredient: ParsedIngredient,
    scale: number,
    index: number
  ) => {
    const parts: string[] = [];
    if (ingredient?.quantity) {
      parts.push(decimalToFraction(ingredient.quantity * scale));
    }
    if (ingredient.unit) {
      parts.push(humanReadableUnit({ unit: ingredient.unit }));
    }
    if (ingredient.ingredient) parts.push(ingredient.ingredient);
    if (ingredient.extra) {
      parts.push(ingredient.extra);
    }

    return (
      <View
        key={index}
        className="bg-surface-light dark:bg-surface-dark px-3.5 py-1.5 rounded-full mr-2 mb-2 border border-border-light dark:border-border-dark"
      >
        <Text
          className={cn(
            "font-body-medium text-foreground-light dark:text-foreground-dark",
            deviceType === "iPad" ? "text-base" : "text-sm"
          )}
        >
          {parts.join(" ")}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark pb-28">
      {showIngredients && (
        <View className="border-b-2 p-4 pb-8 border-border-light dark:border-border-dark">
          <Text className="font-heading-semibold mb-4 text-foreground-light dark:text-foreground-dark text-lg">
            All Ingredients
          </Text>
          <View className="flex-col gap-1.5">
            {ingredients.map((ingredient, index) => (
              <View key={index}>
                <View className="py-1 rounded-md">
                  <View className="flex-row items-start gap-2">
                    <View className="w-20">
                      <Text className="font-body text-muted-light dark:text-muted-dark">
                        {!!ingredient?.quantity
                          ? decimalToFraction(
                              (ingredient?.quantity ?? 0) * scale
                            )
                          : ""}{" "}
                        {humanReadableUnit({ unit: ingredient?.unit })}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-body text-foreground-light dark:text-foreground-dark">
                        {ingredient?.ingredient}
                      </Text>
                      {ingredient?.extra && (
                        <Text className="font-body text-sm text-muted-light dark:text-muted-dark opacity-70">
                          {ingredient.extra}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View
        className={cn(
          "p-4 pt-8",
          deviceType === "iPad" ? "max-w-5xl mx-auto pt-24" : "max-w-full"
        )}
      >
        {/* Recipe name */}
        <Text
          className={cn(
            "font-heading-semibold mb-3 text-foreground-light dark:text-foreground-dark",
            deviceType === "iPad" ? "text-4xl" : "text-2xl"
          )}
        >
          {recipeName}
        </Text>

        {/* Step progress */}
        <Text
          className={cn(
            "font-body-medium text-muted-light dark:text-muted-dark mb-6",
            deviceType === "iPad" ? "text-xl" : "text-base"
          )}
        >
          Step {currentStep + 1} of {totalSteps}
        </Text>

        {/* Scrollable step list - Mela-inspired */}
        <View className="mb-8">
          {parsedInstructions.map((instruction, index) => {
            const isCurrent = index === currentStep;
            const isPrevious = index < currentStep;
            const isNext = index > currentStep;

            return (
              <Pressable
                key={index}
                onPress={() => onStepPress?.(index)}
                className={cn(
                  "mb-5",
                  isCurrent && "mb-4"
                )}
              >
                {/* Step number label */}
                <Text
                  className={cn(
                    "font-body-semibold mb-1",
                    isCurrent
                      ? "text-accent-light dark:text-accent-dark text-sm"
                      : "text-muted-light dark:text-muted-dark text-xs opacity-50"
                  )}
                >
                  STEP {index + 1}
                </Text>

                {/* Step instruction text */}
                {isCurrent ? (
                  <ParsedInstructionText
                    text={instruction}
                    recipeId={recipeId}
                    recipeName={recipeName}
                    stepIndex={index}
                    textClassName={cn(
                      "font-heading text-foreground-light dark:text-foreground-dark",
                      deviceType === "iPad"
                        ? "text-[36px] leading-[3rem]"
                        : "text-[28px] leading-[2.5rem]"
                    )}
                  />
                ) : (
                  <Text
                    className={cn(
                      isPrevious &&
                        cn(
                          "font-body text-muted-light dark:text-muted-dark opacity-30",
                          deviceType === "iPad" ? "text-2xl" : "text-lg"
                        ),
                      isNext &&
                        cn(
                          "font-body text-foreground-light dark:text-foreground-dark opacity-50",
                          deviceType === "iPad" ? "text-2xl" : "text-xl"
                        )
                    )}
                  >
                    {instruction}
                  </Text>
                )}

                {/* Associated ingredients as compact pills — only for current step */}
                {isCurrent && currentAssociatedIngredients.length > 0 && (
                  <View className="flex-row flex-wrap mt-3">
                    {currentAssociatedIngredients.map((ingredient, i) =>
                      renderIngredientPill(ingredient, scale, i)
                    )}
                  </View>
                )}

                {/* Subtle divider between steps */}
                {isCurrent && (
                  <View className="h-px bg-border-light dark:bg-border-dark mt-5" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
