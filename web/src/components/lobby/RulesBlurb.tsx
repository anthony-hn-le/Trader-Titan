import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RULES = [
  {
    title: "1. Bid a spread",
    body: "Every round starts with a trivia question. All 4 players (you + 3 bots) blind-bid how tight a spread they're willing to quote. Lowest spread wins the right to make the market.",
  },
  {
    title: "2. Make or take the market",
    body: "The winner quotes a bid/ask and sizes. Everyone else can buy, sell, or pass against that market — twice: once before a clue is revealed, once after.",
  },
  {
    title: "3. Settle up",
    body: "The true answer is revealed. Your P&L for the round is cash + inventory x true answer. Over 5 rounds, whoever has the highest total P&L wins.",
  },
];

export function RulesBlurb() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to play</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {RULES.map((rule) => (
          <div key={rule.title}>
            <p className="text-sm font-medium">{rule.title}</p>
            <p className="text-sm text-muted-foreground">{rule.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
