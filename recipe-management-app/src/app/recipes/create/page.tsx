// app/recipes/create/page.tsx

import React from "react";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import RecipeForm from "@/features/create-edit-recipe/components/recipe-form";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { H1 } from "@/components/ui/typography";
import { ParseRecipe } from "@/features/create-edit-recipe/components/parse-recipe";
import { GenerateAIRecipe } from "@/features/create-edit-recipe/components/generate-ai-recipe";

export const metadata: Metadata = {
  title: "Create New Recipe",
  description: "Create a new recipe and add it to your collection.",
};

export default async function CreateRecipePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="m-auto max-w-3xl">
      <H1>Create a new Recipe</H1>
      <div className="flex flex-wrap gap-4 border-b border-borderGray-light dark:border-borderGray-dark pb-10 mb-4">
        <ParseRecipe />
        <GenerateAIRecipe />
      </div>
      <RecipeForm />
    </div>
  );
}
