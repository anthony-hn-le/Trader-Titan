/** Ported from TraderTitanGame.play_round's settlement phase: round_pnl = cash + inventory * true_answer. */
export function computeRoundPnl(cash: number, inventory: number, trueAnswer: number): number {
  return cash + inventory * trueAnswer;
}
