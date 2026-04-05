"use client";

import React, { useEffect } from "react";
import { useCookingTimerStore, CookingTimer } from "@/lib/stores/cooking-timer-store";
import { formatTimerDisplay } from "@/lib/functions/format-timer-display";
import { Play, Pause, X } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";

interface SidebarTimersProps {
  isMobile?: boolean;
  closeSheet?: () => void;
}

export function SidebarTimers({ isMobile, closeSheet }: SidebarTimersProps) {
  const timers = useCookingTimerStore((s) => s.timers);
  const pauseTimer = useCookingTimerStore((s) => s.pauseTimer);
  const resumeTimer = useCookingTimerStore((s) => s.resumeTimer);
  const startTimer = useCookingTimerStore((s) => s.startTimer);
  const removeTimer = useCookingTimerStore((s) => s.removeTimer);

  const activeTimers = Object.values(timers).filter(
    (t) => t.status === "running" || t.status === "paused" || t.status === "completed"
  );

  // Auto-remove completed timers after 10s
  useEffect(() => {
    const completedTimers = activeTimers.filter((t) => t.status === "completed");
    if (completedTimers.length === 0) return;

    const timeouts = completedTimers.map((t) =>
      setTimeout(() => removeTimer(t.id), 10000)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [activeTimers.map((t) => `${t.id}-${t.status}`).join(",")]);

  if (activeTimers.length === 0) return null;

  const handlePlayPause = (timer: CookingTimer) => {
    if (timer.status === "running") {
      pauseTimer(timer.id);
    } else if (timer.status === "paused") {
      resumeTimer(timer.id);
    } else if (timer.status === "completed") {
      startTimer({
        id: timer.id,
        recipeId: timer.recipeId,
        recipeName: timer.recipeName,
        stepIndex: timer.stepIndex,
        label: timer.label,
        totalSeconds: timer.totalSeconds,
      });
    }
  };

  return (
    <div className="mt-8 md:mt-12 px-2">
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Active Timers
        </div>
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {activeTimers.map((timer) => (
              <m.div
                key={timer.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => handlePlayPause(timer)}
                  className="flex-shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    timer.status === "running" ? "Pause timer" : "Resume timer"
                  }
                >
                  {timer.status === "running" ? (
                    <Pause size={12} />
                  ) : (
                    <Play size={12} />
                  )}
                </button>

                <span className="truncate flex-1 text-foreground/80">
                  {timer.recipeName}
                </span>

                <span
                  className={`flex-shrink-0 font-mono text-xs ${
                    timer.status === "completed"
                      ? "text-green-500"
                      : timer.status === "running"
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  {timer.status === "completed"
                    ? "Done!"
                    : formatTimerDisplay(timer.remainingSeconds)}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTimer(timer.id);
                  }}
                  className="flex-shrink-0 p-0.5 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss timer"
                >
                  <X size={12} />
                </button>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
