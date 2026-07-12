"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SpreadBidPanel({ onSubmit }: { onSubmit: (spread: number) => void }) {
  const [value, setValue] = useState("10");

  const submit = () => {
    const parsed = Math.max(0, Math.trunc(Number(value)));
    onSubmit(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        Bid your desired spread width. Lowest spread wins the right to make the market.
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-32 text-center"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button onClick={submit}>Submit bid</Button>
      </div>
    </div>
  );
}
