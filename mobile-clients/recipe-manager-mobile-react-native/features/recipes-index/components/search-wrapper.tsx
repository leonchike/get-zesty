import { View, Text } from "react-native";

import SearchInput from "./search-input";
import Filters from "./filters";
import clsx from "clsx";

import { useRecipeStore } from "../stores/recipe-store";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

export default function SearchWrapper() {
  return (
    <View className="">
      <View
        className={clsx(
          "w-full flex-row items-center justify-between gap-4 bg-backgroundGray-light dark:bg-backgroundGray-dark pt-4 pb-8",
          horizontalPaddingValue
        )}
      >
        <Filters />
        <SearchInput />
      </View>
    </View>
  );
}
