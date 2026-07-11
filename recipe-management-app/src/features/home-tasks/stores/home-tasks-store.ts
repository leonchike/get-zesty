import { create } from "zustand";
import type { HomeTaskView } from "@/features/home-tasks/types";

interface HomeTasksStore {
  viewFilter: HomeTaskView;
  setViewFilter: (view: HomeTaskView) => void;
  memberFilter: string | null;
  setMemberFilter: (memberId: string | null) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
}

export const useHomeTasksStore = create<HomeTasksStore>((set) => ({
  viewFilter: "all",
  setViewFilter: (viewFilter) => set({ viewFilter }),
  memberFilter: null,
  setMemberFilter: (memberFilter) => set({ memberFilter }),
  inputValue: "",
  setInputValue: (inputValue) => set({ inputValue }),
  editingTaskId: null,
  setEditingTaskId: (editingTaskId) => set({ editingTaskId }),
}));
