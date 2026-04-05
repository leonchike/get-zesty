import React from "react";
import { Recipe } from "@prisma/client";
import { SectionHeader } from "@/features/recipe-view/components/list-item";
import EmptyRecipeSectionState from "@/features/recipe-view/components/empty-state";

export default function Nutrition({ recipe }: { recipe: Recipe }) {
  const { nutrition } = recipe;

  return (
    <div className="space-y-4">
      <SectionHeader emoji="🥗" title="Nutrition" />
      <DisplayNutrition nutrition={nutrition} />
    </div>
  );
}

function DisplayNutrition({ nutrition }: { nutrition: Recipe["nutrition"] }) {
  if (!nutrition) {
    return (
      <EmptyRecipeSectionState message="Nutrition information not available" />
    );
  }

  if (typeof nutrition === "object" && nutrition !== null) {
    const { calories, carbs, fat, protein } = nutrition as {
      calories?: number;
      carbs?: number;
      fat?: number;
      protein?: number;
    };

    return (
      <div>
        <p>Calories: {calories || "N/A"}</p>
        <p>Carbs: {carbs || "N/A"}</p>
        <p>Fat: {fat || "N/A"}</p>
        <p>Protein: {protein || "N/A"}</p>
      </div>
    );
  }

  return (
    <EmptyRecipeSectionState message="Nutrition information not available" />
  );
}
