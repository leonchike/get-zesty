// src/features/groceries/components/ListView.tsx
import React, { useState, useMemo } from "react";
import { View, Text, SectionList, TouchableOpacity } from "react-native";
import { useGroceryListLogic } from "../hooks/use-grocery-list-logic";
import { GroceryItem as GroceryItemType } from "@/lib/types";
import { GroceryListSection } from "../types";
import GroceryItem from "./grocery-item";
import AddGroceryItem from "./add-grocery-item";
import { useDeviceType } from "@/hooks/useDeviceType";
import clsx from "clsx";
import { cn } from "@/lib/helpers/cn";
import { useShakeUndoGrocery } from "../hooks/use-shake-to-undo";
import { EmptyState } from "@/components/empty-state";

const SORT_OPTIONS = [
  { label: "By Section", value: "section" },
  { label: "By Name", value: "name" },
  { label: "By Date Added", value: "dateAdded" },
];

export const ListView = () => {
  const {
    sortBy,
    setSortBy,
    error,
    isFetching,
    buildSections,
  } = useGroceryListLogic();
  const { isIPhone16Pro } = useDeviceType();
  const [showCompleted, setShowCompleted] = useState(false);
  useShakeUndoGrocery();

  function toggleShowCompleted() {
    setShowCompleted((prev) => !prev);
  }

  const sections = useMemo(
    () => buildSections(showCompleted, toggleShowCompleted),
    [buildSections, showCompleted]
  );

  if (error) console.error(error);

  const renderItem = ({
    item,
    section,
  }: {
    item: GroceryItemType;
    section: GroceryListSection;
  }) => <GroceryItem item={item} isCompleted={section.type === "completed"} />;

  const renderSectionHeader = ({
    section,
  }: {
    section: GroceryListSection;
  }) => (
    <View
      className={cn(
        "flex-row items-center justify-between gap-3 pt-6 pb-2 bg-backgroundGray-light dark:bg-backgroundGray-dark",
        section.type === "completed" && !section.isShowCompleted && "pb-1"
      )}
    >
      <View className="gap-1">
        <View className="flex-row items-center gap-3">
          {section.emoji && (
            <Text className="text-2xl">
              {section.emoji}
            </Text>
          )}
          <Text
            className={clsx(
              isIPhone16Pro() ? "text-[1.3rem]" : "text-2xl",
              "font-body-semibold text-foreground-light dark:text-foreground-dark opacity-70"
            )}
          >
            {section.title}
          </Text>
        </View>
        <View className="bg-accent-light h-[3px] w-10 rounded-full ml-0" />
      </View>

      {section.type === "completed" && section.toggleShowCompleted && (
        <TouchableOpacity onPress={section.toggleShowCompleted}>
          <Text
            className={cn(
              "text-foreground-light dark:text-foreground-dark",
              isIPhone16Pro() ? "text-[1.1rem]" : "text-xl"
            )}
          >
            {section.isShowCompleted ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ListHeader = useMemo(() => {
    return () => (
      <View className="pt-4 pb-2">
        <AddGroceryItem />
      </View>
    );
  }, []);

  return (
    <View className="flex-1">
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        className="flex-1"
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => (
          <View className="h-px bg-border-light dark:bg-border-dark" />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center pt-6">
            <EmptyState type="groceries" />
          </View>
        )}
      />
    </View>
  );
};
