import React from "react";
import { View, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/helpers/cn";
import { useColorScheme } from "@/hooks/useColorScheme";
import CustomButton from "@/components/custom-button";

interface FormFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function FormFooter({
  onCancel,
  onSubmit,
  isSubmitting,
  submitLabel,
}: FormFooterProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 overflow-hidden"
      style={{
        paddingBottom: Math.max(insets.bottom, 8),
      }}
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
        <View
          className={cn(
            "border-t border-border-light dark:border-border-dark",
            "p-4",
            "bg-white/15 dark:bg-white/[0.08]"
          )}
        >
          <View className="flex-row gap-4 items-center">
            <CustomButton
              variant="secondary"
              onPress={onCancel}
              title="Cancel"
              size="lg"
            />
            <CustomButton
              onPress={onSubmit}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
              containerStyles="flex-1"
              title={isSubmitting ? "Saving..." : submitLabel}
              size="lg"
            />
          </View>
        </View>
      </BlurView>
    </View>
  );
}
