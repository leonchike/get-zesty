import React from "react";
import { Progress } from "@/components/progress";
import { useDeviceType } from "@/hooks/useDeviceType";
import { cn } from "@/lib/helpers/cn";

interface CookingExperienceProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function CookingExperienceProgressBar({
  currentStep,
  totalSteps,
}: CookingExperienceProgressBarProps) {
  const { deviceType } = useDeviceType();

  return (
    <Progress
      value={totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0}
      className={cn(
        "w-full rounded-none bg-border-light dark:bg-border-dark",
        deviceType === "iPad" ? "h-12" : "h-10"
      )}
      indicatorColor="bg-accent-light"
    />
  );
}
