"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchCookbookRecipesAction } from "../actions/cookbook-actions";

export function useCookbookRecipes(cookbookId: string, search: string) {
  return useInfiniteQuery({
    queryKey: ["cookbook-recipes", cookbookId, search],
    queryFn: ({ pageParam = 1 }) =>
      fetchCookbookRecipesAction({ cookbookId, search, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}
