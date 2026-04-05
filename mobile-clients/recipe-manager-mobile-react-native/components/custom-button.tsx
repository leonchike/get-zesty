import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import React from "react";
import { cn } from "@/lib/helpers/cn";

type CustomButtonProps = {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  handlePress?: () => void;
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  containerStyles?: string;
  textStyles?: string;
};

const variantStyles = {
  primary: {
    bg: "bg-[#FF385C] border border-[#FF385C]",
    text: "text-white",
  },
  secondary: {
    bg: "bg-foreground-light dark:bg-foreground-dark border border-foreground-light dark:border-foreground-dark",
    text: "text-foreground-dark dark:text-foreground-light",
  },
  tertiary: {
    bg: "bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark",
    text: "text-foreground-light dark:text-foreground-dark",
  },
  ghost: {
    bg: "bg-transparent border border-border-light dark:border-border-dark",
    text: "text-foreground-light dark:text-foreground-dark",
  },
  danger: {
    bg: "bg-red-500 border border-red-500",
    text: "text-white",
  },
  accent: {
    bg: "bg-[#F0960A] border border-[#F0960A]",
    text: "text-white",
  },
};

const sizeStyles = {
  sm: { container: "py-2 px-3", text: "text-sm" },
  md: { container: "py-3 px-4", text: "text-base" },
  lg: { container: "py-3.5 px-6", text: "text-lg" },
};

const CustomButton = ({
  title,
  children,
  onPress,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
  isDisabled,
  variant = "primary",
  size = "md",
  leftIcon,
}: CustomButtonProps) => {
  const pressHandler = onPress || handlePress;
  const sizeStyle = sizeStyles[size];

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-row items-center justify-center gap-2">
          <ActivityIndicator
            color={variant === "secondary" ? "#292119" : "#fff"}
            size="small"
          />
          <Text
            className={cn(
              variantStyles[variant].text,
              "font-body-semibold",
              sizeStyle.text,
              textStyles
            )}
          >
            Loading...
          </Text>
        </View>
      );
    }

    if (children) {
      if (typeof children === "string") {
        return (
          <Text
            className={cn(
              variantStyles[variant].text,
              "font-body-semibold",
              sizeStyle.text,
              textStyles
            )}
          >
            {children}
          </Text>
        );
      }
      return children;
    }

    if (title) {
      return (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          <Text
            className={cn(
              variantStyles[variant].text,
              "font-body-semibold",
              sizeStyle.text,
              textStyles
            )}
          >
            {title}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      onPress={pressHandler}
      activeOpacity={0.7}
      disabled={isLoading || isDisabled}
      className={cn(
        variantStyles[variant].bg,
        "rounded-xl justify-center items-center",
        sizeStyle.container,
        containerStyles,
        {
          "opacity-50": isLoading || isDisabled,
          "opacity-100": !isLoading && !isDisabled,
        }
      )}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default CustomButton;
