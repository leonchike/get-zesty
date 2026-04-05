"use client";

import { useMemo } from "react";
import { ParsedIngredient } from "@/lib/types/types";

/**
 * This file contains the useIngredientAssignment hook, which is responsible for
 * assigning ingredients to specific steps in a recipe's instructions.
 * It helps in organizing and displaying relevant ingredients for each step
 * during the cooking process.
 */

export interface IngredientAssignment {
  ingredient: ParsedIngredient;
  steps: number[];
}

/**
 * Custom hook for assigning ingredients to recipe steps
 * @param ingredients - Array of parsed ingredients
 * @param instructions - Array of instruction steps
 * @returns Object with ingredientAssignments and getAssociatedIngredients function
 */
export function useIngredientAssignment(
  ingredients: ParsedIngredient[],
  instructions: string[]
) {
  // Filter out ingredients that end with a colon (typically section headers)
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(
      (ingredient) => !ingredient.ingredient?.trim().endsWith(":")
    );
  }, [ingredients]);

  // Main function to assign ingredients to steps
  const assignIngredientsToSteps = useMemo(() => {
    return (
      ingredients: ParsedIngredient[],
      instructions: string[]
    ): IngredientAssignment[] => {
      const assignments: IngredientAssignment[] = ingredients.map(
        (ingredient) => ({
          ingredient,
          steps: [],
        })
      );

      // Special case: if there's only one instruction, assign all ingredients to it
      if (instructions.length === 1) {
        assignments.forEach((assignment) => assignment.steps.push(0));
        return assignments;
      }

      // Iterate through instructions and assign ingredients based on word matching
      instructions.forEach((instruction, stepIndex) => {
        const lowercaseInstruction = instruction.toLowerCase();
        assignments.forEach((assignment) => {
          const ingredientName = assignment.ingredient.ingredient ?? "";
          const ingredientWords = ingredientName
            .toLowerCase()
            .split(/\s+/);
          const isIngredientMentioned = ingredientWords.some(
            (word) => word.length > 2 && lowercaseInstruction.includes(word)
          );
          if (isIngredientMentioned) {
            assignment.steps.push(stepIndex);
          }
        });
      });

      // If no assignments were made, assign all ingredients to all steps
      if (assignments.every((assignment) => assignment.steps.length === 0)) {
        const allSteps = Array.from(
          { length: instructions.length },
          (_, i) => i
        );
        assignments.forEach((assignment) => (assignment.steps = allSteps));
      }

      return assignments;
    };
  }, []);

  // Memoized ingredient assignments
  const ingredientAssignments = useMemo(
    () => assignIngredientsToSteps(filteredIngredients, instructions),
    [filteredIngredients, instructions, assignIngredientsToSteps]
  );

  /**
   * Function to get ingredients associated with a specific step
   * @param step - The step number
   * @returns Array of ParsedIngredient associated with the given step
   */
  const getAssociatedIngredients = (step: number): ParsedIngredient[] => {
    return ingredientAssignments
      .filter((assignment) => assignment.steps.includes(step))
      .map((assignment) => assignment.ingredient);
  };

  return { ingredientAssignments, getAssociatedIngredients };
}
