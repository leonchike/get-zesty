import { ReactNode } from "react";
import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import clsx from "clsx";
import * as Haptics from "expo-haptics";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";

interface SectionHeaderProps {
  title: string;
  /** @deprecated emoji is no longer rendered */
  emoji?: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  const { isIpad } = useDeviceType();

  return (
    <View className="gap-2">
      <Text
        className="font-body-semibold text-foreground-light dark:text-foreground-dark uppercase"
        style={{ letterSpacing: 1 }}
      >
        {title}
      </Text>
      <View
        className="rounded-full"
        style={{
          width: isIpad() ?56 : 40,
          height: isIpad() ?4 : 3,
          backgroundColor: "#F0960A",
          borderRadius: 2,
        }}
      />
    </View>
  );
}

interface ToggleableItemProps {
  children: ReactNode;
}

export function ToggleableItem({ children }: ToggleableItemProps) {
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsStrikethrough(!isStrikethrough);
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        className={clsx(
          "relative flex-row items-center py-1 -mx-4 px-4 rounded-md",
          "active:bg-gray-100 dark:active:bg-[#353535]",
          isStrikethrough && "opacity-50"
        )}
      >
        {isStrikethrough && (
          <View
            className="absolute left-0 right-0 h-px bg-foreground-light dark:bg-foreground-dark opacity-40"
            style={{
              top: "50%",
              transform: [{ translateY: -0.5 }],
            }}
          />
        )}
        {children}
      </View>
    </Pressable>
  );
}
