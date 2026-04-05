// src/features/groceries/hooks/grocery-query-hooks.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GroceryItem,
  GrocerySection,
  GroceryItemWithSection,
} from "@/lib/types";
// import { useSSEGroceryUpdates } from "./useSSEGroceryUpdates";
import {
  getUserGroceries,
  updateGroceryItem,
  getGrocerySections,
  deleteGroceryItem,
  addGroceryItem,
} from "@/lib/backend-api";
import { useIsProduction } from "@/hooks/useIsProduction";

// haptics
import * as Haptics from "expo-haptics";

export interface CreateGroceryItemInput {
  name: string;
  quantity: number | null;
  quantityUnit: string | null;
  recipeId?: string | null;
}

export const useGroceryItemsQuery = () => {
  const isProduction = useIsProduction();

  return useQuery<GroceryItemWithSection[], Error>({
    queryKey: ["groceryItems"],
    queryFn: getUserGroceries,
    // Refetch every 30 seconds when window is focused
    refetchInterval: isProduction ? 3000 : 30000,
    // Refetch every 3 seconds on production, 30 seconds on dev
    refetchIntervalInBackground: false,
    // Only refetch if data is older than 3 seconds on production, 30 seconds on dev
    staleTime: isProduction ? 3000 : 30000,
    // Retry failed requests up to 3 times
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useAddGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroceryItemInput) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return addGroceryItem(input);
    },
    onSuccess: (newItem: GroceryItemWithSection) => {
      queryClient.setQueryData<GroceryItemWithSection[]>(
        ["groceryItems"],
        (oldItems) => {
          return oldItems ? [...oldItems, newItem] : [newItem];
        }
      );
    },
  });
};

export const useUpdateGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<GroceryItemWithSection> & { id: string }) => {
      // Trigger haptics when the mutation starts
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return updateGroceryItem(input);
    },
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries({ queryKey: ["groceryItems"] });
      const previousItems = queryClient.getQueryData<GroceryItemWithSection[]>([
        "groceryItems",
      ]);

      let sectionName: string | undefined;
      if ("sectionId" in updatedItem) {
        const grocerySections = queryClient.getQueryData<GrocerySection[]>([
          "grocerySections",
        ]);
        sectionName = grocerySections?.find(
          (section) => section.id === updatedItem.sectionId
        )?.name;
      }

      queryClient.setQueryData<GroceryItemWithSection[]>(
        ["groceryItems"],
        (old) =>
          old?.map((item) =>
            item.id === updatedItem.id
              ? {
                  ...item,
                  ...updatedItem,
                  section:
                    "sectionId" in updatedItem && updatedItem.sectionId
                      ? {
                          id: updatedItem.sectionId,
                          name: sectionName ?? "",
                          items: [],
                          commonItems: [],
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        }
                      : item.section,
                }
              : item
          ) ?? []
      );

      return { previousItems };
    },
    onError: (err, newItem, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData<GroceryItemWithSection[]>(
        ["groceryItems"],
        context?.previousItems
      );
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ["groceryItems"] });
    },
  });
};

export const useDeleteGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGroceryItem(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["groceryItems"] });
      const previousItems = queryClient.getQueryData<GroceryItemWithSection[]>([
        "groceryItems",
      ]);
      queryClient.setQueryData<GroceryItemWithSection[]>(
        ["groceryItems"],
        (old) => (old ? old.filter((item) => item.id !== deletedId) : [])
      );
      return { previousItems };
    },
    onError: (err, deletedId, context) => {
      queryClient.setQueryData<GroceryItemWithSection[]>(
        ["groceryItems"],
        context?.previousItems
      );
    },
    // Remove onSuccess and onSettled callbacks as SSE will handle updates
  });
};

export const useGrocerySectionsQuery = () => {
  return useQuery<GrocerySection[], Error>({
    queryKey: ["grocerySections"],
    queryFn: () => getGrocerySections(),
  });
};
