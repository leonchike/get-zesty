import { View } from "react-native";
import clsx from "clsx";

// types
import { Recipe } from "@/lib/types";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

// components
import ReadMoreText from "@/components/read-more";

export default function Description({
  recipe,
}: {
  recipe: Recipe | undefined;
}) {
  if (!recipe) return null;
  const { description } = recipe;
  if (!description) return null;

  return (
    <View className={clsx("pt-4", horizontalPaddingValue)}>
      <ReadMoreText
        numberOfLines={3}
        readMoreText={"read more"}
        readLessText={"read less"}
        readMoreStyle={{ color: "#0A84FF" }}
        readLessStyle={{ color: "#0A84FF" }}
      >
        {description}
      </ReadMoreText>
    </View>
  );
}
