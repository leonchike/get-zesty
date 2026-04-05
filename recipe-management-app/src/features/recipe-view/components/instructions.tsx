import React from "react";
import { Recipe } from "@prisma/client";
import { splitRecipeString } from "@/lib/functions/split-recipe-string";
import {
  ToggleableItem,
  SectionHeader,
} from "@/features/recipe-view/components/list-item";
import { ParsedInstructionText } from "@/features/cooking-timer/components/parsed-instruction-text";

export default function Instructions({ recipe }: { recipe: Recipe }) {
  const { instructions } = recipe;

  return (
    <div className="space-y-4">
      <SectionHeader emoji="🍳" title="Instructions" />
      <DisplayInstructions recipe={recipe} instructions={instructions} />
    </div>
  );
}

function DisplayInstructions({
  recipe,
  instructions,
}: {
  recipe: Recipe;
  instructions: string | null;
}) {
  if (!instructions) return null;

  const instructionsArray = splitRecipeString(instructions) as string[];

  return (
    <div className="space-y-4">
      {instructionsArray.map((instruction, index) => (
        <ToggleableItem key={index}>
          <span className="text-base tracking-wide leading-7">
            <ParsedInstructionText
              text={instruction}
              recipeId={recipe.id}
              recipeName={recipe.title}
              stepIndex={index}
              variant="light"
            />
          </span>
        </ToggleableItem>
      ))}
    </div>
  );
}
