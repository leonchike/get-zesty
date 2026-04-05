import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { cn } from "@/lib/helpers/cn";
import { useDeviceType } from "@/hooks/useDeviceType";

interface OptionType<T> {
  label: string;
  value: T;
}

interface ComboBoxProps<T> {
  title?: string;
  value: T | null;
  onSelect: (val: T) => void;
  placeholder?: string;
  containerClassName?: string;
  pressableClassName?: string;
  rounded?: "default" | "full";
  types: OptionType<T>[];
}

const ComboBox = <T,>({
  title,
  value,
  onSelect,
  placeholder = "Select...",
  containerClassName,
  pressableClassName,
  rounded = "default",
  types,
}: ComboBoxProps<T>) => {
  const [isFocused, setIsFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const { isIPhone16Pro, isIpad } = useDeviceType();
  const { height } = useWindowDimensions();

  const [searchText, setSearchText] = useState("");
  const [filteredOptions, setFilteredOptions] =
    useState<OptionType<T>[]>(types);

  useEffect(() => {
    if (searchText.trim().length === 0) {
      setFilteredOptions(types);
    } else {
      const lower = searchText.toLowerCase();
      setFilteredOptions(
        types.filter((opt) => opt.label.toLowerCase().includes(lower))
      );
    }
  }, [searchText, types]);

  const handleOpen = () => {
    setIsFocused(true);
    setVisible(true);
  };

  const handleClose = () => {
    setIsFocused(false);
    setVisible(false);
    setSearchText("");
  };

  const handleSelect = (selected: OptionType<T>) => {
    onSelect(selected.value);
    handleClose();
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    return types.find((t) => t.value === value)?.label || placeholder;
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
            {/* Filter Input */}
            <View className="border-b border-border-light dark:border-border-dark p-2">
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Type to search..."
                placeholderTextColor="#78716C"
                className={cn(
                  "bg-inputGray-light dark:bg-inputGray-dark",
                  "text-foreground-light dark:text-foreground-dark",
                  "font-body-semibold",
                  isIpad() ? "p-4 text-xl" : isIPhone16Pro() ? "p-2 text-base" : "p-3 text-lg",
                  "rounded-md border border-border-light dark:border-border-dark"
                )}
              />
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value + ""}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  className={cn(
                    "p-4",
                    index !== filteredOptions.length - 1 &&
                      "border-b border-border-light dark:border-border-dark"
                  )}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    className={cn(
                      textSize,
                      item.value === value
                        ? "text-foreground-light dark:text-foreground-dark"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="p-4">
                  <Text className="text-gray-500 dark:text-gray-400">
                    No results found
                  </Text>
                </View>
              }
              style={{ maxHeight: height * 0.5 }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ComboBox;
