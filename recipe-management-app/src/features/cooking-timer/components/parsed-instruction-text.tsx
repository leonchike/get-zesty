"use client";

import React from "react";
import { parseTimeMentions } from "@/lib/functions/parse-time-mentions";
import { InlineTimerPill } from "./inline-timer-pill";

interface ParsedInstructionTextProps {
  text: string;
  recipeId: string;
  recipeName: string;
  stepIndex: number;
  variant: "light" | "dark";
}

export function ParsedInstructionText({
  text,
  recipeId,
  recipeName,
  stepIndex,
  variant,
}: ParsedInstructionTextProps) {
  const segments = parseTimeMentions(text);

  let matchIndex = 0;

  return (
    <span>
      {segments.map((segment, i) => {
        if (segment.type === "text") {
          return <span key={i}>{segment.value}</span>;
        }

        const currentMatchIndex = matchIndex++;
        const timerId = `${recipeId}-${stepIndex}-${currentMatchIndex}`;

        return (
          <React.Fragment key={i}>
            <span>{segment.value}</span>
            {" "}
            <InlineTimerPill
              timerId={timerId}
              recipeId={recipeId}
              recipeName={recipeName}
              stepIndex={stepIndex}
              matchIndex={currentMatchIndex}
              label={segment.value}
              totalSeconds={segment.totalSeconds}
              variant={variant}
            />
          </React.Fragment>
        );
      })}
    </span>
  );
}
