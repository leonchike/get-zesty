"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import debounce from "lodash/debounce";
import { useMediaQuery } from "usehooks-ts";

import { SearchIcon } from "@/components/ui/icons/custom-icons";
import { useFilterStore } from "@/features/search-filters/store/search-filter-store";

export default function Search() {
  const { setGlobalSearch, globalSearch } = useFilterStore();
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    setSearchTerm(globalSearch);
  }, [globalSearch]);

  const debouncedSetGlobalSearch = useCallback(
    debounce((value: string) => {
      setGlobalSearch(value.trim());
    }, 300),
    [setGlobalSearch]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();

    if (pathname === "/") {
      setGlobalSearch(trimmedSearch);
    } else {
      router.push(`/?search=${encodeURIComponent(trimmedSearch)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (pathname === "/") {
      debouncedSetGlobalSearch(newSearchTerm);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "k" &&
        document.activeElement !== inputRef.current
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-[36rem] mx-auto relative"
    >
      <input
        ref={inputRef}
        type="text"
        placeholder={isDesktop ? "Search (Press / to focus)" : "Search"}
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full px-4 py-2 pr-10 h-12 bg-surface border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-primary p-[10px] rounded-full hover:bg-primary/90 transition-colors duration-200"
      >
        <span className="text-white">
          <SearchIcon width={18} height={18} />
        </span>
      </button>
    </form>
  );
}
