import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SortDropdown = ({
  sortBy,
  onSortChange,
}: {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}) => {
  return (
    <div className="flex justify-start items-center">
      <div className="flex items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 select-none">
          Sort by:
        </p>
      </div>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger
          className="w-[180px] bg-pageBg-light dark:bg-pageBg-dark text-textColor-light dark:text-textColor-dark outline-none border-none focus:outline-none focus:ring-none dark:focus:ring-none focus:ring-0 dark:focus:ring-0 text-primary-light text-base font-medium hover:underline px-2 focus:border-none"
          isArrow={false}
        >
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="section">Grocery Section</SelectItem>
          <SelectItem value="dateAdded">Order Added</SelectItem>
          <SelectItem value="name">Name</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortDropdown;
