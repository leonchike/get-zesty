"use client";

import { useTimerTick } from "@/hooks/useTimerTick";

export function TimerTickProvider() {
  useTimerTick();
  return null;
}
