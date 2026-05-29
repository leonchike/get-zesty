import { create } from "zustand";

export type ExpiryFilter = "all" | "expiring";

interface InventoryStore {
  sortBy: "location" | "expiry" | "name";
  locationFilter: string | null;
  expiryFilter: ExpiryFilter;
  inputValue: string;
  searchQuery: string;
  setSortBy: (sortBy: "location" | "expiry" | "name") => void;
  setLocationFilter: (locationId: string | null) => void;
  setExpiryFilter: (expiryFilter: ExpiryFilter) => void;
  setInputValue: (inputValue: string) => void;
  setSearchQuery: (searchQuery: string) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  sortBy: "location",
  locationFilter: null,
  expiryFilter: "all",
  inputValue: "",
  searchQuery: "",
  setSortBy: (sortBy) => set({ sortBy }),
  setLocationFilter: (locationFilter) => set({ locationFilter }),
  setExpiryFilter: (expiryFilter) => set({ expiryFilter }),
  setInputValue: (inputValue) => set({ inputValue }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
