import { Text, View } from "react-native";
import clsx from "clsx";

// types
import { Recipe } from "@/lib/types";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

export default function PageSectionTitle({
  recipe,
}: {
  recipe: Recipe | undefined;
}) {
  const { isIPhone16Pro } = useDeviceType();
  if (!recipe) return null;
  const { title } = recipe;

  return (
    <View
      className={clsx(
        "flex-row items-center justify-between pt-6",
        horizontalPaddingValue
      )}
    >
      <Text
        className={clsx(
          isIPhone16Pro() ? "text-xl" : "text-3xl",
          "font-semibold text-primary-dark dark:text-primary-light"
        )}
      >
        {title}
      </Text>
    </View>
  );
}
