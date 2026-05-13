"use client";

import clsx from "clsx";
import { useInventoryStore } from "@/features/inventory/stores/inventory-store";
import { useInventoryLocationsQuery } from "@/features/inventory/hooks/inventory-query-hooks";

export function LocationFilterTabs() {
  const { locationFilter, setLocationFilter } = useInventoryStore();
  const { data: locations = [] } = useInventoryLocationsQuery();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        onClick={() => setLocationFilter(null)}
        className={clsx(
          "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
          locationFilter === null
            ? "bg-foreground text-background border-foreground"
            : "bg-surface text-muted-foreground border-border hover:border-foreground/40"
        )}
      >
        All
      </button>
      {locations.map((loc) => (
        <button
          key={loc.id}
          type="button"
          onClick={() => setLocationFilter(loc.id)}
          className={clsx(
            "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
            locationFilter === loc.id
              ? "bg-foreground text-background border-foreground"
              : "bg-surface text-muted-foreground border-border hover:border-foreground/40"
          )}
        >
          {loc.emoji ? <span className="mr-1">{loc.emoji}</span> : null}
          {loc.name}
        </button>
      ))}
    </div>
  );
}
