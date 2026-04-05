import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Keyboard,
} from "react-native";
import { cn } from "@/lib/helpers/cn";
import { useDeviceType } from "@/hooks/useDeviceType";

interface CustomTimeInputProps {
  title: string;
  value: number | null;
  onChange: (value: number) => void;
  placeholder?: string;
  containerClassName?: string;
  pressableClassName?: string;
  rounded?: "default" | "full";
}

const CustomTimeInput: React.FC<CustomTimeInputProps> = ({
  title,
  value,
  onChange,
  placeholder = "00:00",
  containerClassName,
  pressableClassName,
  rounded = "default",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isIPhone16Pro, isIpad } = useDeviceType();
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    if (value === null || isNaN(value)) {
      setTimeString("");
    } else {
      const safeValue = isNaN(value) ? 0 : value;
      const hours = Math.floor(safeValue / 60);
      const minutes = safeValue % 60;
      setTimeString(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      );
    }
  }, [value]);

  const handleTextChange = (text: string) => {
    let input = text.replace(/\D/g, "");

    if (input.length > 2) {
      input = input.slice(0, 2) + ":" + input.slice(2);
    }

    setTimeString(input);

    if (!input) {
      onChange(0);
      return;
    }

    const [hStr, mStr] = input.split(":");
    const hours = parseInt(hStr || "0", 10);
    const minutes = parseInt(mStr || "0", 10);

    if (!isNaN(hours) && !isNaN(minutes)) {
      onChange(hours * 60 + minutes);
    }
  };

  const textSize = isIpad() ? "text-xl" : isIPhone16Pro() ? "text-base" : "text-lg";

  return (
    <View className={cn("flex-col gap-1", containerClassName)}>
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

      <Pressable
        className={cn(
          "w-full",
          "bg-inputGray-light dark:bg-inputGray-dark",
          "border-2",
          rounded === "default" ? "rounded-2xl" : "rounded-full",
          "items-center flex-row",
          pressableClassName,
          isFocused
            ? "border-foreground-light dark:border-foreground-dark"
            : "border-border-light dark:border-border-dark"
        )}
      >
        <TextInput
          className={cn(
            isIpad()
              ? "p-4 pb-5 pt-4 text-xl"
              : isIPhone16Pro()
                ? "p-2 pb-3 pt-2 text-base"
                : "p-3 pb-4 pt-3 text-lg",
            "flex-1",
            "text-foreground-light dark:text-foreground-dark",
            "font-body-semibold"
          )}
          placeholder={placeholder}
          placeholderTextColor="#78716C"
          value={timeString}
          onChangeText={handleTextChange}
          keyboardType="number-pad"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            Keyboard.dismiss();
          }}
        />
      </Pressable>
    </View>
  );
};

export default CustomTimeInput;
