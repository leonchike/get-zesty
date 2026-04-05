"use client";

import { useEffect, useRef } from "react";
import { useCookingTimerStore } from "@/lib/stores/cooking-timer-store";
import { toast } from "sonner";

function playCompletionChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.value = 523.25; // C5
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.value = 659.25; // E5
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);

    // Cleanup
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Silently ignore autoplay restrictions
  }
}

export function useTimerTick() {
  const tick = useCookingTimerStore((s) => s.tick);
  const getTimer = useCookingTimerStore((s) => s.getTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const completedIds = tick();

      for (const id of completedIds) {
        const timer = getTimer(id);
        if (timer) {
          toast.success(`Timer done: ${timer.label}`, {
            description: timer.recipeName,
            duration: 8000,
          });
          playCompletionChime();
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tick, getTimer]);

  // Handle tab visibility — drift-correct on refocus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // On tab refocus, the store rehydration handles drift correction
        // But for already-hydrated stores, we need manual correction
        const state = useCookingTimerStore.getState();
        const now = Date.now();

        for (const [id, timer] of Object.entries(state.timers)) {
          if (timer.status === "running" && timer.lastTickAt) {
            const elapsed = Math.floor((now - timer.lastTickAt) / 1000);
            if (elapsed > 1) {
              const newRemaining = timer.remainingSeconds - elapsed;
              if (newRemaining <= 0) {
                // Timer completed while tab was hidden
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

                toast.success(`Timer done: ${timer.label}`, {
                  description: timer.recipeName,
                  duration: 8000,
                });
                playCompletionChime();
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
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);
}
