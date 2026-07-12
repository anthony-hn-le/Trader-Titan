"use client";

import { useEffect, useState } from "react";

interface CountdownRingProps {
  endsAt: number;
  totalMs: number;
}

export function CountdownRing({ endsAt, totalMs }: CountdownRingProps) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, endsAt - Date.now()));
    }, 100);
    return () => clearInterval(id);
  }, [endsAt]);

  const fraction = totalMs > 0 ? remainingMs / totalMs : 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = fraction < 0.3;

  const size = 56;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`fill-none transition-[stroke-dashoffset] duration-100 ${urgent ? "stroke-destructive" : "stroke-primary"}`}
        />
      </svg>
      <span className={`absolute text-sm font-semibold tabular-nums ${urgent ? "text-destructive" : ""}`}>
        {seconds}
      </span>
    </div>
  );
}
