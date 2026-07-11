import React from "react";
import { View, Text } from "react-native";
import clsx from "clsx";

interface MemberAvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md";
  className?: string;
}

export const MemberAvatar = ({
  name,
  color,
  size = "sm",
  className,
}: MemberAvatarProps) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <View
      className={clsx(
        "items-center justify-center rounded-full",
        size === "sm" ? "w-6 h-6" : "w-8 h-8",
        className
      )}
      style={{ backgroundColor: color }}
    >
      <Text
        className={clsx(
          "font-body-semibold text-white",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {initial}
      </Text>
    </View>
  );
};
