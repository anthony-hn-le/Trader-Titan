import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/game/types";

interface LeaderboardProps {
  players: Player[];
  final?: boolean;
  onContinue?: () => void;
  continueLabel?: string;
}

function pnlClass(value: number): string {
  return value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
}

function formatPnl(value: number): string {
  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value >= 0 ? `+${formatted}` : formatted;
}

export function Leaderboard({ players, final = false, onContinue, continueLabel = "Continue" }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.pnl - a.pnl);

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-medium">{final ? "Final leaderboard" : "Leaderboard"}</h3>
      <div className="flex w-full max-w-md flex-col gap-2">
        <div className="grid grid-cols-[1.5rem_1fr_6rem_6rem] gap-x-4 px-3 text-xs font-medium text-muted-foreground">
          <span />
          <span>Name</span>
          <span className="text-right">Round P&amp;L</span>
          <span className="text-right">Total P&amp;L</span>
        </div>
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`grid grid-cols-[1.5rem_1fr_6rem_6rem] items-center gap-x-4 rounded-lg px-3 py-2 ${i === 0 ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/50"}`}
          >
            <span className="text-sm font-medium text-muted-foreground">{i + 1}.</span>
            <span className="text-sm font-medium">{p.name}</span>
            <span className={`text-sm tabular-nums text-right whitespace-nowrap ${pnlClass(p.lastRoundPnl)}`}>
              {formatPnl(p.lastRoundPnl)}
            </span>
            <span className="text-sm tabular-nums text-right whitespace-nowrap">
              {p.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
      {onContinue && <Button onClick={onContinue}>{continueLabel}</Button>}
    </div>
  );
}
