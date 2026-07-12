"use client";

import { useEffect, useRef } from "react";
import type { ActivityEntry } from "@/lib/game/types";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  return (
    <div className="flex h-48 flex-col gap-1 overflow-y-auto rounded-lg bg-muted/30 p-3 font-mono text-xs">
      {entries.length === 0 && <p className="text-muted-foreground">Round activity will appear here...</p>}
      {entries.map((entry) => (
        <p key={entry.id} className="text-muted-foreground">
          {entry.text}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
