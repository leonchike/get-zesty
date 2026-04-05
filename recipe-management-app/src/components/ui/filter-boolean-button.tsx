// src/components/ui/filter-boolean-button.tsx

"use client";

import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomIconProps } from "@/components/ui/icons/custom-icons";

export function FilterBooleanButton({
  emoji,
  label,
  value,
  onChange,
}: {
  emoji: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onChange(!value);
    setTimeout(() => setIsAnimating(false), 200); // Match this with the CSS transition duration
  };

  return (
    <div className="relative inline-block">
      <Button
        onClick={handleClick}
        variant="outline"
        className={clsx(
          "flex items-center gap-2 bg-transparent rounded-full h-12 hover:bg-transparent hover:dark:bg-transparent hover:text-inherit transition-all duration-200",
          "border border-transparent",
          isAnimating ? "scale-105" : "scale-100"
        )}
      >
        <div className="flex items-center gap-2">
          {emoji && <span className="text-xl">{emoji}</span>}
          <span className="text-sm">{label}</span>
        </div>
      </Button>
      <div
        className={clsx(
          "absolute inset-0 rounded-full pointer-events-none transition-all duration-200",
          "border ",
          value
            ? "border-2 border-brand-light"
            : "border-textColor-dark hover:border-textColor-light/50"
        )}
      />
    </div>
  );
}

interface StyledFilterCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
  emoji?: string;
}

export function StyledFilterCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
  emoji,
}: StyledFilterCheckboxProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onCheckedChange();
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <div className="relative inline-block">
      <div
        onClick={handleClick}
        className={clsx(
          "flex items-center gap-2 bg-transparent rounded-full h-12 px-4 cursor-pointer transition-all duration-200",
          isAnimating ? "scale-105" : "scale-100"
        )}
      >
        <Checkbox
          id={id}
          checked={checked}
          // onCheckedChange={onCheckedChange}
          className="opacity-0 absolute"
        />
        <div className="flex items-center gap-2">
          {emoji && <span className="text-xl">{emoji}</span>}
          <span className="text-sm">{label}</span>
        </div>
      </div>
      <div
        className={clsx(
          "absolute inset-0 rounded-full pointer-events-none transition-all duration-200",
          "border ",
          checked
            ? "border-2 border-brand-light"
            : "border-textColor-dark hover:border-textColor-light/50"
        )}
      />
    </div>
  );
}
