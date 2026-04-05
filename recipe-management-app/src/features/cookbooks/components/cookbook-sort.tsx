"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CookbookSortField } from "../types/cookbook-sort";

const CookbookSortDropdown = ({
  sortBy,
  onSortChange,
}: {
  sortBy: CookbookSortField;
  onSortChange: (sort: CookbookSortField) => void;
}) => {
  return (
    <div className="flex justify-start items-center">
      <div className="flex items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 select-none">
          Sort by:
        </p>
      </div>
      <Select
        value={sortBy}
        onValueChange={(value) => onSortChange(value as CookbookSortField)}
      >
        <SelectTrigger
          className="w-[180px] bg-pageBg-light dark:bg-pageBg-dark text-textColor-light dark:text-textColor-dark outline-none border-none focus:outline-none focus:ring-none dark:focus:ring-none focus:ring-0 dark:focus:ring-0 text-primary-light text-base font-medium hover:underline px-2 focus:border-none"
          isArrow={false}
        >
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title-asc">Title A–Z</SelectItem>
          <SelectItem value="title-desc">Title Z–A</SelectItem>
          <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
          <SelectItem value="createdAt-desc">Recently Added</SelectItem>
          <SelectItem value="recipeCount-desc">Most Recipes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CookbookSortDropdown;
