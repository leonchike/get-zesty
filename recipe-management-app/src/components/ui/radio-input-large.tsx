"use client";

import React from "react";
import { Label } from "@/components/ui/label";

type LargeRadioInputProps = {
  label: string;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
  defaultValue: string;
  onChange: (value: string) => void;
};

export function LargeRadioInput({
  label,
  options,
  defaultValue,
  onChange,
}: LargeRadioInputProps) {
  function handleChange(value: string) {
    onChange(value);
  }

  return (
    <div>
      <Label>{label}</Label>
      <RadioGroup
        defaultValue={defaultValue}
        onValueChange={handleChange}
        className="flex space-x-4"
      >
        {options.map((option) => (
          <RadioGroupItem
            key={option.value}
            value={option.value}
            className="block w-full px-4 py-4"
          >
            <div className="flex flex-col items-start justify-center">
              <div>{option.label}</div>
              <div className="text-sm opacity-90 tracking-wide">
                {option.description}
              </div>
            </div>
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </div>
  );
}

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "rounded-md border border-input text-black ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-light data-[state=checked]:text-textColor-dark dark:data-[state=checked]:text-textColor-dark/90 dark:border- hover:opacity-90 transition-opacity dark:border-primaryHover-dark dark:text-textColor-dark",
        className
      )}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
