"use client";

import React, { ReactNode } from "react";
import clsx from "clsx";

interface ToggleableItemProps {
  children: ReactNode;
}

export function ToggleableItem({ children }: ToggleableItemProps) {
  const [isStrikethrough, setIsStrikethrough] = React.useState(false);

  const toggleStrikethrough = () => {
    setIsStrikethrough(!isStrikethrough);
  };

  return (
    <div
      className={clsx(
        "flex cursor-pointer text-sm py-1 -mx-4 px-4 rounded-md hover:bg-primary/5 transition-colors",
        {
          "line-through text-muted-foreground": isStrikethrough,
        }
      )}
      onClick={toggleStrikethrough}
    >
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  emoji: string;
  title: string;
}

export function SectionHeader({ emoji, title }: SectionHeaderProps) {
  return (
    <h2 className="font-heading font-medium flex items-center space-x-2 select-none">
      <span className="text-2xl">{emoji}</span>
      <span className="text-lg relative">
        {title}
        <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-accent rounded-full" />
      </span>
    </h2>
  );
}
