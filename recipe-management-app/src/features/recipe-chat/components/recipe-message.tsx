"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { saveRecipeFromChat } from "../actions/recipe-chat-actions";
import { useRouter } from "next/navigation";
import { formatRecipeForDisplay } from "../lib/recipe-formatter";
import { toast } from "sonner";
import { ChatMessage, useRecipeChatStore } from "../stores/recipe-chat-store";
import { Loader2 } from "lucide-react";

interface RecipeMessageProps {
  message: ChatMessage;
}

export function RecipeMessage({ message }: RecipeMessageProps) {
  const router = useRouter();
  const { setIsOpen, currentRecipe } = useRecipeChatStore();
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // Check if this is the latest version of the recipe
  const isLatestVersion =
    message.recipeData?.title === currentRecipe?.title &&
    message.recipeData?.instructions === currentRecipe?.instructions;

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!message.recipeData) throw new Error("No recipe data");
      return saveRecipeFromChat(message.recipeData);
    },
    onSuccess: (recipe) => {
      setHasBeenSaved(true);
      toast.success(
        "Recipe saved! Generating image... could take a few minutes"
      );
      setTimeout(() => {
        setIsOpen(false);
        router.push(`/recipes/${recipe.id}`);
      }, 1500);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Failed to save recipe. Please try again.");
    },
  });

  if (!message.recipeData) return null;

  return (
    <div className="bg-brandGreen-light/10 dark:bg-brandGreen-dark/10 border border-brandGreen-light/30 dark:border-brandGreen-dark/30 rounded-lg p-6 max-w-2xl">
      <div className="prose dark:prose-invert prose-sm max-w-none text-textColor-light dark:text-textColor-dark">
        {formatRecipeForDisplay(message.recipeData)}
      </div>
      {isLatestVersion && (
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || hasBeenSaved}
          className="mt-4"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : hasBeenSaved ? (
            "Saved ✓"
          ) : (
            "Save Recipe"
          )}
        </Button>
      )}
    </div>
  );
}
