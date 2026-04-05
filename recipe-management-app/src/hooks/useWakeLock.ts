"use client";

import { useState, useEffect } from "react";

type WakeLockType = "screen";

interface UseWakeLockResult {
  isSupported: boolean;
  isActive: boolean;
  error: Error | null;
  request: (type: WakeLockType) => Promise<void>;
  release: () => Promise<void>;
}

export function useWakeLock(): UseWakeLockResult {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsSupported("wakeLock" in navigator);
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        await request("screen");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSupported, wakeLock]);

  const request = async (type: WakeLockType) => {
    if (!isSupported) {
      setError(new Error("Wake Lock is not supported in this browser."));
      return;
    }

    try {
      const newWakeLock = await navigator.wakeLock.request(type);
      setWakeLock(newWakeLock);
      setIsActive(true);
      setError(null);

      newWakeLock.addEventListener("release", () => {
        setIsActive(false);
        setWakeLock(null);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to request wake lock")
      );
      setIsActive(false);
    }
  };

  const release = async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setIsActive(false);
        setWakeLock(null);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to release wake lock")
        );
      }
    }
  };

  return { isSupported, isActive, error, request, release };
}
