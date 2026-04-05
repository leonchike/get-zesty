"use client";

import React, { useState } from "react";
import { ParsedIngredient } from "@/lib/types/types";
import {
  SectionHeader,
  ToggleableItem,
} from "@/features/recipe-view/components/list-item";
import {
  humanReadableUnit,
  decimalToFraction,
} from "@/lib/helpers/recipe-display-helpers.ts";
import { AnimatePresence, m, PanInfo } from "framer-motion";
import { ParsedInstructionText } from "@/features/cooking-timer/components/parsed-instruction-text";

export function InstructionsIngredientsDisplay({
  recipeId,
  recipeName,
  ingredients,
  currentAssociatedIngredients,
  currentStep,
  totalSteps,
  showIngredients,
  scale,
  parsedInstructions,
}: {
  recipeId: string;
  recipeName: string;
  ingredients: ParsedIngredient[];
  currentAssociatedIngredients: ParsedIngredient[];
  currentStep: number;
  totalSteps: number;
  showIngredients: boolean;
  scale: number;
  parsedInstructions: string[];
}) {
  const [direction, setDirection] = useState(0);

  const renderIngredient = (ingredient: ParsedIngredient, scale: number) => (
    <>
      {ingredient?.quantity ? (
        <span>{decimalToFraction(ingredient.quantity * scale)} </span>
      ) : (
        ""
      )}
      {ingredient.unit && (
        <span> {humanReadableUnit({ unit: ingredient.unit })} </span>
      )}
      <span>{ingredient.ingredient}</span>
      {ingredient.extra && (
        <span className="text-base text-[#EDE8E2]/60">
          {" "}
          {ingredient.extra}
        </span>
      )}
    </>
  );

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row items-center max-w-4xl w-full mx-auto select-none overflow-y-auto">
      {showIngredients && (
        <div className="w-full md:w-1/2 min-w-[300px] border-b-2 md:border-b-0 md:border-r-2 p-4 pb-8 md:pb-0 border-[#EDE8E2]/10">
          <h3 className="font-heading text-lg font-medium mb-4 text-[#EDE8E2]">
            All Ingredients
          </h3>
          <ul className="space-y-1">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="text-sm text-[#EDE8E2]/80">
                <ToggleableItem>
                  <div className="grid grid-cols-[70px_1fr] lg:grid-cols-[80px_1fr] gap-2 lg:gap-4 items-start">
                    <div className="text-left">
                      {!!ingredient?.quantity
                        ? decimalToFraction((ingredient?.quantity ?? 0) * scale)
                        : ""}{" "}
                      {humanReadableUnit({ unit: ingredient?.unit })}
                    </div>
                    <div>
                      <div>{ingredient?.ingredient}</div>
                      {ingredient?.extra && (
                        <div className="text-xs text-[#EDE8E2]/50">
                          {ingredient.extra}
                        </div>
                      )}
                    </div>
                  </div>
                </ToggleableItem>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-grow p-4 pt-8 md:pt-4 md:translate-y-[-50px] w-full md:w-auto relative">
        <h1 className="font-heading text-xl font-medium mb-4 text-[#EDE8E2]">
          {recipeName}
        </h1>

        {/* Associated ingredients for current step */}
        {currentAssociatedIngredients.length > 0 && (
          <div className="mb-4 lg:mb-8 pb-4 lg:pb-8 border-b border-[#EDE8E2]/10 space-y-1">
            <SectionHeader emoji="🧺" title="Ingredients" />
            <div className="space-y-1 flex items-baseline flex-wrap text-lg text-[#EDE8E2]/90">
              {currentAssociatedIngredients.map((ingredient, index) => (
                <React.Fragment key={index}>
                  <span>{renderIngredient(ingredient, scale)}</span>
                  {index < currentAssociatedIngredients.length - 1 && (
                    <span className="mr-2">,</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Step instruction with slide animation */}
        <div className="mb-12 space-y-4 relative overflow-hidden min-h-[120px]">
          <h3 className="text-[#EDE8E2]/50 text-sm tracking-wider uppercase">
            Step {currentStep + 1} of {totalSteps}
          </h3>
          {/* Large decorative step numeral */}
          <div className="absolute right-0 top-0 font-heading text-[8rem] leading-none text-[#EDE8E2]/[0.03] select-none pointer-events-none">
            {currentStep + 1}
          </div>
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="font-sans text-3xl md:text-4xl leading-relaxed md:leading-relaxed text-[#EDE8E2]"
            >
              <ParsedInstructionText
                text={parsedInstructions[currentStep]}
                recipeId={recipeId}
                recipeName={recipeName}
                stepIndex={currentStep}
                variant="dark"
              />
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
