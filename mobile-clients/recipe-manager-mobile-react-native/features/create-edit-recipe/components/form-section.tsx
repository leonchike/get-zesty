import React from "react";
import { View, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { cn } from "@/lib/helpers/cn";
import { warmShadow } from "@/lib/helpers/warm-shadows";
import { useDeviceType } from "@/hooks/useDeviceType";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  index?: number;
}

export function FormSection({ title, children, index = 0 }: FormSectionProps) {
  const { isIpad } = useDeviceType();

  return (
    <Animated.View
      entering={FadeIn.delay(index * 60).duration(300)}
      className={cn(
        "bg-surface-light dark:bg-surface-dark rounded-2xl",
        "border border-border-light dark:border-border-dark",
        "p-5"
      )}
      style={warmShadow("sm")}
    >
      {/* Section Header with gold accent bar */}
      <View className="gap-2 mb-5">
        <Text
          className="font-body-semibold text-foreground-light dark:text-foreground-dark uppercase"
          style={{ letterSpacing: 1 }}
        >
          {title}
        </Text>
        <View
          className="rounded-full"
          style={{
            width: isIpad() ? 56 : 40,
            height: isIpad() ? 4 : 3,
            backgroundColor: "#F0960A",
            borderRadius: 2,
          }}
        />
      </View>

      {/* Section Content */}
      <View className="gap-5">{children}</View>
    </Animated.View>
  );
}
