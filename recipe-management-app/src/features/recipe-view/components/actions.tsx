"use client";

import React, { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Recipe } from "@prisma/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePinnedRecipes } from "@/hooks/usePinnedRecipes";
import { useFavoriteRecipes } from "@/hooks/useFavoriteRecipes";
import { HeartIcon, PinIcon } from "@/components/ui/icons/custom-icons";
import { CookingExperienceModal } from "@/features/cooking-experience/components/cooking-experience-modal";
import type { RecipeDetailData } from "@/features/recipe-view/types";

export function EditActions({ recipe }: { recipe: Recipe }) {
  const { id } = recipe;

  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl border-border"
            asChild
          >
            <Link href={`/recipes/${id}/edit`}>Edit</Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit recipe</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function StartCookingButton({ recipeData }: { recipeData: RecipeDetailData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <>
            <Button
              variant="default"
              className="rounded-xl"
              onClick={() => setIsModalOpen(true)}
            >
              Start Cooking
            </Button>
            <CookingExperienceModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              recipeData={recipeData}
            />
          </>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open cooking view</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function FavoriteButton({ recipe }: { recipe: Recipe }) {
  const { favoriteRecipes, toggleFavorite } = useFavoriteRecipes();
  const isFavorite = favoriteRecipes.some((r) => r.id === recipe.id);

  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="rounded-xl w-10 h-10 text-muted-foreground border-border"
            variant="outline"
            onClick={() => toggleFavorite(recipe.id)}
          >
            <span>
              <HeartIcon
                className={clsx("w-5", {
                  "text-primary": isFavorite,
                })}
              />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function PinButton({ recipe }: { recipe: Recipe }) {
  const { pinnedRecipes, togglePin } = usePinnedRecipes();
  const isPinned = pinnedRecipes.some((r) => r.id === recipe.id);

  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="rounded-xl w-10 h-10 text-muted-foreground border-border"
            variant="outline"
            onClick={() => togglePin(recipe.id)}
          >
            <span>
              <PinIcon
                className={clsx("w-4", {
                  "text-primary": isPinned,
                })}
              />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isPinned ? "Unpin recipe from sidebar" : "Pin recipe to sidebar"}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
