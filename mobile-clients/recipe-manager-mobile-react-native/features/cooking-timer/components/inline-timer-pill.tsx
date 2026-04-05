import React, { useEffect, useRef } from "react";
import { Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useCookingTimerStore } from "../stores/cooking-timer-store";
import { formatTimerDisplay } from "@/lib/functions/format-timer-display";
import { cn } from "@/lib/helpers/cn";

interface InlineTimerPillProps {
  timerId: string;
  recipeId: string;
  recipeName: string;
  stepIndex: number;
  matchIndex: number;
  label: string;
  totalSeconds: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function InlineTimerPill({
  timerId,
  recipeId,
  recipeName,
  stepIndex,
  label,
  totalSeconds,
}: InlineTimerPillProps) {
  const timer = useCookingTimerStore((s) => s.timers[timerId]);
  const startTimer = useCookingTimerStore((s) => s.startTimer);
  const pauseTimer = useCookingTimerStore((s) => s.pauseTimer);
  const resetTimer = useCookingTimerStore((s) => s.resetTimer);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = timer?.status ?? "idle";
  const remaining = timer?.remainingSeconds ?? totalSeconds;

  // Pulse animation for running state
  const scale = useSharedValue(1);

  useEffect(() => {
    if (status === "running") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [status, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Auto-reset completed timers after 3s
  useEffect(() => {
    if (status === "completed") {
      resetTimeoutRef.current = setTimeout(() => {
        resetTimer(timerId);
      }, 3000);
    }
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [status, timerId, resetTimer]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (status === "running") {
      pauseTimer(timerId);
    } else {
      startTimer({
        id: timerId,
        recipeId,
        recipeName,
        stepIndex,
        label,
        totalSeconds,
      });
    }
  };

  const icon = status === "completed" ? "✓" : status === "running" ? "⏸" : "▶";
  const display = formatTimerDisplay(
    status === "idle" ? totalSeconds : remaining
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={animatedStyle}
      className={cn(
        "rounded-full flex-row items-center px-3.5 py-2 gap-2",
        status === "running" && "bg-primary-light",
        status === "paused" && "bg-amber-500/20",
        status === "completed" && "bg-green-500/20",
        status === "idle" &&
          "bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark"
      )}
    >
      <Text
        className={cn(
          "text-sm",
          status === "running" && "text-white",
          status === "paused" && "text-amber-700 dark:text-amber-400",
          status === "completed" && "text-green-700 dark:text-green-400",
          status === "idle" &&
            "text-foreground-light dark:text-foreground-dark"
        )}
      >
        {icon}
      </Text>
      <Text
        className={cn(
          "font-body-medium text-sm",
          status === "running" && "text-white",
          status === "paused" && "text-amber-700 dark:text-amber-400",
          status === "completed" && "text-green-700 dark:text-green-400",
          status === "idle" &&
            "text-foreground-light dark:text-foreground-dark"
        )}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {display}
      </Text>
    </AnimatedPressable>
  );
}
