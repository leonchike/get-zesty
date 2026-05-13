"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { InventoryLocation } from "@prisma/client";
import {
  getUserInventoryAction,
  getUserInventoryLocationsAction,
  createInventoryItemAction,
  updateInventoryItemAction,
  consumeInventoryItemAction,
  discardInventoryItemAction,
  deleteInventoryItemAction,
  createUserLocationAction,
} from "@/features/inventory/actions/inventory-actions";
import { useSSEInventoryUpdates } from "@/features/inventory/hooks/useSSEInventoryUpdates";
import type {
  InventoryItemWithRelations,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from "@/features/inventory/types";

export const useInventoryItemsQuery = () => {
  useSSEInventoryUpdates();
  return useQuery<InventoryItemWithRelations[], Error>({
    queryKey: ["inventoryItems"],
    queryFn: () => getUserInventoryAction(),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useInventoryLocationsQuery = () => {
  return useQuery<InventoryLocation[], Error>({
    queryKey: ["inventoryLocations"],
    queryFn: () => getUserInventoryLocationsAction(),
  });
};

export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInventoryItemInput) =>
      createInventoryItemAction(input),
    onSuccess: (newItem) => {
      if (!newItem) return;
      queryClient.setQueryData<InventoryItemWithRelations[]>(
        ["inventoryItems"],
        (old) => (old ? [newItem as InventoryItemWithRelations, ...old] : [newItem as InventoryItemWithRelations])
      );
    },
    onError: () => toast.error("Failed to add inventory item"),
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInventoryItemInput) =>
      updateInventoryItemAction(input),
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries({ queryKey: ["inventoryItems"] });
      const previousItems = queryClient.getQueryData<InventoryItemWithRelations[]>([
        "inventoryItems",
      ]);

      const locations =
        queryClient.getQueryData<InventoryLocation[]>(["inventoryLocations"]) ?? [];

      queryClient.setQueryData<InventoryItemWithRelations[]>(
        ["inventoryItems"],
        (old) =>
          old?.map((item) => {
            if (item.id !== updatedItem.id) return item;
            const newLocation =
              updatedItem.locationId
                ? locations.find((l) => l.id === updatedItem.locationId) ??
                  item.location
                : item.location;
            return {
              ...item,
              ...updatedItem,
              location: newLocation,
            } as InventoryItemWithRelations;
          }) ?? []
      );

      return { previousItems };
    },
    onError: (_err, _updatedItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData<InventoryItemWithRelations[]>(
          ["inventoryItems"],
          context.previousItems
        );
      }
      toast.error("Failed to update inventory item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
};

export const useConsumeInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decrement,
    }: {
      id: string;
      decrement?: number;
    }) => consumeInventoryItemAction(id, decrement ?? 1),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
    onError: () => toast.error("Failed to consume item"),
  });
};

export const useDiscardInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discardInventoryItemAction(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
    onError: () => toast.error("Failed to discard item"),
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInventoryItemAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["inventoryItems"] });
      const previousItems = queryClient.getQueryData<InventoryItemWithRelations[]>([
        "inventoryItems",
      ]);
      queryClient.setQueryData<InventoryItemWithRelations[]>(
        ["inventoryItems"],
        (old) => (old ? old.filter((item) => item.id !== id) : [])
      );
      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData<InventoryItemWithRelations[]>(
          ["inventoryItems"],
          context.previousItems
        );
      }
      toast.error("Failed to delete inventory item");
    },
  });
};

export const useCreateInventoryLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; emoji?: string | null }) =>
      createUserLocationAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryLocations"] });
    },
    onError: () => toast.error("Failed to create location"),
  });
};
