import { create } from "zustand";

interface GroceryStore {
  sortBy: string;
  inputValue: string;
  setSortBy: (sortBy: string) => void;
  setInputValue: (inputValue: string) => void;
}

export const useGroceryStore = create<GroceryStore>((set) => ({
  sortBy: "section",
  inputValue: "",
  setSortBy: (sortBy) => set({ sortBy }),
  setInputValue: (inputValue) => set({ inputValue }),
}));
