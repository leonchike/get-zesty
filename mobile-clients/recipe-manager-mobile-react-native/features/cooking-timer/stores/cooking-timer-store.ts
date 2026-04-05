import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CookingTimer {
  id: string;
  recipeId: string;
  recipeName: string;
  stepIndex: number;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  status: "idle" | "running" | "paused" | "completed";
  createdAt: number;
  lastTickAt: number;
}

interface CookingTimerState {
  timers: Record<string, CookingTimer>;
  startTimer: (
    timer: Omit<
      CookingTimer,
      "status" | "remainingSeconds" | "createdAt" | "lastTickAt"
    >
  ) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  removeTimer: (id: string) => void;
  tick: () => string[];
  getTimer: (id: string) => CookingTimer | undefined;
  getActiveTimers: () => CookingTimer[];
}

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export const useCookingTimerStore = create(
  persist<CookingTimerState>(
    (set, get) => ({
      timers: {},

      startTimer: (timer) =>
        set((state) => {
          const existing = state.timers[timer.id];

          // If running, no-op
          if (existing?.status === "running") return state;

          // If paused, resume
          if (existing?.status === "paused") {
            return {
              timers: {
                ...state.timers,
                [timer.id]: {
                  ...existing,
                  status: "running",
                  lastTickAt: Date.now(),
                },
              },
            };
          }

          // Idle, completed, or new — (re)start
          const now = Date.now();
          return {
            timers: {
              ...state.timers,
              [timer.id]: {
                ...timer,
                remainingSeconds: timer.totalSeconds,
                status: "running",
                createdAt: existing?.createdAt ?? now,
                lastTickAt: now,
              },
            },
          };
        }),

      pauseTimer: (id) =>
        set((state) => {
          const timer = state.timers[id];
          if (!timer || timer.status !== "running") return state;
          return {
            timers: {
              ...state.timers,
              [id]: { ...timer, status: "paused" },
            },
          };
        }),

      resumeTimer: (id) =>
        set((state) => {
          const timer = state.timers[id];
          if (!timer || timer.status !== "paused") return state;
          return {
            timers: {
              ...state.timers,
              [id]: { ...timer, status: "running", lastTickAt: Date.now() },
            },
          };
        }),

      resetTimer: (id) =>
        set((state) => {
          const timer = state.timers[id];
          if (!timer) return state;
          return {
            timers: {
              ...state.timers,
              [id]: {
                ...timer,
                remainingSeconds: timer.totalSeconds,
                status: "idle",
                lastTickAt: Date.now(),
              },
            },
          };
        }),

      removeTimer: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.timers;
          return { timers: rest };
        }),

      tick: () => {
        const completedIds: string[] = [];
        const now = Date.now();

        set((state) => {
          const updated = { ...state.timers };
          let changed = false;

          for (const [id, timer] of Object.entries(updated)) {
            if (timer.status !== "running") continue;

            const newRemaining = timer.remainingSeconds - 1;
            changed = true;

            if (newRemaining <= 0) {
              updated[id] = {
                ...timer,
                remainingSeconds: 0,
                status: "completed",
                lastTickAt: now,
              };
              completedIds.push(id);
            } else {
              updated[id] = {
                ...timer,
                remainingSeconds: newRemaining,
                lastTickAt: now,
              };
            }
          }

          return changed ? { timers: updated } : state;
        });

        return completedIds;
      },

      getTimer: (id) => get().timers[id],

      getActiveTimers: () =>
        Object.values(get().timers).filter(
          (t) =>
            t.status === "running" ||
            t.status === "paused" ||
            t.status === "completed"
        ),
    }),
    {
      name: "cooking-timer-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const now = Date.now();
        const updated = { ...state.timers };
        let changed = false;

        for (const [id, timer] of Object.entries(updated)) {
          // Prune completed timers older than 24h
          if (
            timer.status === "completed" &&
            now - timer.lastTickAt > ONE_DAY_IN_MS
          ) {
            delete updated[id];
            changed = true;
            continue;
          }

          // Drift-correct running timers
          if (timer.status === "running" && timer.lastTickAt) {
            const elapsed = Math.floor((now - timer.lastTickAt) / 1000);
            const newRemaining = timer.remainingSeconds - elapsed;

            if (newRemaining <= 0) {
              updated[id] = {
                ...timer,
                remainingSeconds: 0,
                status: "completed",
                lastTickAt: now,
              };
            } else {
              updated[id] = {
                ...timer,
                remainingSeconds: newRemaining,
                lastTickAt: now,
              };
            }
            changed = true;
          }
        }

        if (changed) {
          state.timers = updated;
        }
      },
    }
  )
);
