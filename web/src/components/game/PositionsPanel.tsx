import type { Player, PlayerId } from "@/lib/game/types";

interface PositionsPanelProps {
  players: Player[];
  marketMakerId: PlayerId | null;
}

export function PositionsPanel({ players, marketMakerId }: PositionsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {players.map((p) => (
        <div key={p.id} className="flex flex-col gap-0.5 rounded-lg bg-muted/50 p-2 text-center">
          <span className="text-xs font-medium">
            {p.name}
            {p.id === marketMakerId && <span className="ml-1 text-muted-foreground">(MM)</span>}
          </span>
          <span className="text-xs text-muted-foreground">Inv {p.inventory}</span>
          <span className="text-xs text-muted-foreground">Cash {p.cash.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
