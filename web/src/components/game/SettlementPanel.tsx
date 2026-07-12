import { Button } from "@/components/ui/button";

interface SettlementPanelProps {
  trueAnswer: number;
  onContinue: () => void;
}

export function SettlementPanel({ trueAnswer, onContinue }: SettlementPanelProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">The true answer was</p>
      <p className="text-3xl font-semibold tabular-nums">{trueAnswer.toLocaleString()}</p>
      <Button onClick={onContinue}>See round results</Button>
    </div>
  );
}
