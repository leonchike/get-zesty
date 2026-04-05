"use client";

import React from "react";
import type { Recipe } from "@prisma/client";
import type { RecipeDetailData, RecipeDetailConfig } from "../types";
import RecipeImage from "./main-image";
import {
  EditActions,
  StartCookingButton,
  FavoriteButton,
  PinButton,
} from "./actions";
import { MetadataView } from "./metadata-view";
import Description from "./description";
import Ingredients from "./ingredients";
import Instructions from "./instructions";
import Equipment from "./equipment";
import Nutrition from "./nutrition";
import Notes from "./notes";
import Tags from "./tags";
import clsx from "clsx";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ROUTES from "@/lib/constants/routes";
import { splitRecipeString } from "@/lib/functions/split-recipe-string";
import {
  ToggleableItem,
  SectionHeader,
} from "@/features/recipe-view/components/list-item";
import { ParsedInstructionText } from "@/features/cooking-timer/components/parsed-instruction-text";
import AddIngredientsToGroceryList from "@/features/groceries/components/add-to-grocery-list-from-recipe";
import type { ParsedIngredient } from "@/lib/types/types";
import {
  calculateTotalTime,
  humanReadableTime,
} from "@/lib/helpers/recipe-display-helpers.ts";
import { m } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/motion/transitions";

interface ViewControlProps {
  data: RecipeDetailData;
  config: RecipeDetailConfig;
  recipe?: Recipe;
  isLoggedIn?: boolean;
}

export default function ViewControl({
  data,
  config,
  recipe,
  isLoggedIn = false,
}: ViewControlProps) {
  return (
    <m.main
      className="m-auto md:max-w-3xl lg:max-w-3xl 2xl:max-w-5xl"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Breadcrumb */}
      {config.showBreadcrumb && data.breadcrumb && (
        <m.nav
          variants={staggerItem}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap"
        >
          <Link
            href={ROUTES.COOKBOOKS}
            className="hover:text-foreground transition-colors"
          >
            Cookbooks
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href={`${ROUTES.COOKBOOKS}/${data.breadcrumb.cookbookId}`}
            className="hover:text-foreground transition-colors truncate max-w-[200px]"
          >
            {data.breadcrumb.cookbookTitle}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">
            {data.breadcrumb.recipeTitle}
          </span>
        </m.nav>
      )}

      {/* Hero image */}
      {recipe && (
        <m.div variants={staggerItem}>
          <RecipeImage recipe={recipe} />
        </m.div>
      )}

      {/* Title + Actions */}
      <m.div
        variants={staggerItem}
        className="flex justify-between md:items-center flex-col md:flex-row gap-4 my-4 md:my-6"
      >
        <div className="flex-1">
          <h1 className="font-heading text-3xl md:text-4xl font-medium break-words tracking-tight">
            {data.title}
          </h1>
          {data.attribution && (
            <p className="text-sm text-muted-foreground mt-2">
              {data.attribution}
            </p>
          )}
        </div>

        <div className="flex gap-4 flex-shrink-0">
          {config.showEditActions && isLoggedIn && recipe && (
            <EditActions recipe={recipe} />
          )}
          {config.showCookingMode && data.instructions && (
            <StartCookingButton recipeData={data} />
          )}
        </div>
      </m.div>

      {/* Tags */}
      {config.showTags && recipe && (
        <m.div variants={staggerItem}>
          <Tags recipe={recipe} />
        </m.div>
      )}

      {/* Metadata + Favorite/Pin */}
      <m.div
        variants={staggerItem}
        className="flex flex-col lg:flex-row lg:justify-between gap-4 my-4 md:my-6"
      >
        <div className="w-full lg:w-auto">
          {recipe ? (
            <MetadataView recipe={recipe} />
          ) : (
            <CookbookMetadata data={data} />
          )}
        </div>
        <div className="flex gap-2 items-center justify-start lg:justify-end">
          {config.showFavoritePin && isLoggedIn && recipe && (
            <>
              <FavoriteButton recipe={recipe} />
              <PinButton recipe={recipe} />
            </>
          )}
        </div>
      </m.div>

      {/* Description */}
      <m.div variants={staggerItem}>
        {recipe ? (
          <Description recipe={recipe} />
        ) : data.description ? (
          <p className="max-w-[30rem] text-foreground/80 leading-relaxed">
            {data.description}
          </p>
        ) : null}
      </m.div>

      {/* Content grid */}
      <m.div
        variants={staggerItem}
        className={clsx(
          "grid mt-8",
          "grid-cols-1",
          recipe
            ? "md:grid-cols-[2fr_3fr] md:grid-rows-[auto_1fr]"
            : "md:grid-cols-[2fr_3fr]"
        )}
      >
        {/* Ingredients */}
        <div
          className={clsx(
            "min-h-[16rem]",
            "border-t-2 md:border-r-2 border-border",
            "py-8 md:pr-6 lg:pr-8"
          )}
        >
          {recipe ? (
            <Ingredients recipe={recipe} isLoggedIn={isLoggedIn} />
          ) : (
            <CookbookIngredients
              ingredients={data.ingredients}
              parsedIngredients={data.parsedIngredients}
              isLoggedIn={isLoggedIn}
              showGroceryIntegration={config.showGroceryIntegration}
            />
          )}
        </div>

        {/* Instructions */}
        <div
          className={clsx(
            recipe ? "md:row-span-2" : "",
            "border-t-2 border-b-2 border-border",
            "py-8 md:pl-6 lg:pl-8"
          )}
        >
          {recipe ? (
            <Instructions recipe={recipe} />
          ) : (
            <CookbookInstructions
              instructions={data.instructions}
              recipeId={data.id}
              recipeName={data.title}
            />
          )}
        </div>

        {/* Equipment (full recipes only) */}
        {config.showEquipment && recipe && (
          <div
            className={clsx(
              "md:border-t-2 border-b-2 md:border-r-2 border-border",
              "py-8 md:pr-6 lg:pr-8"
            )}
          >
            <Equipment recipe={recipe} />
          </div>
        )}
      </m.div>

      {/* Notes + Nutrition (full recipes only) */}
      {(config.showNotes || config.showNutrition) && recipe && (
        <m.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2">
          {config.showNotes && (
            <div
              className={clsx(
                "md:border-r-2 border-border",
                "py-8 md:pr-6 lg:pr-8"
              )}
            >
              <Notes recipe={recipe} />
            </div>
          )}
          {config.showNutrition && (
            <div
              className={clsx(
                "border-t-2 md:border-t-0 border-border",
                "py-8 md:pl-6 lg:pl-8"
              )}
            >
              <Nutrition recipe={recipe} />
            </div>
          )}
        </m.div>
      )}
    </m.main>
  );
}

/* Cookbook-specific inline components */

function CookbookMetadata({ data }: { data: RecipeDetailData }) {
  const items = [
    { label: "Servings", value: data.servings?.toString() },
    {
      label: "Prep Time",
      value: data.prepTime ? humanReadableTime(data.prepTime) : null,
    },
    {
      label: "Cook Time",
      value: data.cookTime ? humanReadableTime(data.cookTime) : null,
    },
    { label: "Cuisine", value: data.cuisineType },
    { label: "Meal Type", value: data.mealType },
    { label: "Page", value: data.pageNumber?.toString() },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 text-sm bg-surface rounded-lg px-3 py-1.5 border border-border/50"
        >
          <span className="text-muted-foreground">{item.label}:</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function CookbookIngredients({
  ingredients,
  parsedIngredients,
  isLoggedIn,
  showGroceryIntegration,
}: {
  ingredients: string | null;
  parsedIngredients: ParsedIngredient[] | null;
  isLoggedIn: boolean;
  showGroceryIntegration: boolean;
}) {
  if (!ingredients) return null;

  const items = splitRecipeString(ingredients);

  return (
    <div className="space-y-4">
      <SectionHeader emoji="🥘" title="Ingredients" />
      <div className="space-y-1">
        {items.map((item, index) => (
          <ToggleableItem key={index}>
            <span className="tracking-wide leading-6">{item}</span>
          </ToggleableItem>
        ))}
      </div>
      {isLoggedIn && showGroceryIntegration && parsedIngredients && parsedIngredients.length > 0 && (
        <AddIngredientsToGroceryList
          id={null}
          initialIngredients={parsedIngredients}
          scale={1}
        />
      )}
    </div>
  );
}

function CookbookInstructions({
  instructions,
  recipeId,
  recipeName,
}: {
  instructions: string | null;
  recipeId: string;
  recipeName: string;
}) {
  if (!instructions) return null;

  const items = splitRecipeString(instructions);

  return (
    <div className="space-y-4">
      <SectionHeader emoji="🍳" title="Instructions" />
      <div className="space-y-4">
        {items.map((item, index) => (
          <ToggleableItem key={index}>
            <span className="text-base tracking-wide leading-7">
              <ParsedInstructionText
                text={item}
                recipeId={recipeId}
                recipeName={recipeName}
                stepIndex={index}
                variant="light"
              />
            </span>
          </ToggleableItem>
        ))}
      </div>
    </div>
  );
}
