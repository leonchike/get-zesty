// src/components/home-view/search-filters.tsx

"use client";

import React, { useMemo } from "react";
import clsx from "clsx";
import { ReusableDrawer } from "@/components/ui/reusable-drawer";
import { Modal } from "@/components/ui/reusable-modal-v2";
import { useMediaQuery } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import pluralize from "pluralize";

import { useFilterStore } from "@/features/search-filters/store/search-filter-store";
import {
  FilterBooleanButton,
  StyledFilterCheckbox,
} from "@/components/ui/filter-boolean-button";
import { FilterState } from "@/features/search-filters/store/search-filter-store";
import { useFilterOptions } from "@/features/search-filters/hooks/useSearchFilterOptions";
import {
  getMealTypeEmoji,
  getCuisineTypeEmoji,
} from "@/lib/helpers/emoji-helpers";
import { capitalizeWords } from "@/lib/helpers/text-helpers";
import { FilterIcon } from "@/components/ui/icons/custom-icons";

function Filter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="" description="">
        <Content onClose={onClose} />
      </Modal>
    );
  }

  return (
    <ReusableDrawer isOpen={isOpen} onClose={onClose} title="" description="">
      <div className="px-4 pb-6">
        <Content onClose={onClose} />
      </div>
    </ReusableDrawer>
  );
}

export default function FilterButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  const filters = useFilterStore();

  const activeFiltersCount = getActiveFiltersCount(filters) > 0;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "flex items-center gap-2 relative rounded-xl",
          activeFiltersCount &&
            "border-2 border-textColor-light dark:border-textColor-dark bg-transparent"
        )}
        variant="outline"
      >
        <span className="">
          <FilterIcon />
        </span>
        <span className="">Filters</span>
        {activeFiltersCount && (
          <span className="absolute -top-2 -right-2 bg-textColor-light dark:bg-textColor-dark text-pageBg-light dark:text-pageBg-dark text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {getActiveFiltersCount(filters)}
          </span>
        )}
      </Button>
      <Filter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

function Content({ onClose }: { onClose: () => void }) {
  // useFilterOptions();
  const filters = useFilterStore();

  const sortedCuisineTypes = useMemo(
    () => filters.availableCuisineTypes.sort((a, b) => a.localeCompare(b)),
    [filters.availableCuisineTypes]
  );

  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount(filters),
    [filters]
  );

  const handleClearAll = () => {
    filters.resetFilters();
  };

  return (
    <div className="flex flex-col h-[80vh] md:h-auto md:max-h-[90vh] select-none">
      <header className="flex-shrink-0 bg-pageBg-light dark:bg-pageBg-dark border-b border-borderGray-light/80 dark:border-borderGray-dark/80">
        <div className="text-center pb-4 -translate-y-1">
          <h2 className="text-lg font-medium">Recipe filters</h2>
        </div>
      </header>
      <main className="flex-grow overflow-y-auto py-6">
        <div className="">
          <h3 className="font-medium text-textColor-light/80 dark:text-textColor-dark/80">
            Quick filters
          </h3>
          <div className="mt-2 flex flex-wrap gap-4">
            <FilterBooleanButton
              emoji="💖"
              label={capitalizeWords("Favorites")}
              value={filters.isFavorite}
              onChange={filters.setIsFavorite}
            />
            <FilterBooleanButton
              emoji="📌"
              label={capitalizeWords("Pinned")}
              value={filters.isPinned}
              onChange={filters.setIsPinned}
            />
            <FilterBooleanButton
              emoji="👨‍🍳"
              label={capitalizeWords("My recipes")}
              value={filters.isPersonal}
              onChange={filters.setIsPersonal}
            />
            <FilterBooleanButton
              emoji="🌍"
              label={capitalizeWords("Public recipes", true)}
              value={filters.isPublic}
              onChange={filters.setIsPublic}
            />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-medium text-textColor-light/80 dark:text-textColor-dark/80">
            Type of dish or drink
          </h3>
          <div className="mt-2 flex flex-wrap gap-4">
            {filters.availableMealTypes.map((mealType) => (
              <StyledFilterCheckbox
                key={mealType}
                id={`mealType-${mealType}`}
                label={capitalizeWords(mealType)}
                emoji={getMealTypeEmoji(mealType)}
                checked={filters.selectedMealTypes.includes(mealType)}
                onCheckedChange={() => filters.toggleSelectedMealType(mealType)}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-medium text-textColor-light/80 dark:text-textColor-dark/80">
            Cuisine
          </h3>
          <div className="mt-2 flex flex-wrap gap-4">
            {sortedCuisineTypes.map((cuisineType) => (
              <StyledFilterCheckbox
                key={cuisineType}
                id={`cuisineType-${cuisineType}`}
                label={capitalizeWords(cuisineType, true)}
                checked={filters.selectedCuisineTypes.includes(cuisineType)}
                onCheckedChange={() => {
                  if (cuisineType.trim()) {
                    filters.toggleSelectedCuisineType(cuisineType);
                  }
                }}
                emoji={getCuisineTypeEmoji(cuisineType)}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 bg-pageBg-light dark:bg-pageBg-dark border-t border-borderGray-light/80 dark:border-borderGray-dark/80 pt-6">
        <div className="flex justify-between max-w-screen-xl mx-auto">
          <Button
            variant="outline"
            className="bg-transparent"
            onClick={handleClearAll}
          >
            Clear all
          </Button>
          <Button onClick={onClose}>
            {activeFiltersCount > 0
              ? `See results from ${activeFiltersCount} ${pluralize(
                  "filter",
                  activeFiltersCount
                )}`
              : "See all recipes"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function getActiveFiltersCount(filters: FilterState): number {
  const booleanFilters = ["isFavorite", "isPinned", "isPersonal", "isPublic"];
  const arrayFilters = ["selectedCuisineTypes", "selectedMealTypes"];

  let count = 0;

  // Count active boolean filters
  booleanFilters.forEach((key) => {
    if (filters[key as keyof FilterState] === true) count++;
  });

  // Count items in array filters
  arrayFilters.forEach((key) => {
    const array = filters[key as keyof FilterState] as string[];
    count += array.length;
  });

  // Count search and globalSearch if they're not empty
  if (filters.search && filters.search.trim() !== "") count++;
  if (filters.globalSearch && filters.globalSearch.trim() !== "") count++;

  return count;
}
