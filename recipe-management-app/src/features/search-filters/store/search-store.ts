// src/lib/stores/search-store.ts

import { create } from "zustand";

interface SearchState {
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  globalSearch: "",
  setGlobalSearch: (search) => set({ globalSearch: search }),
}));
