import { useEffect } from "react";
import RNShake from "react-native-shake";
import { Alert } from "react-native";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useUpdateGroceryItem } from "./grocery-query-hooks";
import { GroceryItemWithSection } from "@/lib/types";

export const useShakeUndoGrocery = () => {
  const queryClient = useQueryClient();
  const updateItemStatus = useUpdateGroceryItem();

  // Find most recently completed item within last 5 minutes
  const findRecentlyCompletedItem = (items: GroceryItemWithSection[]) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return items
      .filter(
        (item) =>
          item.status === "COMPLETED" &&
          new Date(item.updatedAt) > fiveMinutesAgo
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
  };

  // Handle shake event
  const handleShake = () => {
    const items = queryClient.getQueryData<GroceryItemWithSection[]>([
      "groceryItems",
    ]);
    if (!items) return;

    const recentItem = findRecentlyCompletedItem(items);

    if (recentItem) {
      Alert.alert(
        "Undo Complete",
        `Return "${recentItem.name}" to shopping list?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Undo",
            onPress: () => {
              updateItemStatus.mutate({
                id: recentItem.id,
                status: "ACTIVE",
              });
            },
          },
        ]
      );
    }
  };

  // Set up shake detection
  useEffect(() => {
    const subscription = RNShake.addListener(handleShake);

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    undoLastCompleted: handleShake,
    isUndoing: updateItemStatus.isPending,
  };
};
