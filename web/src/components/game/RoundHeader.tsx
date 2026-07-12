import { Badge } from "@/components/ui/badge";

interface RoundHeaderProps {
  roundNum: number;
  totalRounds: number;
  question: string;
  clue: string | null;
}

export function RoundHeader({ roundNum, totalRounds, question, clue }: RoundHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Badge variant="secondary">
        Round {roundNum} / {totalRounds}
      </Badge>
      <h2 className="max-w-2xl text-xl font-medium">{question}</h2>
      {clue && <p className="max-w-xl text-sm text-muted-foreground">Clue: {clue}</p>}
    </div>
  );
}
