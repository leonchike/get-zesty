import React from "react";
import { View, Text, StyleProp, TextStyle } from "react-native";
import { parseTimeMentions } from "@/lib/functions/parse-time-mentions";
import { InlineTimerPill } from "./inline-timer-pill";

interface ParsedInstructionTextProps {
  text: string;
  recipeId: string;
  recipeName: string;
  stepIndex: number;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle>;
}

export function ParsedInstructionText({
  text,
  recipeId,
  recipeName,
  stepIndex,
  textClassName,
  textStyle,
}: ParsedInstructionTextProps) {
  const segments = parseTimeMentions(text);
  const timerSegments = segments
    .map((seg, i) => ({ seg, originalIndex: i }))
    .filter(({ seg }) => seg.type === "timer");

  // If no timer segments, just render plain text
  if (timerSegments.length === 0) {
    return (
      <Text className={textClassName} style={textStyle}>
        {text}
      </Text>
    );
  }

  let matchIndex = 0;

  return (
    <View>
      <Text className={textClassName} style={textStyle}>
        {segments.map((segment, i) => (
          <Text key={i}>{segment.value}</Text>
        ))}
      </Text>
      {/* Render timer pills below the text in a flex-wrap row */}
      <View className="flex-row flex-wrap mt-2 gap-2">
        {segments.map((segment, i) => {
          if (segment.type !== "timer") return null;
          const currentMatchIndex = matchIndex++;
          const timerId = `${recipeId}-${stepIndex}-${currentMatchIndex}`;

          return (
            <InlineTimerPill
              key={i}
              timerId={timerId}
              recipeId={recipeId}
              recipeName={recipeName}
              stepIndex={stepIndex}
              matchIndex={currentMatchIndex}
              label={segment.value}
              totalSeconds={segment.totalSeconds}
            />
          );
        })}
      </View>
    </View>
  );
}
