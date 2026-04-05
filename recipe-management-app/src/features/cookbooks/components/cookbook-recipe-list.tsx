"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useCookbookRecipes } from "../hooks/useCookbookRecipes";
import { RecipeCardText } from "@/features/home-page/components/recipe-card";
import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { m } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/motion/transitions";
import { UtensilsCrossed } from "lucide-react";

export default function CookbookRecipeList({
  cookbookId,
  search,
}: {
  cookbookId: string;
  search: string;
}) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCookbookRecipes(cookbookId, search);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isLoading) {
    return <SkeletonGrid count={8} variant="text" />;
  }

  const recipes = data?.pages?.flatMap((page) => page.recipes) ?? [];

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">
          {search ? "No recipes match your search." : "No recipes found."}
        </p>
      </div>
    );
  }

  return (
    <>
      <m.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {recipes.map((recipe) => (
          <m.div key={recipe.id} variants={staggerItem}>
            <RecipeCardText recipe={recipe} />
          </m.div>
        ))}
      </m.div>

      {hasNextPage && (
        <div ref={ref} className="h-10 flex items-center justify-center mt-6">
          {isFetchingNextPage ? (
            <p className="text-muted-foreground">Loading more...</p>
          ) : (
            <p className="text-muted-foreground">Load more</p>
          )}
        </div>
      )}
    </>
  );
}
