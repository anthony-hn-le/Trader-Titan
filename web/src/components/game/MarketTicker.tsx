import type { MarketState } from "@/lib/game/types";

export function MarketTicker({ market }: { market: MarketState }) {
  return (
    <div className="flex items-center justify-center gap-4 rounded-lg bg-muted/50 px-4 py-3 font-mono text-lg tabular-nums">
      <span>
        <span className="text-muted-foreground">Bid</span> {market.bid}
      </span>
      <span className="text-muted-foreground">at</span>
      <span>
        <span className="text-muted-foreground">Ask</span> {market.ask}
      </span>
      <span className="mx-2 text-muted-foreground">|</span>
      <span>
        {market.bidSize} <span className="text-muted-foreground">by</span> {market.askSize}
      </span>
    </div>
  );
}
