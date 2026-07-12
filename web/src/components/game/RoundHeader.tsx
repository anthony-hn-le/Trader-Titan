import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShrinkingBorderTimer } from "./ShrinkingBorderTimer";

interface RoundHeaderProps {
  roundNum: number;
  totalRounds: number;
  question: string;
  clue: string | null;
  timerEndsAt?: number | null;
  timerTotalMs?: number;
}

export function RoundHeader({
  roundNum,
  totalRounds,
  question,
  clue,
  timerEndsAt = null,
  timerTotalMs = 0,
}: RoundHeaderProps) {
  return (
    <Card className="relative w-full max-w-2xl overflow-hidden">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <Badge variant="secondary">
          Round {roundNum} / {totalRounds}
        </Badge>
        <h2 className="max-w-2xl font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{question}</h2>
        {clue && <p className="max-w-xl text-sm text-muted-foreground">Clue: {clue}</p>}
      </CardContent>
      {timerEndsAt !== null && <ShrinkingBorderTimer endsAt={timerEndsAt} totalMs={timerTotalMs} />}
    </Card>
  );
}
