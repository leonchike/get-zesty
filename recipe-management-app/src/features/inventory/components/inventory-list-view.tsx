"use client";

import { useState, type ReactNode } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useInventoryListLogic } from "@/features/inventory/hooks/useInventoryListLogic";
import { useInventoryStore } from "@/features/inventory/stores/inventory-store";
import InventoryItem from "@/features/inventory/components/inventory-item";
import { LocationFilterTabs } from "@/features/inventory/components/location-filter-tabs";
import InventorySearchInput from "@/features/inventory/components/inventory-search-input";
import type { InventoryItemWithRelations } from "@/features/inventory/types";

export default function InventoryListView() {
  const { sortBy, setSortBy, searchQuery } = useInventoryStore();
  const { isLoading, error, groups, consumed, discarded, expiringSoonCount } =
    useInventoryListLogic();
  const isSearching = searchQuery.trim().length > 0;

  if (error) {
    return (
      <div className="py-6 text-destructive">Error: {error.message}</div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <InventorySearchInput />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LocationFilterTabs />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>
          {(["location", "expiry", "name"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSortBy(opt)}
              className={
                sortBy === opt
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              By {opt}
            </button>
          ))}
        </div>
      </div>

      {expiringSoonCount > 0 && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2 text-sm">
          <span className="font-medium">{expiringSoonCount} item(s)</span>
          <span className="text-muted-foreground"> expiring within 3 days.</span>
        </div>
      )}

      {isLoading && groups.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Loading your kitchen…
        </div>
      )}

      {!isLoading && groups.length === 0 && !isSearching && (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center bg-grain">
          <div className="text-4xl mb-3">🧺</div>
          <div className="font-heading text-lg text-foreground mb-1">
            Nothing in your kitchen yet
          </div>
          <p className="text-sm text-muted-foreground">
            Add an item above and we&apos;ll sort it into the right spot.
          </p>
        </div>
      )}

      {!isLoading && groups.length === 0 && isSearching && (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-heading text-base text-foreground mb-1">
            No matches for &ldquo;{searchQuery}&rdquo;
          </div>
          <p className="text-sm text-muted-foreground">
            Try a different search or clear it to see everything.
          </p>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {groups.map((group) => (
          <m.div
            key={group.locationId}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="pt-6 pb-2 font-heading text-lg font-medium text-foreground select-none flex items-center gap-3">
              {group.emoji && (
                <span className="text-2xl">{group.emoji}</span>
              )}
              <span className="relative">
                {group.name}
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-accent rounded-full" />
              </span>
              <span className="text-xs text-muted-foreground font-body font-normal">
                {group.items.length}
              </span>
            </h2>
            <ul className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {group.items.map((item) => (
                  <ListItemRow key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </ul>
          </m.div>
        ))}
      </AnimatePresence>

      {consumed.length > 0 && (
        <ToggleableSection title={`Recently consumed (${consumed.length})`}>
          <ul className="divide-y divide-border">
            {consumed.map((item) => (
              <li key={item.id} className="text-muted-foreground">
                <InventoryItem item={item} />
              </li>
            ))}
          </ul>
        </ToggleableSection>
      )}

      {discarded.length > 0 && (
        <ToggleableSection title={`Recently discarded (${discarded.length})`}>
          <ul className="divide-y divide-border">
            {discarded.map((item) => (
              <li key={item.id} className="text-muted-foreground">
                <InventoryItem item={item} />
              </li>
            ))}
          </ul>
        </ToggleableSection>
      )}
    </div>
  );
}

function ListItemRow({ item }: { item: InventoryItemWithRelations }) {
  return (
    <m.li
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <InventoryItem item={item} />
    </m.li>
  );
}

function ToggleableSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-heading text-base font-medium select-none text-muted-foreground">
          {title}
        </h2>
        <Button
          onClick={() => setIsVisible(!isVisible)}
          variant="link"
          className="text-xs text-muted-foreground pr-0"
        >
          {isVisible ? "Hide" : "Show"}
        </Button>
      </div>
      <AnimatePresence>
        {isVisible && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
