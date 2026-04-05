import React, { useMemo } from "react";
import { View, Text, Platform, Pressable, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import clsx from "clsx";

import {
  CookingTimer,
  useCookingTimerStore,
} from "../stores/cooking-timer-store";
import { formatTimerDisplay } from "@/lib/functions/format-timer-display";
import { cn } from "@/lib/helpers/cn";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useColorScheme } from "@/hooks/useColorScheme";

const liquidGlassShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  android: { elevation: 12 },
  default: {},
});

interface ExpandedTimersPanelProps {
  timers: CookingTimer[];
  onCollapse: () => void;
}

export function ExpandedTimersPanel({
  timers,
  onCollapse,
}: ExpandedTimersPanelProps) {
  const { isIpad } = useDeviceType();
  const colorScheme = useColorScheme();
  const pauseTimer = useCookingTimerStore((s) => s.pauseTimer);
  const resumeTimer = useCookingTimerStore((s) => s.resumeTimer);
  const startTimer = useCookingTimerStore((s) => s.startTimer);
  const removeTimer = useCookingTimerStore((s) => s.removeTimer);

  const sortedTimers = useMemo(() => {
    const statusOrder: Record<CookingTimer["status"], number> = {
      running: 0,
      paused: 1,
      completed: 2,
      idle: 3,
    };
    return [...timers].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      if (a.status === "running" && b.status === "running") {
        return a.remainingSeconds - b.remainingSeconds;
      }
      return 0;
    });
  }, [timers]);

  const handleToggle = (timer: CookingTimer) => {
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

  const handleCollapse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCollapse();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      className={clsx(
        "overflow-hidden rounded-2xl",
        isIpad() ? "max-w-lg w-[460px]" : "w-[360px]"
      )}
      style={liquidGlassShadow}
    >
      <BlurView
        intensity={120}
        tint={
          colorScheme === "dark"
            ? "systemChromeMaterialDark"
            : "systemChromeMaterialLight"
        }
        className="w-full"
      >
        {/* Top specular highlight */}
        <View className="h-[0.5px] bg-white/20 dark:bg-white/10" />

        <View
          className={clsx(
            "rounded-2xl",
            "bg-white/15 dark:bg-white/[0.08]",
            "border-[0.5px] border-white/30 dark:border-white/15"
          )}
        >
          {/* Header */}
          <Pressable
            onPress={handleCollapse}
            className={clsx(
              "flex-row items-center justify-between",
              isIpad() ? "px-6 pt-6 pb-5" : "px-5 pt-5 pb-4"
            )}
          >
            <Text
              className={cn(
                "font-body-medium text-foreground-light dark:text-foreground-dark",
                isIpad() ? "text-xl" : "text-lg"
              )}
            >
              Active Timers
            </Text>
            <Text className="text-muted-light dark:text-muted-dark text-xl">
              ▾
            </Text>
          </Pressable>

          <View className="h-[0.5px] bg-white/15 dark:bg-white/10" />

          {/* Timer rows */}
          <ScrollView
            style={{ maxHeight: 260 }}
            showsVerticalScrollIndicator={false}
          >
            {sortedTimers.map((timer, index) => (
              <View
                key={timer.id}
                className={cn(
                  "flex-row items-center",
                  isIpad() ? "px-6 py-5" : "px-5 py-4",
                  index < sortedTimers.length - 1 &&
                    "border-b border-white/10 dark:border-white/5"
                )}
              >
                {/* Label + recipe name */}
                <View className="flex-1 mr-3">
                  <Text
                    className={cn(
                      "font-body-medium text-foreground-light dark:text-foreground-dark",
                      isIpad() ? "text-lg" : "text-base"
                    )}
                    numberOfLines={1}
                  >
                    {timer.label}
                  </Text>
                  <Text
                    className={cn(
                      "font-body text-muted-light dark:text-muted-dark",
                      isIpad() ? "text-base" : "text-sm"
                    )}
                    numberOfLines={1}
                  >
                    {timer.recipeName}
                  </Text>
                </View>

                {/* Countdown */}
                <Text
                  className={cn(
                    "font-body-medium mr-3",
                    isIpad() ? "text-xl" : "text-lg",
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
                    className={cn(
                      "items-center justify-center rounded-full bg-primary-light/10",
                      isIpad() ? "w-11 h-11" : "w-10 h-10"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-primary-light",
                        isIpad() ? "text-lg" : "text-base"
                      )}
                    >
                      {timer.status === "running" ? "⏸" : "▶"}
                    </Text>
                  </Pressable>
                )}

                {/* Dismiss */}
                <Pressable
                  onPress={() => handleRemove(timer.id)}
                  className={cn(
                    "items-center justify-center ml-1",
                    isIpad() ? "w-11 h-11" : "w-10 h-10"
                  )}
                >
                  <Text
                    className={cn(
                      "text-muted-light dark:text-muted-dark",
                      isIpad() ? "text-xl" : "text-lg"
                    )}
                  >
                    ✕
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </BlurView>
    </Animated.View>
  );
}
