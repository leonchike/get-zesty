"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@prisma/client";
import {
  humanReadableTime,
  calculateTotalTime,
} from "@/lib/helpers/recipe-display-helpers.ts";
import ROUTES from "@/lib/constants/routes";
import { ImagePlaceholderIcon } from "@/components/ui/icons/custom-icons";
import { formatImageUrl } from "@/lib/image-upload/cloudflare-images";
import { m } from "framer-motion";
import { cardHover } from "@/components/motion/transitions";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { prepTime, cookTime, restTime, imageUrl, title, description, id } =
    recipe;

  const totalTime = calculateTotalTime(prepTime, cookTime, restTime);
  const formattedImageUrl = formatImageUrl(imageUrl);

  return (
    <m.div variants={cardHover} initial="rest" whileHover="hover">
      <Link href={`${ROUTES.RECIPES}/${id}`}>
        <article className="overflow-hidden rounded-xl bg-surface border border-border/50 shadow-warm-sm hover:shadow-warm-md transition-shadow duration-200">
          <div className="relative h-48 2xl:h-64 overflow-hidden">
            {formattedImageUrl ? (
              <Image
                src={formattedImageUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="w-1/3 h-auto opacity-40">
                  <ImagePlaceholderIcon className="w-full h-full" />
                </div>
              </div>
            )}
            {totalTime && (
              <span className="absolute top-2 left-2 bg-accent/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-white">
                {humanReadableTime(totalTime)}
              </span>
            )}
          </div>
          <div className="p-3 space-y-1">
            <h2 className="font-heading font-medium text-base truncate">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground text-xs truncate">
                {description}
              </p>
            )}
          </div>
        </article>
      </Link>
    </m.div>
  );
}

/* Text variant for cookbook recipes */
interface CookbookRecipeCardData {
  id: string;
  title: string;
  description: string | null;
  pageNumber: number | null;
  cuisineType: string | null;
  mealType: string | null;
  cookbookId: string;
}

export function RecipeCardText({ recipe }: { recipe: CookbookRecipeCardData }) {
  const { id, title, description, pageNumber, cuisineType, mealType, cookbookId } =
    recipe;

  const tags = [cuisineType, mealType].filter(Boolean);

  return (
    <m.div variants={cardHover} initial="rest" whileHover="hover">
      <Link href={`${ROUTES.COOKBOOKS}/${cookbookId}/recipes/${id}`}>
        <article className="rounded-xl bg-surface border border-border/50 p-4 h-full shadow-warm-sm hover:shadow-warm-md transition-shadow duration-200">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-medium text-base truncate flex-1">
              {title}
            </h3>
            {pageNumber && (
              <span className="flex-shrink-0 text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                p. {pageNumber}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
              {description}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-accent/10 rounded-full px-2 py-0.5 text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </Link>
    </m.div>
  );
}
