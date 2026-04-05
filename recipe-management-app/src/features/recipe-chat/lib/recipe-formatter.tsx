import { Recipe } from "@prisma/client";
import React from "react";

export function formatRecipeForDisplay(recipe: Recipe): React.ReactNode {
  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-2">{recipe.title}</h2>
      
      {recipe.description && (
        <p className="text-muted-foreground mb-4">{recipe.description}</p>
      )}
      
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        {recipe.difficulty && (
          <div>
            <span className="font-medium">Difficulty:</span> {recipe.difficulty}
          </div>
        )}
        {recipe.servings && (
          <div>
            <span className="font-medium">Servings:</span> {recipe.servings}
          </div>
        )}
        {recipe.prepTime && (
          <div>
            <span className="font-medium">Prep:</span> {formatTime(recipe.prepTime)}
          </div>
        )}
        {recipe.cookTime && (
          <div>
            <span className="font-medium">Cook:</span> {formatTime(recipe.cookTime)}
          </div>
        )}
        {recipe.totalTime && (
          <div>
            <span className="font-medium">Total:</span> {formatTime(recipe.totalTime)}
          </div>
        )}
      </div>
      
      {recipe.cuisineType && (
        <div className="mb-2">
          <span className="font-medium">Cuisine:</span> {recipe.cuisineType}
        </div>
      )}
      
      {recipe.mealType && (
        <div className="mb-4">
          <span className="font-medium">Meal Type:</span> {recipe.mealType}
        </div>
      )}
      
      {recipe.ingredients && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Ingredients</h3>
          <div className="whitespace-pre-line">{recipe.ingredients}</div>
        </div>
      )}
      
      {recipe.instructions && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <div className="whitespace-pre-line">{recipe.instructions}</div>
        </div>
      )}
      
      {recipe.equipment && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Equipment</h3>
          <div className="whitespace-pre-line">{recipe.equipment}</div>
        </div>
      )}
      
      {recipe.notes && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Notes</h3>
          <div className="whitespace-pre-line">{recipe.notes}</div>
        </div>
      )}
      
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-secondary text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  );
}