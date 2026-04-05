import { View, Text } from "react-native";
import { useDeviceType } from "@/hooks/useDeviceType";
import clsx from "clsx";
const EmptyRecipeSectionState = ({ message }: { message: string }) => {
  const { isIPhone16Pro } = useDeviceType();
  return (
    <View
      className={clsx(
        isIPhone16Pro() ? "p-4" : "p-8",
        "items-center justify-center flex-1"
      )}
    >
      <Text
        className={clsx(
          isIPhone16Pro() ? "text-base" : "text-lg",
          "text-systemGray3-light dark:text-systemGray3-dark font-medium mb-2"
        )}
      >
        {message}
      </Text>
    </View>
  );
};

export default EmptyRecipeSectionState;
