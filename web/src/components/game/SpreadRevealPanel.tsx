import { Button } from "@/components/ui/button";
import type { Player, PlayerId } from "@/lib/game/types";

interface SpreadRevealPanelProps {
  players: Player[];
  spreadBids: Partial<Record<PlayerId, number>>;
  marketMakerId: PlayerId | null;
  onContinue: () => void;
}

export function SpreadRevealPanel({ players, spreadBids, marketMakerId, onContinue }: SpreadRevealPanelProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {players.map((p) => (
          <div
            key={p.id}
            className={`rounded-lg p-2 text-center ${p.id === marketMakerId ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/50"}`}
          >
            <p className="text-xs font-medium">{p.name}</p>
            <p className="text-sm">{spreadBids[p.id]}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {players.find((p) => p.id === marketMakerId)?.name} wins the right to quote the market.
      </p>
      <Button onClick={onContinue}>Continue</Button>
    </div>
  );
}
