"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserGroceriesAction,
  createGroceryItemAction,
  updateGroceryItemAction,
  deleteGroceryItemAction,
  getGrocerySections,
} from "@/features/groceries/actions/grocery-actions";
import { GroceryItem, GrocerySection } from "@prisma/client";
import { toast } from "sonner";
import { useSSEGroceryUpdates } from "@/features/groceries/hooks/useSSEGroceryUpdates";

export interface GroceryItemWithSection extends GroceryItem {
  section: {
    name: string;
    id: string;
  } | null;
  recipe?: {
    title: string;
    id: string;
  } | null;
}

export interface CreateGroceryItemInput {
  name: string;
  quantity: number | null;
  quantityUnit: string | null;
  recipeId?: string | null;
}

export const useGroceryItemsQuery = (
  refetchInterval: number = 1000,
  refetchIntervalInBackground: boolean = true
) => {
  return useQuery<GroceryItemWithSection[], Error>({
    queryKey: ["groceryItems"],
    queryFn: () => getUserGroceriesAction(),
    refetchInterval,
    refetchIntervalInBackground,
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useAddGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroceryItemInput) =>
      createGroceryItemAction(input),
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

/**
 * Custom hook for updating a grocery item using React Query's useMutation.
 *
 * This hook provides optimistic updates for a smoother user experience and
 * handles error cases by rolling back to the previous state.
 *
 * @returns {UseMutationResult} A mutation result object from React Query.
 *
 * @example
 * const updateGroceryItem = useUpdateGroceryItem();
 * updateGroceryItem.mutate({ id: '123', name: 'Updated Item' });
 *
 * @mutationFn Updates the grocery item on the server.
 * @onMutate Performs optimistic update:
 *   1. Cancels any outgoing refetches.
 *   2. Snapshots the current grocery items.
 *   3. Updates the local cache with the new item data.
 * @onError Rolls back to the previous state if the mutation fails.
 * @onSettled Refetches the grocery items to ensure data consistency.
 */

export const useUpdateGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<GroceryItemWithSection> & { id: string }) =>
      updateGroceryItemAction(input),
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
                    "sectionId" in updatedItem
                      ? updatedItem.sectionId
                        ? { id: updatedItem.sectionId, name: sectionName || "" }
                        : null
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

      toast.error("Error updating grocery item");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ["groceryItems"] });
    },
  });
};

// export const useDeleteGroceryItem = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: string) => deleteGroceryItem(id),
//     onSuccess: (deletedId: string) => {
//       queryClient.setQueryData<GroceryItemWithSection[]>(
//         ["groceryItems"],
//         (oldItems) => {
//           return oldItems
//             ? oldItems.filter((item) => item.id !== deletedId)
//             : [];
//         }
//       );
//     },
//   });
// };

export const useDeleteGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGroceryItemAction(id),
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
      toast.error("Error deleting grocery item");
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

export const useGroceryItemsQuery2 = () => {
  useSSEGroceryUpdates(); // This will set up the SSE connection

  return useQuery<GroceryItemWithSection[], Error>({
    queryKey: ["groceryItems"],
    queryFn: () => getUserGroceriesAction(),
    // Remove refetchInterval and refetchIntervalInBackground
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
