"use client";

import { useState, useCallback } from "react";
import debounce from "lodash/debounce";
import { H1 } from "@/components/ui/typography";
import CookbookSortDropdown from "./cookbook-sort";
import CookbookSearch from "./cookbook-search";
import CookbookList from "./cookbook-list";
import type { CookbookSortField } from "../types/cookbook-sort";

export default function CookbooksPageContent() {
  const [sort, setSort] = useState<CookbookSortField>("title-asc");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const debouncedSetSearch = useCallback(
    debounce((value: string) => setDebouncedSearch(value), 300),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSetSearch(value);
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <H1>Cookbooks</H1>
        <CookbookSortDropdown sortBy={sort} onSortChange={setSort} />
      </div>
      <div className="mb-6 max-w-md">
        <CookbookSearch
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by title or author..."
        />
      </div>
      <CookbookList sort={sort} search={debouncedSearch} />
    </>
  );
}
