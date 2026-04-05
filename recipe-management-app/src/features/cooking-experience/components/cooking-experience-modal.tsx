"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/reusable-modal-v2";
import { Button } from "@/components/ui/button";
import { useCookingExperienceStore } from "@/features/cooking-experience/stores/cooking-experience-store";
import { useRecipeDisplayStore } from "@/lib/stores/recipe-display-store";
import { ParsedIngredient } from "@/lib/types/types";
import { splitRecipeString } from "@/lib/functions/split-recipe-string";
import { CookingExperienceProgressBar } from "@/features/cooking-experience/components/cooking-experience-progress-bar";
import { ProgressButtons } from "@/features/cooking-experience/components/progress-buttons";
import { InstructionsIngredientsDisplay } from "@/features/cooking-experience/components/instructions-ingredients-display";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useIngredientAssignment } from "@/features/cooking-experience/hooks/useIngredientAssignment";
import { AnimatePresence, m } from "framer-motion";
import type { RecipeDetailData } from "@/features/recipe-view/types";

interface CookingExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeData: RecipeDetailData;
}

export const CookingExperienceModal = ({
  isOpen,
  onClose,
  recipeData,
}: CookingExperienceModalProps) => {
  const { id, title, instructions, parsedIngredients: initialParsedIngredients } = recipeData;
  const {
    getCurrentStep,
    setCurrentStep,
    setTotalSteps,
    setCurrentRecipeId,
    showIngredients,
    toggleIngredients,
    totalSteps,
  } = useCookingExperienceStore();
  const { getRecipeScale } = useRecipeDisplayStore();
  const [parsedInstructions, setParsedInstructions] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<ParsedIngredient[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const currentStep = getCurrentStep(id);
  const { isSupported, isActive, request, release } = useWakeLock();

  const { getAssociatedIngredients } = useIngredientAssignment(
    ingredients,
    parsedInstructions
  );

  useEffect(() => {
    if (instructions) {
      const splitInstructions = splitRecipeString(instructions);
      setParsedInstructions(splitInstructions);
      setTotalSteps(splitInstructions.length);
      setCurrentRecipeId(id);
    }

    setIngredients(initialParsedIngredients ?? []);
  }, [id, instructions, initialParsedIngredients]);

  useEffect(() => {
    if (isOpen && isSupported) {
      request("screen");
    }
    return () => {
      if (isActive) {
        release();
      }
    };
  }, [isOpen, isSupported, isActive]);

  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(id, currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(id, currentStep - 1);
    }
  };

  const onDoneCooking = () => {
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      onClose();
      setCurrentStep(id, 0);
    }, 2000);
  };

  const currentAssociatedIngredients = getAssociatedIngredients(currentStep);
  const scale = getRecipeScale(id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="min-w-full h-full p-0 sm:rounded-none outline-none border-none"
    >
      <div className="flex flex-col h-full overflow-y-auto pb-16 bg-cooking-bg text-[#EDE8E2] bg-grain">
        <AnimatePresence mode="wait">
          {showCelebration ? (
            <m.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center gap-4"
            >
              <span className="text-6xl">🎉</span>
              <h2 className="font-heading text-4xl md:text-5xl font-medium text-[#EDE8E2]">
                Well done!
              </h2>
              <p className="text-[#EDE8E2]/70 text-lg">
                Enjoy your meal
              </p>
            </m.div>
          ) : (
            <m.div
              key="cooking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full"
            >
              <div className="flex justify-between p-4 pt-6">
                <Button
                  onClick={toggleIngredients}
                  variant="outline"
                  className="text-[#EDE8E2] bg-transparent border-[#EDE8E2]/20 hover:bg-[#EDE8E2]/10"
                >
                  {showIngredients ? "Hide Ingredients" : "Show Ingredients"}
                </Button>
              </div>

              <InstructionsIngredientsDisplay
                recipeId={id}
                recipeName={title}
                ingredients={ingredients}
                currentAssociatedIngredients={currentAssociatedIngredients}
                currentStep={currentStep}
                totalSteps={totalSteps}
                showIngredients={showIngredients}
                scale={scale}
                parsedInstructions={parsedInstructions}
              />

              <footer className="fixed bottom-0 left-0 right-0 w-full bg-cooking-bg/95 backdrop-blur-sm">
                <div className="p-4">
                  <ProgressButtons
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    goToPreviousStep={goToPreviousStep}
                    goToNextStep={goToNextStep}
                    onClose={onClose}
                    onDoneCooking={onDoneCooking}
                  />
                </div>
                <div>
                  <CookingExperienceProgressBar
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                  />
                </div>
              </footer>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
