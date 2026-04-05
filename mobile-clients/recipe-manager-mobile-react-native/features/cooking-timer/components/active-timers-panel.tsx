import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useCookingTimerStore } from "../stores/cooking-timer-store";
import { formatTimerDisplay } from "@/lib/functions/format-timer-display";
import { cn } from "@/lib/helpers/cn";

export function ActiveTimersPanel() {
  const timers = useCookingTimerStore((s) => s.timers);
  const pauseTimer = useCookingTimerStore((s) => s.pauseTimer);
  const resumeTimer = useCookingTimerStore((s) => s.resumeTimer);
  const startTimer = useCookingTimerStore((s) => s.startTimer);
  const removeTimer = useCookingTimerStore((s) => s.removeTimer);

  const activeTimers = useMemo(
    () =>
      Object.values(timers).filter(
        (t) =>
          t.status === "running" ||
          t.status === "paused" ||
          t.status === "completed"
      ),
    [timers]
  );

  if (activeTimers.length === 0) return null;

  const handleToggle = (timer: (typeof activeTimers)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timer.status === "running") {
      pauseTimer(timer.id);
    } else if (timer.status === "paused") {
      resumeTimer(timer.id);
    } else {
      startTimer(timer);
    }
  };

  const handleRemove = (timerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeTimer(timerId);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="mx-4 mb-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {activeTimers.map((timer, index) => (
        <View
          key={timer.id}
          className={cn(
            "flex-row items-center px-4 py-4",
            index < activeTimers.length - 1 &&
              "border-b border-border-light dark:border-border-dark"
          )}
        >
          {/* Label */}
          <View className="flex-1 mr-3">
            <Text
              className="font-body-medium text-base text-foreground-light dark:text-foreground-dark"
              numberOfLines={1}
            >
              {timer.label}
            </Text>
            <Text
              className="font-body text-sm text-muted-light dark:text-muted-dark"
              numberOfLines={1}
            >
              {timer.recipeName}
            </Text>
          </View>

          {/* Countdown */}
          <Text
            className={cn(
              "font-body-medium text-lg mr-3",
              timer.status === "running" && "text-primary-light",
              timer.status === "paused" &&
                "text-amber-700 dark:text-amber-400",
              timer.status === "completed" &&
                "text-green-700 dark:text-green-400"
            )}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {timer.status === "completed"
              ? "Done!"
              : formatTimerDisplay(timer.remainingSeconds)}
          </Text>

          {/* Play/Pause */}
          {timer.status !== "completed" && (
            <Pressable
              onPress={() => handleToggle(timer)}
              className="w-10 h-10 items-center justify-center rounded-full bg-primary-light/10"
            >
              <Text className="text-primary-light text-base">
                {timer.status === "running" ? "⏸" : "▶"}
              </Text>
            </Pressable>
          )}

          {/* Dismiss */}
          <Pressable
            onPress={() => handleRemove(timer.id)}
            className="w-10 h-10 items-center justify-center ml-1"
          >
            <Text className="text-muted-light dark:text-muted-dark text-lg">
              ✕
            </Text>
          </Pressable>
        </View>
      ))}
    </Animated.View>
  );
}
