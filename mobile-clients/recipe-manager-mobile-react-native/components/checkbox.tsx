import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { clsx } from "clsx";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useDeviceType } from "@/hooks/useDeviceType";

interface CheckboxProps {
  checked: boolean;
  checkedColor?: string;
  checkmarkColor?: string;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, checkedColor = "#292119", checkmarkColor = "white", className = "" }) => {
  const { isIpad } = useDeviceType();
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    const wasChecked = progress.value > 0.5;
    progress.value = withTiming(checked ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });

    // Fire haptic only on actual toggle (not initial mount matching)
    if (checked !== wasChecked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [checked]);

  const animatedCircleStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["transparent", checkedColor]
    );
    const borderWidth = progress.value > 0.5 ? 0 : 1.5;

    return {
      backgroundColor,
      borderWidth,
      transform: [{ scale: 0.85 + progress.value * 0.15 }],
    };
  });

  const animatedCheckStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [{ scale: 0.5 + progress.value * 0.5 }],
    };
  });

  return (
    <View
      className={clsx(
        "rounded-full items-center justify-center",
        isIpad() ? "w-9 h-9" : "w-8 h-8",
        className
      )}
    >
      <Animated.View
        style={animatedCircleStyle}
        className="w-full h-full rounded-full items-center justify-center border-muted-light dark:border-muted-dark"
      >
        <Animated.View style={animatedCheckStyle}>
          <Text
            style={{
              color: checkmarkColor,
              fontSize: 14,
              fontWeight: "700",
              lineHeight: 16,
            }}
          >
            ✓
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default Checkbox;
