"use client";

import { useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadRecentGames } from "@/lib/game/recentGames";

const noopSubscribe = () => () => {};

export function RecentGames() {
  // Server and first client render must match; only read localStorage after mount.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;

  const games = loadRecentGames();
  if (games.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent games</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {games.map((game) => (
          <div key={game.completedAt} className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{new Date(game.completedAt).toLocaleString()}</p>
            <div className="flex flex-wrap gap-2">
              {game.standings.map((s, i) => (
                <Badge key={s.name} variant={i === 0 ? "default" : "secondary"}>
                  {s.name}: {s.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
