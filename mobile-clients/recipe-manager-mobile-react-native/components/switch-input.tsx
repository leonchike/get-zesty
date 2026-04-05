import { View, Text, Switch, ViewProps } from "react-native";
import React from "react";
import { useDeviceType } from "@/hooks/useDeviceType";
import { cn } from "@/lib/helpers/cn";

interface SwitchInputProps extends ViewProps {
  title?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  containerClassName?: string;
}

const SwitchInput = ({
  title,
  value,
  onChange,
  containerClassName,
  ...props
}: SwitchInputProps) => {
  const { isIPhone16Pro, isIpad } = useDeviceType();

  const textSize = isIpad() ? "text-xl" : isIPhone16Pro() ? "text-base" : "text-lg";

  return (
    <View className={cn("flex-col gap-1", containerClassName)} {...props}>
      {title && (
        <Text
          className={cn(
            textSize,
            "text-foreground-light dark:text-foreground-dark font-body-medium opacity-80"
          )}
        >
          {title}
        </Text>
      )}

      <View className={cn("w-full", "flex-row items-center justify-between")}>
        <Text
          className={cn(
            "text-foreground-light dark:text-foreground-dark font-body",
            textSize
          )}
        >
          {value ? "Public" : "Private"}
        </Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "#767577", true: "#34C759" }}
          thumbColor={value ? "#f4f3f4" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
        />
      </View>
    </View>
  );
};

export default SwitchInput;
