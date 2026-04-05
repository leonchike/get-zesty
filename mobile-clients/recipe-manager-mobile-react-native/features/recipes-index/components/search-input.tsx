import React, { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { useDeviceType } from "@/hooks/useDeviceType";
import { cn } from "@/lib/helpers/cn";

// icons
import { CloseIcon, SearchIcon } from "@/components/custom-icons";

// stores
import { useRecipeStore } from "../stores/recipe-store";

export default function AddGroceryItem() {
  const { isIPhone16Pro, isIpad } = useDeviceType();
  const { searchInput, setSearchInput } = useRecipeStore();
  const [inputValue, setInputValue] = useState(searchInput);
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = !inputValue;

  const handleSearch = () => {
    setSearchInput(inputValue);
  };

  const handleClear = () => {
    setInputValue("");
    setSearchInput("");
  };

  return (
    <View className="flex-1 items-center justify-between relative">
      <View
        className={cn(
          "w-full flex-row items-center",
          "bg-surface-light dark:bg-surface-dark",
          "rounded-full",
          "border",
          isFocused
            ? "border-primary"
            : "border-border-light dark:border-border-dark",
          isIpad() ? "px-5 py-2" : isIPhone16Pro() ? "px-3 py-1" : "px-4 py-1.5"
        )}
      >
        {/* Search icon on the left */}
        <View className="mr-2 opacity-50">
          <SearchIcon width={isIpad() ? 20 : 16} height={isIpad() ? 20 : 16} color="#78716C" />
        </View>

        <TextInput
          value={inputValue}
          onChangeText={(value) => setInputValue(value)}
          placeholder="Search for a recipe"
          placeholderTextColor="#A8A29E"
          returnKeyType="go"
          onSubmitEditing={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "flex-1 text-foreground-light dark:text-foreground-dark",
            isIpad() ? "text-lg py-3" : isIPhone16Pro() ? "text-base py-2" : "text-lg py-2.5"
          )}
          style={{
            fontFamily: "SourceSans3_400Regular",
            minHeight: 40,
          }}
        />

        {/* Action button on the right */}
        {inputValue ? (
          <Pressable
            onPress={isFocused ? handleSearch : handleClear}
            className={cn(
              "rounded-full justify-center items-center bg-primary",
              isIpad() ? "p-2.5 ml-1.5" : "p-2 ml-1"
            )}
          >
            {!isFocused ? (
              <CloseIcon width={isIpad() ? 18 : 14} height={isIpad() ? 18 : 14} color="white" />
            ) : (
              <SearchIcon width={isIpad() ? 18 : 14} height={isIpad() ? 18 : 14} color="white" />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
