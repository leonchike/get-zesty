import React, { useState, useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCookingTimerStore } from "../stores/cooking-timer-store";
import useUIStore from "@/stores/global-ui-store";
import { useDeviceType } from "@/hooks/useDeviceType";
import { CollapsedTimerPill } from "./collapsed-timer-pill";
import { ExpandedTimersPanel } from "./expanded-timers-panel";

// Approximate pill nav height: py-4 (16) * 2 + icon 32 = 64 phone, py-6 (24) * 2 + icon 36 = 84 iPad
const NAV_PILL_HEIGHT_PHONE = 56;
const NAV_PILL_HEIGHT_IPAD = 70;

export default function GlobalTimersIndicator() {
  const timers = useCookingTimerStore((s) => s.timers);
  const isCookingExperienceModalVisible = useUIStore(
    (s) => s.isCookingExperienceModalVisible
  );
  const { isIpad } = useDeviceType();
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);

  // Collapse when cooking experience opens
  useEffect(() => {
    if (isCookingExperienceModalVisible) {
      setIsExpanded(false);
    }
  }, [isCookingExperienceModalVisible]);

  const activeTimers = useMemo(
    () =>
      Object.values(timers).filter(
        (t) =>
          t.status === "running" ||
          t.status === "paused" ||
          t.status === "completed"
      ),
    [timers]
  );

  const nearestTimer = useMemo(() => {
    const running = activeTimers
      .filter((t) => t.status === "running")
      .sort((a, b) => a.remainingSeconds - b.remainingSeconds);
    if (running.length > 0) return running[0];

    const paused = activeTimers.filter((t) => t.status === "paused");
    if (paused.length > 0) return paused[0];

    const completed = activeTimers.filter((t) => t.status === "completed");
    return completed[0] ?? null;
  }, [activeTimers]);

  if (
    activeTimers.length === 0 ||
    isCookingExperienceModalVisible ||
    !nearestTimer
  ) {
    return null;
  }

  const navPillHeight = isIpad() ? NAV_PILL_HEIGHT_IPAD : NAV_PILL_HEIGHT_PHONE;
  const bottomOffset = Math.max(insets.bottom, 30) + navPillHeight + 8;

  return (
    <View
      className="absolute bottom-0 left-0 right-0 items-center"
      style={{ paddingBottom: bottomOffset }}
      pointerEvents="box-none"
    >
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(200)}
      >
        {isExpanded ? (
          <ExpandedTimersPanel
            timers={activeTimers}
            onCollapse={() => setIsExpanded(false)}
          />
        ) : (
          <CollapsedTimerPill
            nearestTimer={nearestTimer}
            additionalCount={activeTimers.length - 1}
            onPress={() => setIsExpanded(true)}
          />
        )}
      </Animated.View>
    </View>
  );
}
