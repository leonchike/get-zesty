import { create } from "zustand";

interface InventoryStore {
  sortBy: "location" | "expiry" | "name";
  locationFilter: string | null;
  inputValue: string;
  searchQuery: string;
  setSortBy: (sortBy: "location" | "expiry" | "name") => void;
  setLocationFilter: (locationId: string | null) => void;
  setInputValue: (inputValue: string) => void;
  setSearchQuery: (searchQuery: string) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  sortBy: "location",
  locationFilter: null,
  inputValue: "",
  searchQuery: "",
  setSortBy: (sortBy) => set({ sortBy }),
  setLocationFilter: (locationFilter) => set({ locationFilter }),
  setInputValue: (inputValue) => set({ inputValue }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
