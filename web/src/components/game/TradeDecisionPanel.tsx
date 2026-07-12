"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MarketState, TradeAction } from "@/lib/game/types";

interface TradeDecisionPanelProps {
  market: MarketState;
  onDecide: (action: TradeAction, size: number) => void;
}

export function TradeDecisionPanel({ market, onDecide }: TradeDecisionPanelProps) {
  const maxSize = Math.max(market.bidSize, market.askSize, 1);
  const [size, setSize] = useState(1);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">Buy at the ask, sell at the bid, or pass.</p>
      <p className="text-xs text-muted-foreground">
        Ask depth: {market.askSize} · Bid depth: {market.bidSize}
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={maxSize}
          value={size}
          onChange={(e) => setSize(Math.max(1, Math.min(maxSize, Number(e.target.value) || 1)))}
          className="w-20 text-center"
          aria-label="Order size"
        />
        <Button size="sm" variant="ghost" onClick={() => setSize(1)}>
          1
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSize(maxSize)}>
          Max
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="default" onClick={() => onDecide("buy", size)}>
          Buy
        </Button>
        <Button variant="destructive" onClick={() => onDecide("sell", size)}>
          Sell
        </Button>
        <Button variant="outline" onClick={() => onDecide("pass", 0)}>
          Pass
        </Button>
      </div>
    </div>
  );
}
