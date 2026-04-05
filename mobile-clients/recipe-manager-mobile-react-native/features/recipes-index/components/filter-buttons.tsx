import { View, Text, TouchableOpacity, Animated } from "react-native";
import React, { useState, useEffect } from "react";
import clsx from "clsx";

export function FilterBooleanButton({
  emoji,
  label,
  value,
  onChange,
}: {
  emoji: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handlePress = () => {
    setIsAnimating(true);
    console.log("Before update - current value:", value);
    onChange(!value); // Set the store
    console.log("After update - new value:", !value);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  return (
    <View className="relative">
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          className={clsx(
            "flex-row items-center gap-2 bg-transparent rounded-full h-12 px-4",
            "border border-transparent"
          )}
        >
          <View className="flex-row items-center gap-2">
            {emoji && <Text className="text-xl">{emoji}</Text>}
            <Text className="text-primary-dark dark:text-primary-light">
              {label}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <View
        pointerEvents="none"
        className={clsx(
          "absolute inset-0 rounded-full",
          value
            ? "border-2 border-brand"
            : "border border-primary-dark dark:border-primary-light opacity-50"
        )}
      />
    </View>
  );
}

interface FilterCheckboxItemProps {
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
  emoji?: string;
}

export function FilterCheckboxItem({
  label,
  checked,
  onCheckedChange,
  emoji,
}: FilterCheckboxItemProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handlePress = () => {
    setIsAnimating(true);
    onCheckedChange(); // This toggles the selection in the store
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  return (
    <View className="relative">
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          className={clsx(
            "flex-row items-center gap-2 bg-transparent rounded-full h-12 px-4"
          )}
        >
          {emoji && <Text className="text-xl">{emoji}</Text>}
          <Text className="text-primary-dark dark:text-primary-light">
            {label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <View
        pointerEvents="none"
        className={clsx(
          "absolute inset-0 rounded-full",
          checked
            ? "border-2 border-brand"
            : "border border-primary-dark dark:border-primary-light opacity-50"
        )}
      />
    </View>
  );
}
