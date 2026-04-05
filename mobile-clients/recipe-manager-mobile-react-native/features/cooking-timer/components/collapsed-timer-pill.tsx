import React from "react";
import { View, Text, Platform, Pressable } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import clsx from "clsx";

import { CookingTimer } from "../stores/cooking-timer-store";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CollapsedTimerPillProps {
  nearestTimer: CookingTimer;
  additionalCount: number;
  onPress: () => void;
}

function StatusDot({ status }: { status: CookingTimer["status"] }) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (status === "running") {
      scale.value = withRepeat(
        withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [status, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: status === "running" ? 0.6 + 0.4 / scale.value : 1,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        "w-3 h-3 rounded-full",
        status === "running" && "bg-primary-light",
        status === "paused" && "bg-amber-500",
        status === "completed" && "bg-green-500"
      )}
    />
  );
}

export function CollapsedTimerPill({
  nearestTimer,
  additionalCount,
  onPress,
}: CollapsedTimerPillProps) {
  const { isIpad } = useDeviceType();
  const colorScheme = useColorScheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      onPress={handlePress}
      className={clsx(
        "overflow-hidden rounded-full",
        isIpad() ? "max-w-lg" : "max-w-[280px]"
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
            "flex-row items-center justify-center rounded-full gap-3",
            "bg-white/15 dark:bg-white/[0.08]",
            "border-[0.5px] border-white/30 dark:border-white/15",
            isIpad() ? "px-8 py-4.5" : "px-6 py-3.5"
          )}
        >
          <StatusDot status={nearestTimer.status} />

          <Text
            className={cn(
              "font-body-medium",
              isIpad() ? "text-xl" : "text-lg",
              nearestTimer.status === "running" && "text-primary-light",
              nearestTimer.status === "paused" &&
                "text-amber-700 dark:text-amber-400",
              nearestTimer.status === "completed" &&
                "text-green-700 dark:text-green-400"
            )}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {nearestTimer.status === "completed"
              ? "Done!"
              : formatTimerDisplay(nearestTimer.remainingSeconds)}
          </Text>

          {additionalCount > 0 && (
            <View className="bg-white/20 dark:bg-white/15 rounded-full px-2.5 py-1">
              <Text
                className={cn(
                  "font-body-medium text-foreground-light dark:text-foreground-dark",
                  isIpad() ? "text-lg" : "text-base"
                )}
              >
                +{additionalCount}
              </Text>
            </View>
          )}
        </View>
      </BlurView>
    </AnimatedPressable>
  );
}
