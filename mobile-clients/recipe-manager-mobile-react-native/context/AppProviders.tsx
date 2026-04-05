import React from "react";
import { GlobalUIProvider } from "@/context/GlobalModalProvider";
import TimerTickProvider from "@/features/cooking-timer/components/timer-tick-provider";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalUIProvider>
      <TimerTickProvider />
      <>{children}</>
    </GlobalUIProvider>
  );
}
