import { Button } from "@/components/ui/button";
import type { TradeAction } from "@/lib/game/types";

export function TradeDecisionPanel({ onDecide }: { onDecide: (action: TradeAction) => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">Buy at the ask, sell at the bid, or pass.</p>
      <div className="flex gap-3">
        <Button variant="default" onClick={() => onDecide("buy")}>
          Buy
        </Button>
        <Button variant="destructive" onClick={() => onDecide("sell")}>
          Sell
        </Button>
        <Button variant="outline" onClick={() => onDecide("pass")}>
          Pass
        </Button>
      </div>
    </div>
  );
}
