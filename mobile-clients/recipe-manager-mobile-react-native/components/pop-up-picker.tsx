import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { cn } from "@/lib/helpers/cn";
import { useDeviceType } from "@/hooks/useDeviceType";

interface PopupPickerProps<T> {
  title?: string;
  options: string[];
  value: T;
  onSelect: (val: T) => void;
  containerClassName?: string;
  pressableClassName?: string;
  placeholder?: string;
  rounded?: "default" | "full";
  types: { label: string; value: T }[];
}

const PopupPicker = <T,>({
  title,
  options,
  value,
  onSelect,
  containerClassName,
  pressableClassName,
  placeholder,
  rounded = "default",
  types,
}: PopupPickerProps<T>) => {
  const [isFocused, setIsFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const { isIPhone16Pro, isIpad } = useDeviceType();
  const { height } = useWindowDimensions();

  const handleOpen = () => {
    setIsFocused(true);
    setVisible(true);
  };

  const handleClose = () => {
    setIsFocused(false);
    setVisible(false);
  };

  const handleSelect = (option: string) => {
    const selectedType = types?.find((t) => t.label === option);
    if (selectedType) {
      onSelect(selectedType.value);
    }
    handleClose();
  };

  const getDisplayValue = () => {
    if (!value) return placeholder || "Select an option";
    return types.find((t) => t.value === value)?.label || String(value);
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
        onPress={handleOpen}
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
        <Text
          className={cn(
            isIpad()
              ? "p-4 pb-5 pt-4 text-xl"
              : isIPhone16Pro()
                ? "p-2 pb-3 pt-2 text-base"
                : "p-3 pb-4 pt-3 text-lg",
            "flex-1",
            value
              ? "text-foreground-light dark:text-foreground-dark"
              : "text-gray-400",
            "font-body-semibold"
          )}
          numberOfLines={1}
        >
          {getDisplayValue()}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={handleClose}
        >
          <View
            className={cn(
              "bg-background-light dark:bg-background-dark",
              "shadow-lg shadow-black/20 dark:shadow-gray-800/50",
              "rounded-lg",
              "max-h-[50%]",
              "w-[80%]",
              "border border-border-light dark:border-border-dark"
            )}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  className={cn(
                    "p-4",
                    index !== options.length - 1 &&
                      "border-b border-border-light dark:border-border-dark"
                  )}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    className={cn(
                      textSize,
                      item === getDisplayValue()
                        ? "text-foreground-light dark:text-foreground-dark"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default PopupPicker;
