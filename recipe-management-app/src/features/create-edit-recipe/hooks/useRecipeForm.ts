// src/hooks/useRecipeForm.ts

"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Recipe, RecipeDifficulty, RecipeSource } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/features/create-edit-recipe/stores/recipe-form-store";

const recipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  difficulty: z.nativeEnum(RecipeDifficulty),
  prepTime: z.number().min(0).optional().nullable(),
  cookTime: z.number().min(0).optional().nullable(),
  servings: z.number().min(1).optional().nullable(),
  ingredients: z.string().optional(),
  instructions: z.string().optional(),
  isPublic: z.boolean(),
  imageUrl: z.string().optional(),
  nutrition: z.any().optional().nullable(),
  restTime: z.number().min(0).optional().nullable(),
  totalTime: z.number().min(0).optional().nullable(),
  equipment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  cuisineType: z.string().optional(),
  mealType: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().optional(),
  rating: z.number().min(0).max(5).optional().nullable(),
  isDeleted: z.boolean().optional(),
  reviewCount: z.number().min(0).optional().nullable(),
  favoriteCount: z.number().min(0).optional().nullable(),
  seasonality: z.string().optional(),
  source: z.nativeEnum(RecipeSource).optional(),
});

export type RecipeFormInputs = z.infer<typeof recipeSchema>;

export const useRecipeForm = (recipe?: Recipe) => {
  const {
    setRecipe,
    updateField,
    submitRecipe,
    reset,
    scrapedRecipe,
    aiGeneratedRecipe,
  } = useRecipeStore();

  const router = useRouter();

  const form = useForm<RecipeFormInputs>({
    resolver: zodResolver(recipeSchema),
    defaultValues: recipe
      ? {
          title: recipe.title,
          description: recipe.description ?? undefined,
          difficulty: recipe.difficulty,
          prepTime: recipe.prepTime ?? undefined,
          cookTime: recipe.cookTime ?? undefined,
          servings: recipe.servings ?? undefined,
          ingredients: recipe.ingredients ?? undefined,
          instructions: recipe.instructions ?? undefined,
          isPublic: recipe.isPublic,
          imageUrl: recipe.imageUrl ?? undefined,
          nutrition: recipe.nutrition ?? null,
          restTime: recipe.restTime ?? null,
          totalTime: recipe.totalTime ?? null,
          equipment: recipe.equipment ?? null,
          notes: recipe.notes ?? null,
          cuisineType: recipe.cuisineType ?? undefined,
          mealType: recipe.mealType ?? undefined,
          dietaryRestrictions: recipe.dietaryRestrictions ?? [],
          tags: recipe.tags ?? [],
          sourceUrl: recipe.sourceUrl ?? undefined,
          rating: recipe.rating ?? undefined,
          isDeleted: recipe.isDeleted ?? false,
          reviewCount: recipe.reviewCount ?? 0,
          favoriteCount: recipe.favoriteCount ?? 0,
          seasonality: recipe.seasonality ?? undefined,
          source: recipe.source ?? undefined,
        }
      : {
          title: "",
          description: undefined,
          difficulty: RecipeDifficulty.EASY,
          prepTime: undefined,
          cookTime: undefined,
          servings: 4,
          ingredients: "",
          instructions: "",
          isPublic: false,
          imageUrl: undefined,
          nutrition: null,
          restTime: null,
          totalTime: null,
          equipment: null,
          notes: null,
          cuisineType: undefined,
          mealType: undefined,
          dietaryRestrictions: [],
          tags: [],
          sourceUrl: undefined,
          rating: undefined,
          isDeleted: false,
          reviewCount: 0,
          favoriteCount: 0,
          seasonality: undefined,
          source: RecipeSource.USER,
        },
  });

  // Effect to update form when scrapedRecipe changes
  useEffect(() => {
    if (scrapedRecipe) {
      console.log("Scraped Recipe:", scrapedRecipe); // Debugging
      Object.entries(scrapedRecipe).forEach(([key, value]) => {
        form.setValue(key as keyof RecipeFormInputs, value);
      });
      console.log("Form State after setting values:", form.getValues()); // Debugging
      console.log("Form Errors:", form.formState.errors); // Debugging
    }
  }, [scrapedRecipe, form]);

  // Effect to update form when aiGeneratedRecipe changes
  useEffect(() => {
    if (aiGeneratedRecipe) {
      console.log("AI Generated Recipe:", aiGeneratedRecipe); // Debugging
      Object.entries(aiGeneratedRecipe).forEach(([key, value]) => {
        form.setValue(key as keyof RecipeFormInputs, value);
      });
      console.log("Form State after setting values:", form.getValues()); // Debugging
      console.log("Form Errors:", form.formState.errors); // Debugging
    }
  }, [aiGeneratedRecipe, form]);

  const onSubmit: SubmitHandler<RecipeFormInputs> = async (data) => {
    try {
      const formattedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value ?? null])
      ) as Omit<Recipe, "id" | "userId" | "createdAt" | "updatedAt">;

      setRecipe(formattedData);
      const recipeId = await submitRecipe();
      if (recipeId) {
        router.push(`/recipes/${recipeId}`);
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      // Handle error (e.g., show error message to user)
    }
  };

  // Ensure handleSubmit is used correctly
  return {
    form,
    // onSubmit: form.handleSubmit(onSubmit),
    onSubmit,
    updateField,
    reset,
  };
};
