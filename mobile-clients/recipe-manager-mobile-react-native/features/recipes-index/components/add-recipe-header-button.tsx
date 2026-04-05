import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import clsx from "clsx";

import { PlusIcon } from "@/components/custom-icons";
import { APP_ROUTES } from "@/lib/routes";
import { useDeviceType } from "@/hooks/useDeviceType";

const AddRecipeHeaderButton = () => {
  const router = useRouter();
  const { isIpad } = useDeviceType();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(APP_ROUTES.createRecipe as any);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityLabel="Create new recipe"
      activeOpacity={0.7}
      className={clsx(
        "bg-primary-light rounded-full items-center justify-center",
        isIpad() ? "p-2.5" : "p-2"
      )}
    >
      <PlusIcon
        width={isIpad() ? 20 : 16}
        height={isIpad() ? 20 : 16}
        color="white"
      />
    </TouchableOpacity>
  );
};

export default AddRecipeHeaderButton;
