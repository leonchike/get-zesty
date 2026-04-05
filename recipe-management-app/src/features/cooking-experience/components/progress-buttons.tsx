"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  LeftArrowIcon,
  RightArrowIcon,
} from "@/components/ui/icons/custom-icons";

export function ProgressButtons({
  currentStep,
  totalSteps,
  goToPreviousStep,
  goToNextStep,
  onClose,
  onDoneCooking,
}: {
  currentStep: number;
  totalSteps: number;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
  onClose: () => void;
  onDoneCooking: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goToPreviousStep();
      } else if (event.key === "ArrowRight") {
        goToNextStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToPreviousStep, goToNextStep]);

  return (
    <div className="flex justify-between">
      <Button
        onClick={goToPreviousStep}
        disabled={currentStep === 0}
        className="text-[#EDE8E2] bg-[#EDE8E2]/10 hover:bg-[#EDE8E2]/20 border border-[#EDE8E2]/20 min-w-[48px] min-h-[48px] disabled:opacity-30"
      >
        <LeftArrowIcon className="w-5" />{" "}
        <span className="ml-2 hidden md:block">Previous</span>
      </Button>
      {currentStep === totalSteps - 1 ? (
        <Button
          onClick={onDoneCooking}
          className="bg-success hover:bg-success/90 min-h-[48px] px-6"
        >
          <span className="mr-2 text-white font-medium">Done Cooking!</span>
        </Button>
      ) : (
        <Button
          onClick={goToNextStep}
          className="text-[#EDE8E2] bg-[#EDE8E2]/10 hover:bg-[#EDE8E2]/20 border border-[#EDE8E2]/20 min-w-[48px] min-h-[48px]"
        >
          <span className="mr-2 hidden md:block">Next</span>
          <RightArrowIcon className="w-5" />
        </Button>
      )}
    </div>
  );
}
