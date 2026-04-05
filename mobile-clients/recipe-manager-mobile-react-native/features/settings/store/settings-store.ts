import { create } from "zustand";

export interface SettingsStore {
  settingsState:
    | "settingsHome"
    | "settingsProfile"
    | "settingsSecurity"
    | "settingsDeactivate";
  setSettingsState: (
    state:
      | "settingsHome"
      | "settingsProfile"
      | "settingsSecurity"
      | "settingsDeactivate"
  ) => void;
}

const initialState: Pick<SettingsStore, "settingsState"> = {
  settingsState: "settingsHome",
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...initialState,
  setSettingsState: (state) => set({ settingsState: state }),
}));
