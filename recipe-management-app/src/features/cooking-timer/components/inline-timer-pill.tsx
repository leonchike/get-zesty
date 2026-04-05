"use client";

import React, { useEffect, useRef } from "react";
import { useCookingTimerStore } from "@/lib/stores/cooking-timer-store";
import { formatTimerDisplay } from "@/lib/functions/format-timer-display";
import { Play, Pause, Check } from "lucide-react";
import { m } from "framer-motion";

interface InlineTimerPillProps {
  timerId: string;
  recipeId: string;
  recipeName: string;
  stepIndex: number;
  matchIndex: number;
  label: string;
  totalSeconds: number;
  variant: "light" | "dark";
}

export function InlineTimerPill({
  timerId,
  recipeId,
  recipeName,
  stepIndex,
  label,
  totalSeconds,
  variant,
}: InlineTimerPillProps) {
  const timer = useCookingTimerStore((s) => s.timers[timerId]);
  const startTimer = useCookingTimerStore((s) => s.startTimer);
  const pauseTimer = useCookingTimerStore((s) => s.pauseTimer);
  const resetTimer = useCookingTimerStore((s) => s.resetTimer);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = timer?.status ?? "idle";
  const remaining = timer?.remainingSeconds ?? totalSeconds;

  // Auto-reset completed timers after 3s
  useEffect(() => {
    if (status === "completed") {
      resetTimeoutRef.current = setTimeout(() => {
        resetTimer(timerId);
      }, 3000);
    }
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [status, timerId, resetTimer]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (status === "running") {
      pauseTimer(timerId);
    } else {
      startTimer({
        id: timerId,
        recipeId,
        recipeName,
        stepIndex,
        label,
        totalSeconds,
      });
    }
  };

  const Icon =
    status === "completed" ? Check : status === "running" ? Pause : Play;
  const iconSize = variant === "dark" ? 14 : 12;
  const display = formatTimerDisplay(
    status === "idle" ? totalSeconds : remaining
  );

  const idleStyles =
    variant === "light"
      ? "bg-foreground/10 text-foreground"
      : "bg-[#EDE8E2]/15 text-[#EDE8E2]";

  const statusStyles =
    status === "running"
      ? "bg-primary text-primary-foreground"
      : status === "paused"
        ? variant === "light"
          ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
          : "bg-amber-500/25 text-amber-300"
        : status === "completed"
          ? variant === "light"
            ? "bg-green-500/20 text-green-700 dark:text-green-400"
            : "bg-green-500/25 text-green-300"
          : idleStyles;

  const sizeStyles =
    variant === "light"
      ? "px-2.5 py-0.5 text-xs gap-1.5"
      : "px-3 py-1 text-sm gap-1.5";

  return (
    <m.button
      type="button"
      onClick={handleClick}
      className={`rounded-full inline-flex items-center cursor-pointer select-none font-mono ${statusStyles} ${sizeStyles}`}
      animate={
        status === "running"
          ? {
              scale: [1, 1.03, 1],
              transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }
          : { scale: 1 }
      }
      whileTap={{ scale: 0.95 }}
    >
      <Icon size={iconSize} />
      <span>{display}</span>
    </m.button>
  );
}
