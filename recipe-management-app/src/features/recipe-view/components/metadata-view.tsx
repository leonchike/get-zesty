"use client";

import React from "react";
import { Recipe } from "@prisma/client";
import { useRecipeDisplayStore } from "@/lib/stores/recipe-display-store";
import {
  calculateTotalTime,
  humanReadableTime,
} from "@/lib/helpers/recipe-display-helpers.ts";
import { Clock, Users, Gauge } from "lucide-react";

export function MetadataView({ recipe }: { recipe: Recipe }) {
  const { difficulty, prepTime, cookTime, restTime, servings, id } = recipe;
  const { getRecipeScale } = useRecipeDisplayStore();

  const totalTime = calculateTotalTime(prepTime, cookTime, restTime);
  const scale = getRecipeScale(id) || 1;

  const adjustedServings = servings ? Math.round(servings * scale) : null;

  const items = [
    {
      icon: Gauge,
      label: "Difficulty",
      value: getDifficultyLabel(difficulty),
      show: true,
    },
    {
      icon: Clock,
      label: "Total",
      value: totalTime ? humanReadableTime(totalTime) : null,
      show: totalTime != null && totalTime > 0,
    },
    {
      icon: Clock,
      label: "Prep",
      value: prepTime ? humanReadableTime(prepTime) : null,
      show: prepTime != null && prepTime > 0,
    },
    {
      icon: Clock,
      label: "Cook",
      value: cookTime ? humanReadableTime(cookTime) : null,
      show: cookTime != null && cookTime > 0,
    },
    {
      icon: Clock,
      label: "Rest",
      value: restTime ? humanReadableTime(restTime) : null,
      show: restTime != null && restTime > 0,
    },
    {
      icon: Users,
      label: "Servings",
      value: adjustedServings?.toString(),
      show: adjustedServings != null && adjustedServings > 0,
    },
  ].filter((item) => item.show && item.value);

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 bg-accent/10 rounded-full px-4 py-2 text-sm"
        >
          <item.icon className="w-4 h-4 text-accent" />
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    default:
      return difficulty;
  }
}

export function getDifficultyEmoji(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "Easy 👌";
    case "medium":
      return "Medium 👍";
    case "hard":
      return "Hard 💪";
    default:
      return "🤷";
  }
}
