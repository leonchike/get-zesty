import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InventoryItemWithRelations } from "@/features/inventory/types";

export function useSSEInventoryUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const mergeUpdates = useCallback(
    (
      existingItems: InventoryItemWithRelations[],
      serverItems: InventoryItemWithRelations[]
    ) => {
      const merged = [...existingItems];
      serverItems.forEach((serverItem) => {
        const index = merged.findIndex((i) => i.id === serverItem.id);
        if (index > -1) {
          if (
            new Date(serverItem.updatedAt) > new Date(merged[index].updatedAt)
          ) {
            merged[index] = serverItem;
          }
        } else {
          merged.push(serverItem);
        }
      });
      return merged;
    },
    []
  );

  useEffect(() => {
    const eventSource = new EventSource("/api/inventory-updates");

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      const serverItems = JSON.parse(event.data) as InventoryItemWithRelations[];
      queryClient.setQueryData<InventoryItemWithRelations[]>(
        ["inventoryItems"],
        (oldItems) => {
          if (!oldItems) return serverItems;
          return mergeUpdates(oldItems, serverItems);
        }
      );
    };

    eventSource.onerror = () => setIsConnected(false);

    return () => eventSource.close();
  }, [queryClient, mergeUpdates]);

  return isConnected;
}
