"use client";

import { Recipe } from "@prisma/client";
import RecipeCard from "@/features/home-page/components/recipe-card";
import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { m } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/motion/transitions";
import { UtensilsCrossed } from "lucide-react";

export default function DisplayRecipes({
  recipes,
  isLoading,
}: {
  recipes: Recipe[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <SkeletonGrid count={8} />;
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-lg">No recipes found.</p>
      </div>
    );
  }

  return (
    <m.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {recipes.map((recipe) => (
        <m.div key={recipe.id} variants={staggerItem}>
          <RecipeCard recipe={recipe} />
        </m.div>
      ))}
    </m.div>
  );
}
