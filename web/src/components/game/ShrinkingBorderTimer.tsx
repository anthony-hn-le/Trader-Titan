"use client";

import { useCountdown } from "@/hooks/useCountdown";

interface ShrinkingBorderTimerProps {
  endsAt: number;
  totalMs: number;
}

export function ShrinkingBorderTimer({ endsAt, totalMs }: ShrinkingBorderTimerProps) {
  const remainingMs = useCountdown(endsAt);
  const fraction = totalMs > 0 ? remainingMs / totalMs : 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden">
      <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: `${fraction * 50}%` }} />
      <div className="absolute right-0 top-0 h-full bg-primary" style={{ width: `${fraction * 50}%` }} />
    </div>
  );
}
