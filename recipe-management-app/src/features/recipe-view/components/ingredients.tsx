"use client";

import React from "react";
import { Recipe } from "@prisma/client";
import clsx from "clsx";
import {
  humanReadableUnit,
  decimalToFraction,
} from "@/lib/helpers/recipe-display-helpers.ts";
import { useRecipeDisplayStore } from "@/lib/stores/recipe-display-store";
import { Button } from "@/components/ui/button";
import { PlusIcon, MinusIcon } from "@/components/ui/icons/custom-icons";
import EmptyRecipeSectionState from "@/features/recipe-view/components/empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ToggleableItem,
  SectionHeader,
} from "@/features/recipe-view/components/list-item";
import AddIngredientsToGroceryList from "@/features/groceries/components/add-to-grocery-list-from-recipe";
import { ParsedIngredient } from "@/lib/types/types";

export default function Ingredients({
  recipe,
  isLoggedIn,
}: {
  recipe: Recipe;
  isLoggedIn: boolean;
}) {
  const { ingredients, parsedIngredients, id } = recipe;
  const { getRecipeScale } = useRecipeDisplayStore();

  const scale = getRecipeScale(id);

  let JSONIngredients: ParsedIngredient[] = [];
  if (typeof parsedIngredients === "string") {
    JSONIngredients = JSON.parse(parsedIngredients);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeader emoji="🧺" title="Ingredients" />
        {JSONIngredients.length > 0 && <IngredientScale recipeId={id} />}
      </div>
      <div className="">
        {JSONIngredients.length > 0 ? (
          <DisplayIngredients
            ingredients={ingredients}
            parsedIngredients={JSONIngredients}
            scale={scale}
            recipeId={id}
            isLoggedIn={isLoggedIn}
          />
        ) : (
          <EmptyRecipeSectionState message="No ingredients yet" />
        )}
      </div>
    </div>
  );
}

function DisplayIngredients({
  ingredients,
  parsedIngredients,
  scale = 1,
  recipeId,
  isLoggedIn,
}: {
  ingredients: string | null;
  parsedIngredients: ParsedIngredient[];
  scale: number;
  recipeId: string;
  isLoggedIn: boolean;
}) {
  if (!ingredients) return null;

  return (
    <div className="space-y-6">
      <div className="mt-6 space-y-1">
        {parsedIngredients &&
          parsedIngredients.length > 0 &&
          parsedIngredients.map(
            (ingredient: ParsedIngredient, index: number) => (
              <IngredientItem
                key={ingredient.ingredient + index}
                parsedIngredient={ingredient}
                scale={scale}
              />
            )
          )}
      </div>
      <div className="">
        {isLoggedIn && (
          <AddIngredientsToGroceryList
            id={recipeId}
            initialIngredients={parsedIngredients}
            scale={scale}
          />
        )}
      </div>
    </div>
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
  return (
    <ToggleableItem>
      <div className="grid grid-cols-[70px_1fr] lg:grid-cols-[80px_1fr] gap-2 lg:gap-4 items-start">
        <div className="text-left">
          {!!parsedIngredient?.quantity
            ? decimalToFraction((parsedIngredient?.quantity ?? 0) * scale)
            : ""}{" "}
          {humanReadableUnit({ unit: parsedIngredient?.unit })}
        </div>
        <div>
          <div>{parsedIngredient?.ingredient}</div>
          {parsedIngredient?.extra && (
            <div className="text-xs text-textColor-light dark:text-textColor-dark opacity-70">
              {parsedIngredient.extra}
            </div>
          )}
        </div>
      </div>
    </ToggleableItem>
  );
}

interface IngredientScaleProps {
  recipeId: string;
}

function IngredientScale({ recipeId }: IngredientScaleProps) {
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

  return (
    <div className="flex items-center space-x-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={decrementScale}
            disabled={currentIndex === 0}
            variant="ghost"
            size="sm"
            className={clsx(
              "rounded-full p-0 w-8 h-8",
              "bg-gray-100 dark:bg-[rgba(53,53,53,1)]",
              "hover:bg-gray-200 dark:hover:bg-[rgba(53,53,53,0.8)]"
            )}
          >
            <MinusIcon className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Decrease scale</TooltipContent>
      </Tooltip>
      <span className="text-sm font-medium w-5 text-center">
        {currentScale}x
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={incrementScale}
            disabled={currentIndex === scaleOptions.length - 1}
            variant="ghost"
            size="sm"
            className={clsx(
              "rounded-full p-0 w-8 h-8",
              "bg-gray-100 dark:bg-[rgba(53,53,53,1)]",
              "hover:bg-gray-200 dark:hover:bg-[rgba(53,53,53,0.8)]",
              "transition-colors duration-100"
            )}
          >
            <PlusIcon className="w-3 h-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Increase scale</TooltipContent>
      </Tooltip>
    </div>
  );
}

// function AddToGroceryList({ recipeId }: { recipeId: string }) {
//   // const { addToGroceryList } = useRecipeDisplayStore();

//   return (
//     <Button
//       onClick={() => {}}
//       variant="outline"
//       size="sm"
//       className="border-textColor-light dark:border-textColor-dark hover:bg-gray-100 dark:hover:bg-gray-800"
//     >
//       Add to grocery list
//     </Button>
//   );
// }
