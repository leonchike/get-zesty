"use client";

import { useCallback, useMemo } from "react";
import { GroceryItem as GroceryItemType } from "@prisma/client";
import { useGroceryStore } from "@/features/groceries/stores/grocery-store";
import {
  useGroceryItemsQuery2,
  GroceryItemWithSection,
} from "@/features/groceries/hooks/grocery-query-hooks";
import { SECTION_ORDER } from "@/features/groceries/constants/grocery-sections";
import { getSectionEmoji } from "@/features/groceries/constants/grocery-sections";
import { GroceryListSection } from "@/features/groceries/types";

interface GroceryItem extends GroceryItemType {
  section: {
    name: string;
    id: string;
  } | null;
}

export function useGroceryListLogic() {
  const { sortBy, setSortBy } = useGroceryStore();
  const { data, error, isFetching } = useGroceryItemsQuery2();

  const sortedItems = useMemo(() => sortItems(data, sortBy), [data, sortBy]);

  const { activeItems, completedItems } = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return sortedItems.reduce(
      (
        acc: { activeItems: GroceryItem[]; completedItems: GroceryItem[] },
        item: GroceryItem
      ) => {
        if (item.status === "COMPLETED") {
          if (new Date(item.updatedAt) >= sevenDaysAgo) {
            acc.completedItems.push(item);
          }
        } else {
          acc.activeItems.push(item);
        }
        return acc;
      },
      { activeItems: [], completedItems: [] }
    );
  }, [sortedItems]);

  const groupedActiveItems = useMemo(() => {
    const grouped = activeItems.reduce<Record<string, GroceryItem[]>>(
      (acc, item) => {
        const key =
          sortBy === "section" ? item.section?.name || "Other" : "All Items";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      },
      {}
    );

    if (sortBy === "section") {
      const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        const idxA = SECTION_ORDER.indexOf(a as (typeof SECTION_ORDER)[number]);
        const idxB = SECTION_ORDER.indexOf(b as (typeof SECTION_ORDER)[number]);
        return (
          (idxA === -1 ? SECTION_ORDER.length : idxA) -
          (idxB === -1 ? SECTION_ORDER.length : idxB)
        );
      });
      return Object.fromEntries(sortedEntries);
    }

    return grouped;
  }, [activeItems, sortBy]);

  const buildSections = useCallback(
    (
      showCompleted: boolean,
      toggleShowCompleted: () => void
    ): GroceryListSection[] => {
      const activeSections: GroceryListSection[] = Object.entries(
        groupedActiveItems
      ).map(([section, items]) => ({
        title: section,
        emoji: getSectionEmoji(section),
        data: items as GroceryItemWithSection[],
        type: "active" as const,
      }));

      if (completedItems.length > 0) {
        const sorted = [...completedItems].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        activeSections.push({
          title: "Completed",
          emoji: "✅",
          data: sorted as GroceryItemWithSection[],
          type: "completed" as const,
          toggleShowCompleted,
          isShowCompleted: showCompleted,
        });
      }

      return activeSections;
    },
    [groupedActiveItems, completedItems]
  );

  return {
    sortBy,
    setSortBy,
    error,
    isFetching,
    groupedActiveItems,
    completedItems,
    buildSections,
  };
}

const sortItems = (items: GroceryItem[] | undefined, sortBy: string) => {
  if (!items) return [];

  return [...items].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "COMPLETED" ? 1 : -1;
    }
    switch (sortBy) {
      case "section":
        return a.name.localeCompare(b.name);
      case "name":
        return a.name.localeCompare(b.name);
      case "dateAdded":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        return 0;
    }
  });
};
