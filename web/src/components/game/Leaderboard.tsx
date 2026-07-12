import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/game/types";

interface LeaderboardProps {
  players: Player[];
  final?: boolean;
  onContinue?: () => void;
  continueLabel?: string;
}

export function Leaderboard({ players, final = false, onContinue, continueLabel = "Continue" }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.pnl - a.pnl);

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-medium">{final ? "Final leaderboard" : "Leaderboard"}</h3>
      <div className="flex w-full max-w-sm flex-col gap-2">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 ${i === 0 ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/50"}`}
          >
            <span className="text-sm font-medium">
              {i + 1}. {p.name}
            </span>
            <span className="text-sm tabular-nums">{p.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
      {onContinue && <Button onClick={onContinue}>{continueLabel}</Button>}
    </div>
  );
}
