import * as React from "react";
import { View, Text } from "react-native";
import clsx from "clsx";

const variantStyles = {
  default: {
    container: "bg-primary border-transparent",
    text: "text-primary-foreground",
  },
  secondary: {
    container: "bg-secondary border-transparent",
    text: "text-secondary-foreground",
  },
  destructive: {
    container: "bg-destructive border-transparent",
    text: "text-destructive-foreground",
  },
  outline: {
    container: "border-primary-dark/50 dark:border-primary-light/50",
    text: "text-primary-dark dark:text-primary-light",
  },
  // Translucent glass chip (no per-badge blur — BlurViews are capped per screen)
  glass: {
    container:
      "bg-white/60 dark:bg-white/10 border-white/40 dark:border-white/15",
    text: "text-foreground-light dark:text-foreground-dark",
  },
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: keyof typeof variantStyles;
  className?: string;
};

function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <View
      className={clsx(
        "flex-row items-center rounded-full border px-2.5 py-0.5",
        variantStyles[variant].container,
        className
      )}
    >
      <Text
        className={clsx("text-sm font-medium", variantStyles[variant].text)}
      >
        {children}
      </Text>
    </View>
  );
}

export { Badge, variantStyles };
