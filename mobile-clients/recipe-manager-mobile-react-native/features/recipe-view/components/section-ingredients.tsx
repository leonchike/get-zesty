import { Text, View, Pressable } from "react-native";
import clsx from "clsx";

// types
import { Recipe } from "@/lib/types";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";
import { useColorScheme } from "react-native";
import { useRecipeDisplayStore } from "@/features/recipe-view/stores/recipe-display-store";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";
import { ParsedIngredient } from "@/lib/types";
import { PlusIcon, MinusIcon } from "@/components/custom-icons";

// components
import {
  SectionHeader,
  ToggleableItem,
} from "@/features/recipe-view/components/reusable-components";
import CustomButton from "@/components/custom-button";

// helpers
import {
  humanReadableUnit,
  decimalToFraction,
} from "@/lib/helpers/recipe-display-helpers";

// stores
import useUIStore from "@/stores/global-ui-store";
import { useAddIngredientsStore } from "@/features/groceries/stores/add-ingredients-store";

export default function SectionIngredients({
  recipe,
}: {
  recipe: Recipe | undefined;
}) {
  const { setAddIngredientsFromRecipeModalVisible } = useUIStore();
  const { setIngredients, setRecipeName, setRecipeScale, setRecipeId } =
    useAddIngredientsStore();
  const { dimensions } = useDeviceType();
  const { width } = dimensions;
  const { getRecipeScale } = useRecipeDisplayStore();

  // Determine if we're in grid layout
  const isGridLayout = width >= 768;

  if (!recipe) return null;
  const { ingredients, parsedIngredients, id } = recipe;
  const scale = getRecipeScale(id);

  let JSONIngredients: ParsedIngredient[] = [];
  if (typeof parsedIngredients === "string") {
    JSONIngredients = JSON.parse(parsedIngredients);
  } else {
    JSONIngredients = parsedIngredients ?? [];
  }

  const handleAddIngredientsFromRecipe = async () => {
    setIngredients(
      JSONIngredients.map((ingredient) => ({ ...ingredient, selected: true }))
    );
    setRecipeName(recipe.title);
    setRecipeScale(scale);
    setRecipeId(id);
    setAddIngredientsFromRecipeModalVisible(true);
  };

  // Adjust padding based on whether we're in grid layout
  const gridPaddingClass = isGridLayout ? "px-4" : horizontalPaddingValue;

  return (
    <View className={clsx("items-center gap-3 pb-8", gridPaddingClass)}>
      <View className="w-full border-t border-border-light dark:border-border-dark">
        <View className="pt-10 flex-row items-center justify-between">
          <SectionHeader title="Ingredients" />
          <IngredientScale recipeId={id} />
        </View>

        <View className="flex-row flex-wrap gap-2">
          <DisplayIngredient
            ingredients={ingredients}
            parsedIngredients={JSONIngredients}
            scale={scale}
            recipeId={id}
          />
        </View>
      </View>

      <View className="w-full pt-4">
        <CustomButton
          handlePress={handleAddIngredientsFromRecipe}
          variant="ghost"
          containerStyles="self-start"
        >
          Add to grocery list
        </CustomButton>
      </View>
    </View>
  );
}

interface DisplayIngredientProps {
  ingredients: string | undefined;
  parsedIngredients: ParsedIngredient[];
  scale: number;
  recipeId: string;
}

function DisplayIngredient({
  ingredients,
  parsedIngredients,
  scale = 1,
  recipeId,
}: DisplayIngredientProps) {
  if (!ingredients) return null;

  return (
    <View className="mt-6 gap-2">
      {parsedIngredients &&
        parsedIngredients.length > 0 &&
        parsedIngredients.map((ingredient: ParsedIngredient, index: number) => (
          <IngredientItem
            key={ingredient.ingredient + index}
            parsedIngredient={ingredient}
            scale={scale}
          />
        ))}
    </View>
  );
}

interface IngredientItemProps {
  parsedIngredient: ParsedIngredient;
  scale: number;
}

export function IngredientItem({
  parsedIngredient,
  scale,
}: IngredientItemProps) {
  const { isIPhone16Pro } = useDeviceType();

  return (
    <ToggleableItem>
      <View className="flex-row items-start">
        <View className="w-[70px] mr-2">
          <Text
            className={clsx(
              isIPhone16Pro() ? "text-base" : "text-lg",
              "font-body-medium text-foreground-light dark:text-foreground-dark"
            )}
          >
            {!!parsedIngredient?.quantity
              ? decimalToFraction((parsedIngredient?.quantity ?? 0) * scale)
              : ""}{" "}
            {humanReadableUnit({ unit: parsedIngredient?.unit })}
          </Text>
        </View>
        <View className="flex">
          <Text
            className={clsx(
              isIPhone16Pro() ? "text-base" : "text-lg",
              "font-body text-foreground-light dark:text-foreground-dark"
            )}
          >
            {parsedIngredient?.ingredient}
          </Text>
          {parsedIngredient?.extra && (
            <Text
              className={clsx(
                isIPhone16Pro() ? "text-sm" : "text-base",
                "font-body text-muted-light dark:text-muted-dark"
              )}
            >
              {parsedIngredient.extra}
            </Text>
          )}
        </View>
      </View>
    </ToggleableItem>
  );
}

interface IngredientScaleProps {
  recipeId: string;
}

function IngredientScale({ recipeId }: IngredientScaleProps) {
  const { isIPhone16Pro, isIpad } = useDeviceType();
  const colorScheme = useColorScheme();

  const { scaleOptions, getRecipeScale, setRecipeScale } =
    useRecipeDisplayStore();
  const currentScale = getRecipeScale(recipeId);
  const currentIndex = scaleOptions.indexOf(currentScale);

  const decrementScale = () => {
    if (currentIndex > 0) {
      setRecipeScale(recipeId, scaleOptions[currentIndex - 1]);
    }
  };

  const incrementScale = () => {
    if (currentIndex < scaleOptions.length - 1) {
      setRecipeScale(recipeId, scaleOptions[currentIndex + 1]);
    }
  };

  // Active state: coral for active buttons, muted for disabled
  const isDecrementActive = currentIndex > 0;
  const isIncrementActive = currentIndex < scaleOptions.length - 1;

  const decrementColor = isDecrementActive ? "#FF385C" : (colorScheme === "dark" ? "#A8A29E" : "#78716C");
  const incrementColor = isIncrementActive ? "#FF385C" : (colorScheme === "dark" ? "#A8A29E" : "#78716C");

  return (
    <View className="flex-row items-center gap-3">
      <CustomButtonLocal
        handlePress={decrementScale}
        isDisabled={!isDecrementActive}
        className={clsx(
          "rounded-full p-0 items-center justify-center",
          isIpad() ? "w-10 h-10" : "w-8 h-8",
          isDecrementActive
            ? "bg-[#FF385C]/10"
            : "bg-border-light dark:bg-border-dark"
        )}
      >
        <MinusIcon width={12} height={12} color={decrementColor} />
      </CustomButtonLocal>

      <Text
        className={clsx(
          isIPhone16Pro() ? "text-base" : "text-lg",
          "font-body-semibold min-w-7 text-center text-foreground-light dark:text-foreground-dark"
        )}
        style={{
          color: currentScale !== 1 ? "#F0960A" : undefined,
        }}
      >
        {currentScale}x
      </Text>

      <CustomButtonLocal
        handlePress={incrementScale}
        isDisabled={!isIncrementActive}
        className={clsx(
          "rounded-full p-0 items-center justify-center",
          isIpad() ? "w-10 h-10" : "w-8 h-8",
          isIncrementActive
            ? "bg-[#FF385C]/10"
            : "bg-border-light dark:bg-border-dark"
        )}
      >
        <PlusIcon width={12} height={12} color={incrementColor} />
      </CustomButtonLocal>
    </View>
  );
}

interface CustomButtonProps {
  children: React.ReactNode;
  handlePress: () => void;
  isDisabled?: boolean;
  className?: string;
}

function CustomButtonLocal({
  children,
  handlePress,
  isDisabled,
  className,
}: CustomButtonProps) {
  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className={clsx("rounded-full p-0 w-8 h-8", className)}
    >
      {children}
    </Pressable>
  );
}
