"use client";

import { Search, X } from "lucide-react";
import { useInventoryStore } from "@/features/inventory/stores/inventory-store";

export default function InventorySearchInput() {
  const { searchQuery, setSearchQuery } = useInventoryStore();

  return (
    <div className="relative w-full sm:w-72">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        width={16}
        height={16}
      />
      <input
        type="text"
        placeholder="Search inventory…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-9 pl-9 pr-8 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X width={14} height={14} />
        </button>
      )}
    </div>
  );
}
