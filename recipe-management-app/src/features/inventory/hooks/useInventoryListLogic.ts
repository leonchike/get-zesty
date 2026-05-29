"use client";

import { useMemo } from "react";
import {
  useInventoryItemsQuery,
  useInventoryLocationsQuery,
} from "@/features/inventory/hooks/inventory-query-hooks";
import { useInventoryStore } from "@/features/inventory/stores/inventory-store";
import type {
  InventoryItemWithRelations,
  InventoryStatus,
} from "@/features/inventory/types";

export interface InventoryGroup {
  locationId: string;
  name: string;
  emoji: string | null;
  sortOrder: number;
  items: InventoryItemWithRelations[];
}

const EXPIRING_SOON_DAYS = 3;

export function useInventoryListLogic() {
  const { sortBy, locationFilter, expiryFilter, searchQuery } =
    useInventoryStore();
  const { data: items = [], isLoading, error } = useInventoryItemsQuery();
  const { data: locations = [] } = useInventoryLocationsQuery();

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (item: InventoryItemWithRelations) => {
    if (!trimmedQuery) return true;
    return (
      item.name.toLowerCase().includes(trimmedQuery) ||
      (item.notes?.toLowerCase().includes(trimmedQuery) ?? false) ||
      (item.recipe?.title?.toLowerCase().includes(trimmedQuery) ?? false)
    );
  };

  const active = useMemo(
    () => items.filter((i) => i.status === "ACTIVE" && matchesSearch(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, trimmedQuery]
  );

  const consumed = useMemo(
    () =>
      items
        .filter(
          (i) => i.status === ("CONSUMED" as InventoryStatus) && matchesSearch(i)
        )
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 20),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, trimmedQuery]
  );

  const discarded = useMemo(
    () =>
      items
        .filter(
          (i) => i.status === ("DISCARDED" as InventoryStatus) && matchesSearch(i)
        )
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 20),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, trimmedQuery]
  );

  const filteredActive = useMemo(() => {
    let arr = active;
    if (locationFilter) {
      arr = arr.filter((i) => i.locationId === locationFilter);
    }
    if (expiryFilter === "expiring") {
      const now = Date.now();
      arr = arr.filter((i) => {
        if (!i.expiresAt) return false;
        const diffDays = Math.ceil(
          (new Date(i.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= EXPIRING_SOON_DAYS;
      });
    }
    return arr;
  }, [active, locationFilter, expiryFilter]);

  const sortedFiltered = useMemo(() => {
    const arr = [...filteredActive];
    if (sortBy === "expiry") {
      arr.sort((a, b) => {
        const aT = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const bT = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        return aT - bT;
      });
    } else if (sortBy === "name") {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return arr;
  }, [filteredActive, sortBy]);

  const groups: InventoryGroup[] = useMemo(() => {
    const map = new Map<string, InventoryGroup>();

    for (const loc of locations) {
      map.set(loc.id, {
        locationId: loc.id,
        name: loc.name,
        emoji: loc.emoji,
        sortOrder: loc.sortOrder,
        items: [],
      });
    }

    for (const item of sortedFiltered) {
      const group = map.get(item.locationId);
      if (group) {
        group.items.push(item);
      } else {
        map.set(item.locationId, {
          locationId: item.locationId,
          name: item.location?.name ?? "Unknown",
          emoji: item.location?.emoji ?? null,
          sortOrder: 999,
          items: [item],
        });
      }
    }

    return Array.from(map.values())
      .filter((g) => g.items.length > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [locations, sortedFiltered]);

  const expiringSoonCount = useMemo(() => {
    const now = Date.now();
    return active.filter((i) => {
      if (!i.expiresAt) return false;
      const diffDays = Math.ceil(
        (new Date(i.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= EXPIRING_SOON_DAYS;
    }).length;
  }, [active]);

  return {
    isLoading,
    error,
    locations,
    groups,
    active,
    consumed,
    discarded,
    expiringSoonCount,
  };
}
