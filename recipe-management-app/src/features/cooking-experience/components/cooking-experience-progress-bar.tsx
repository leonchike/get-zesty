import { Progress } from "@/components/ui/progress";

export function CookingExperienceProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="relative">
      <Progress
        value={progress}
        className="w-full rounded-none bg-[#EDE8E2]/10 h-1.5"
        indicatorColor="bg-gradient-to-r from-primary to-success"
      />
      {/* Glow effect */}
      <div
        className="absolute top-0 h-1.5 rounded-r-full blur-sm opacity-50 bg-gradient-to-r from-primary to-success"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
