"use client";

import { useEffect, useState } from "react";
import { MINING_LIVE_TICK_MS } from "./presentation";

export function useMiningPresentationClock(): number | null {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, MINING_LIVE_TICK_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") setNowMs(Date.now());
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return nowMs;
}
