import { create } from "zustand";
import type { HomeTask, HomeTaskView } from "@/features/home-tasks/types";

interface HomeTaskStore {
  viewFilter: HomeTaskView;
  setViewFilter: (view: HomeTaskView) => void;
  memberFilter: string | null;
  setMemberFilter: (memberId: string | null) => void;
  editingTask: HomeTask | null;
  setEditingTask: (task: HomeTask | null) => void;
  isAddModalVisible: boolean;
  setIsAddModalVisible: (visible: boolean) => void;
}

export const useHomeTaskStore = create<HomeTaskStore>((set) => ({
  viewFilter: "all",
  setViewFilter: (viewFilter) => set({ viewFilter }),
  memberFilter: null,
  setMemberFilter: (memberFilter) => set({ memberFilter }),
  editingTask: null,
  setEditingTask: (editingTask) => set({ editingTask }),
  isAddModalVisible: false,
  setIsAddModalVisible: (isAddModalVisible) => set({ isAddModalVisible }),
}));
