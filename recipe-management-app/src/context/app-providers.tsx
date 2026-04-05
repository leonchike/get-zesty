"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import ReactQueryProvider from "@/context/react-query-provider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GroceryProvider } from "@/features/groceries/providers/grocery-provider";
import MotionProvider from "@/components/motion/motion-provider";
import { TimerTickProvider } from "@/features/cooking-timer/components/timer-tick-provider";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <SessionProvider>
      <ReactQueryProvider>
        <MotionProvider>
          <TooltipProvider>
            <GroceryProvider>
              {children}
              <TimerTickProvider />
              <Toaster />
            </GroceryProvider>
          </TooltipProvider>
        </MotionProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
