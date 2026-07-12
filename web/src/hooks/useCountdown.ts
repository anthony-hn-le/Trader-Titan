"use client";

import { useEffect, useState } from "react";

export function useCountdown(endsAt: number): number {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, endsAt - Date.now()));
    }, 100);
    return () => clearInterval(id);
  }, [endsAt]);

  return remainingMs;
}
