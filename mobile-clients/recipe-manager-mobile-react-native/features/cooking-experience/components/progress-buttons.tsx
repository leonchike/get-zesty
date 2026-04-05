import { TouchableOpacity, Text, View } from "react-native";
import { LeftArrowIcon, RightArrowIcon } from "@/components/custom-icons";
import clsx from "clsx";
import * as Haptics from "expo-haptics";

import { useColorScheme } from "@/hooks/useColorScheme";

export function ProgressButtons({
  currentStep,
  totalSteps,
  goToPreviousStep,
  goToNextStep,
  onClose,
  onDoneCooking,
}: {
  currentStep: number;
  totalSteps: number;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
  onClose: () => void;
  onDoneCooking: () => void;
}) {
  const colorScheme = useColorScheme();

  const handleDoneCooking = async () => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    onDoneCooking();
  };

  return (
    <View className="flex flex-row justify-between mb-4">
      {/* Previous button — warm muted fill */}
      <TouchableOpacity
        onPress={goToPreviousStep}
        disabled={currentStep === 0}
        className={clsx(
          "flex-row items-center py-4 px-6 rounded-full",
          "bg-surface-dark dark:bg-surface-light",
          currentStep === 0 && "opacity-50"
        )}
      >
        <LeftArrowIcon
          className="w-5"
          color={colorScheme === "dark" ? "#292119" : "#F5F0EB"}
        />
      </TouchableOpacity>

      {currentStep === totalSteps - 1 ? (
        /* Done Cooking — success green */
        <TouchableOpacity
          onPress={handleDoneCooking}
          className="flex-row items-center py-4 px-6 rounded-full bg-success-light"
        >
          <Text className="text-white font-body-semibold text-base">
            Done Cooking!
          </Text>
        </TouchableOpacity>
      ) : (
        /* Next button — coral primary fill */
        <TouchableOpacity
          onPress={goToNextStep}
          className="flex-row items-center py-4 px-6 rounded-full bg-primary-light"
        >
          <RightArrowIcon
            className="w-5"
            color="#FFFFFF"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
