"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuoteInput } from "@/lib/game/types";

export function MarketQuotePanel({
  winningSpread,
  onSubmit,
}: {
  winningSpread: number;
  onSubmit: (quote: QuoteInput) => void;
}) {
  const [bid, setBid] = useState("100");
  const [bidSize, setBidSize] = useState("2");
  const [askSize, setAskSize] = useState("2");

  const bidNum = Math.trunc(Number(bid)) || 0;
  const ask = bidNum + winningSpread;

  const submit = () => {
    const bidSizeNum = Math.max(1, Math.trunc(Number(bidSize)) || 1);
    const askSizeNum = Math.max(1, Math.trunc(Number(askSize)) || 1);
    onSubmit({ bid: bidNum, bidSize: bidSizeNum, askSize: askSizeNum });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        You won market maker rights with a spread of {winningSpread}. Set your bid price — the ask is forced to bid +{" "}
        {winningSpread}.
      </p>
      <div className="flex flex-wrap items-end justify-center gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Bid price
          <Input type="number" value={bid} onChange={(e) => setBid(e.target.value)} className="w-28" />
        </label>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          Ask price
          <div className="flex h-8 w-28 items-center justify-center rounded-lg bg-muted text-sm">{ask}</div>
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Bid size
          <Input type="number" min={1} value={bidSize} onChange={(e) => setBidSize(e.target.value)} className="w-20" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Ask size
          <Input type="number" min={1} value={askSize} onChange={(e) => setAskSize(e.target.value)} className="w-20" />
        </label>
      </div>
      <Button onClick={submit}>Post market</Button>
    </div>
  );
}
