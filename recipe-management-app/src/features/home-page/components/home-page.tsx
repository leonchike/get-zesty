"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { fetchRecipesAction } from "@/features/search-filters/actions/search-actions";
import { useInView } from "react-intersection-observer";
import { useFilterStore } from "@/features/search-filters/store/search-filter-store";
import DisplayRecipes from "@/features/home-page/components/display-recipes";
import debounce from "lodash/debounce";
import FilterButton from "@/features/search-filters/components/search-filters";
import { useFilterOptions } from "@/features/search-filters/hooks/useSearchFilterOptions";

interface HomePageProps {
  isSignedIn: boolean;
  initialSearch?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getSubGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "What are we making today?";
  if (hour < 17) return "Ready to cook something?";
  return "What's cooking tonight?";
}

const HomePage = ({ isSignedIn, initialSearch = "" }: HomePageProps) => {
  useFilterOptions();
  const searchParams = useSearchParams();
  const filters = useFilterStore();
  const { ref, inView } = useInView();
  const isInitialMount = useRef(true);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["recipes", filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchRecipesAction({
        search: filters.globalSearch,
        isFavorite: filters.isFavorite,
        isPinned: filters.isPinned,
        isPersonal: filters.isPersonal,
        isPublic: filters.isPublic,
        cuisineTypes: filters.selectedCuisineTypes,
        mealTypes: filters.selectedMealTypes,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const debouncedRefetch = useCallback(
    debounce(() => refetch(), 300),
    [refetch]
  );

  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      filters.setGlobalSearch(searchFromUrl);
    } else if (initialSearch) {
      filters.setGlobalSearch(initialSearch);
    } else {
      filters.setGlobalSearch("");
    }

    return () => {
      filters.setGlobalSearch("");
    };
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      debouncedRefetch();
    }
  }, [filters, debouncedRefetch]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const heading = isSignedIn
    ? filters.isPublic
      ? "Discover Recipes"
      : getGreeting()
    : "Discover Recipes";

  const subHeading = isSignedIn && !filters.isPublic ? getSubGreeting() : null;

  return (
    <div className="min-w-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-medium tracking-tight">
            {heading}
          </h1>
          {subHeading && (
            <p className="text-muted-foreground mt-1 text-lg">{subHeading}</p>
          )}
        </div>

        <div>
          <FilterButton />
        </div>
      </div>

      <DisplayRecipes
        recipes={data?.pages?.flatMap((page) => page.recipes) ?? []}
        isLoading={isLoading}
      />

      {hasNextPage && (
        <div ref={ref} className="h-10 flex items-center justify-center mt-6">
          {isFetchingNextPage ? (
            <p className="text-muted-foreground">Loading more...</p>
          ) : (
            <p className="text-muted-foreground">Load more</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
