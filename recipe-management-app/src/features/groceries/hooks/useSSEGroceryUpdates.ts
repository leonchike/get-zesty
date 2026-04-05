// src/hooks/useSSEGroceryUpdates.ts

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GroceryItem } from "@prisma/client";

export function useSSEGroceryUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const mergeUpdates = useCallback(
    (existingItems: GroceryItem[], serverItems: GroceryItem[]) => {
      const mergedItems = [...existingItems];
      serverItems.forEach((serverItem) => {
        const index = mergedItems.findIndex(
          (item) => item.id === serverItem.id
        );
        if (index > -1) {
          // Update existing item, preserving optimistic updates if newer
          if (
            new Date(serverItem.updatedAt) >
            new Date(mergedItems[index].updatedAt)
          ) {
            mergedItems[index] = serverItem;
          }
        } else {
          // Add new item
          mergedItems.push(serverItem);
        }
      });
      return mergedItems;
    },
    []
  );

  useEffect(() => {
    const eventSource = new EventSource("/api/grocery-updates");

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      const serverItems = JSON.parse(event.data);
      queryClient.setQueryData<GroceryItem[]>(["groceryItems"], (oldItems) => {
        if (!oldItems) return serverItems;
        return mergeUpdates(oldItems, serverItems);
      });
    };

    eventSource.onerror = () => setIsConnected(false);

    return () => eventSource.close();
  }, [queryClient, mergeUpdates]);

  return isConnected;
}
