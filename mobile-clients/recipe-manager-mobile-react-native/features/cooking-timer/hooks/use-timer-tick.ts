import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useCookingTimerStore } from "../stores/cooking-timer-store";
import {
  scheduleTimerNotification,
  cancelTimerNotification,
  cancelAllTimerNotifications,
} from "../lib/timer-notifications";

export function useTimerTick() {
  const tick = useCookingTimerStore((s) => s.tick);
  const getTimer = useCookingTimerStore((s) => s.getTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Tick interval — runs every second while app is active
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const completedIds = tick();

      for (const id of completedIds) {
        const timer = getTimer(id);
        if (timer) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          Alert.alert("Timer done!", `${timer.label} — ${timer.recipeName}`);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tick, getTimer]);

  // Handle app state changes — drift-correct on foreground, schedule notifications on background
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // Returning to foreground — drift-correct all running timers
          cancelAllTimerNotifications();

          const state = useCookingTimerStore.getState();
          const now = Date.now();

          for (const [id, timer] of Object.entries(state.timers)) {
            if (timer.status === "running" && timer.lastTickAt) {
              const elapsed = Math.floor((now - timer.lastTickAt) / 1000);
              if (elapsed > 1) {
                const newRemaining = timer.remainingSeconds - elapsed;
                if (newRemaining <= 0) {
                  useCookingTimerStore.setState((s) => ({
                    timers: {
                      ...s.timers,
                      [id]: {
                        ...timer,
                        remainingSeconds: 0,
                        status: "completed",
                        lastTickAt: now,
                      },
                    },
                  }));

                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                  Alert.alert(
                    "Timer done!",
                    `${timer.label} — ${timer.recipeName}`
                  );
                } else {
                  useCookingTimerStore.setState((s) => ({
                    timers: {
                      ...s.timers,
                      [id]: {
                        ...timer,
                        remainingSeconds: newRemaining,
                        lastTickAt: now,
                      },
                    },
                  }));
                }
              }
            }
          }
        } else if (nextAppState.match(/inactive|background/)) {
          // Going to background — schedule notifications for running timers
          const state = useCookingTimerStore.getState();
          for (const timer of Object.values(state.timers)) {
            if (timer.status === "running" && timer.remainingSeconds > 0) {
              scheduleTimerNotification(timer);
            }
          }
        }

        appStateRef.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
