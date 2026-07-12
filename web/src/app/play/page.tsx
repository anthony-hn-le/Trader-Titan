"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUND_INTRO_MS, useGameStore } from "@/stores/gameStore";
import { saveRecentGame } from "@/lib/game/recentGames";
import { RoundHeader } from "@/components/game/RoundHeader";
import { CountdownRing } from "@/components/game/CountdownRing";
import { MarketTicker } from "@/components/game/MarketTicker";
import { ActivityFeed } from "@/components/game/ActivityFeed";
import { PositionsPanel } from "@/components/game/PositionsPanel";
import { SpreadBidPanel } from "@/components/game/SpreadBidPanel";
import { SpreadRevealPanel } from "@/components/game/SpreadRevealPanel";
import { MarketQuotePanel } from "@/components/game/MarketQuotePanel";
import { TradeDecisionPanel } from "@/components/game/TradeDecisionPanel";
import { RequotePanel } from "@/components/game/RequotePanel";
import { SettlementPanel } from "@/components/game/SettlementPanel";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";

const BOT_BEAT_MS = 1600;
const BOT_TURN_DELAY_MS = 550;

const CLUE_VISIBLE_PHASES = new Set(["clue-reveal", "requote", "trading-2", "settlement", "round-leaderboard"]);
const CHROME_HIDDEN_PHASES = new Set(["round-intro", "round-leaderboard", "game-over"]);

export default function PlayPage() {
  const router = useRouter();

  const phase = useGameStore((s) => s.phase);
  const roundNum = useGameStore((s) => s.roundNum);
  const questions = useGameStore((s) => s.questions);
  const players = useGameStore((s) => s.players);
  const marketMakerId = useGameStore((s) => s.marketMakerId);
  const winningSpread = useGameStore((s) => s.winningSpread);
  const market = useGameStore((s) => s.market);
  const spreadBids = useGameStore((s) => s.spreadBids);
  const activityLog = useGameStore((s) => s.activityLog);
  const tradeTurnOrder = useGameStore((s) => s.tradeTurnOrder);
  const tradeTurnIndex = useGameStore((s) => s.tradeTurnIndex);
  const actionEndsAt = useGameStore((s) => s.actionEndsAt);
  const timerMs = useGameStore((s) => s.timerMs);

  const submitSpreadBid = useGameStore((s) => s.submitSpreadBid);
  const proceedToQuoting = useGameStore((s) => s.proceedToQuoting);
  const submitMarketQuote = useGameStore((s) => s.submitMarketQuote);
  const enterTrading1 = useGameStore((s) => s.enterTrading1);
  const processTradingTurn = useGameStore((s) => s.processTradingTurn);
  const submitTradeDecision = useGameStore((s) => s.submitTradeDecision);
  const proceedToRequote = useGameStore((s) => s.proceedToRequote);
  const enterTrading2 = useGameStore((s) => s.enterTrading2);
  const submitRequote = useGameStore((s) => s.submitRequote);
  const showRoundLeaderboard = useGameStore((s) => s.showRoundLeaderboard);
  const nextRoundOrEnd = useGameStore((s) => s.nextRoundOrEnd);
  const tick = useGameStore((s) => s.tick);
  const resetToLobby = useGameStore((s) => s.resetToLobby);

  // Redirect to lobby if the game hasn't been started (e.g. direct nav to /play).
  useEffect(() => {
    if (phase === "lobby") router.replace("/");
  }, [phase, router]);

  // Drive the human decision countdown.
  useEffect(() => {
    if (actionEndsAt === null) return;
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [actionEndsAt, tick]);

  // Bot-only "beat" for quoting/requote: compute happens instantly in the store;
  // this just paces how long the reveal sits on screen before auto-advancing.
  useEffect(() => {
    const isHumanMM = marketMakerId === "human";
    if (phase === "quoting" && !isHumanMM) {
      const id = setTimeout(enterTrading1, BOT_BEAT_MS);
      return () => clearTimeout(id);
    }
    if (phase === "requote" && !isHumanMM) {
      const id = setTimeout(enterTrading2, BOT_BEAT_MS);
      return () => clearTimeout(id);
    }
  }, [phase, marketMakerId, enterTrading1, enterTrading2]);

  // Trading-phase turn stepping: bots resolve after a short "thinking" delay
  // (so sequential book depletion is visible turn by turn); humans just get
  // their timer started, then wait for a manual/timeout decision.
  useEffect(() => {
    if (phase !== "trading-1" && phase !== "trading-2") return;
    const turnId = tradeTurnOrder[tradeTurnIndex];
    if (turnId === undefined) {
      processTradingTurn();
      return;
    }
    const player = players.find((p) => p.id === turnId);
    if (player?.isHuman) {
      processTradingTurn();
      return;
    }
    const id = setTimeout(processTradingTurn, BOT_TURN_DELAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tradeTurnIndex, tradeTurnOrder]);

  // Persist the final leaderboard once the game ends.
  useEffect(() => {
    if (phase !== "game-over") return;
    const standings = [...players].sort((a, b) => b.pnl - a.pnl).map((p) => ({ name: p.name, pnl: p.pnl }));
    saveRecentGame({ completedAt: new Date().toISOString(), standings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "lobby" || questions.length === 0) return null;

  const currentQuestion = questions[roundNum - 1];
  const isHumanMM = marketMakerId === "human";
  const currentTurnId = tradeTurnOrder[tradeTurnIndex];
  const isHumanTurn = currentTurnId === "human";
  const showChrome = !CHROME_HIDDEN_PHASES.has(phase);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-6 py-10 dark:bg-black">
      <RoundHeader
        roundNum={roundNum}
        totalRounds={questions.length}
        question={currentQuestion.question}
        clue={CLUE_VISIBLE_PHASES.has(phase) ? currentQuestion.clue : null}
        timerEndsAt={phase === "round-intro" ? actionEndsAt : null}
        timerTotalMs={ROUND_INTRO_MS}
      />

      {showChrome && <MarketTicker market={market} />}
      {actionEndsAt !== null && phase !== "round-intro" && <CountdownRing endsAt={actionEndsAt} totalMs={timerMs} />}

      <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 ring-1 ring-foreground/10 dark:bg-zinc-950">
        {phase === "round-intro" && (
          <p className="text-sm text-muted-foreground">Get ready to bid a spread...</p>
        )}

        {phase === "spread-bidding" && <SpreadBidPanel onSubmit={submitSpreadBid} />}

        {phase === "spread-reveal" && (
          <SpreadRevealPanel
            players={players}
            spreadBids={spreadBids}
            marketMakerId={marketMakerId}
            onContinue={proceedToQuoting}
          />
        )}

        {phase === "quoting" &&
          (isHumanMM ? (
            <MarketQuotePanel winningSpread={winningSpread ?? 0} onSubmit={submitMarketQuote} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {players.find((p) => p.id === marketMakerId)?.name} is setting the market...
            </p>
          ))}

        {(phase === "trading-1" || phase === "trading-2") &&
          (currentTurnId === undefined ? (
            <p className="text-sm text-muted-foreground">Wrapping up this trading round...</p>
          ) : isHumanTurn ? (
            <TradeDecisionPanel market={market} onDecide={submitTradeDecision} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {players.find((p) => p.id === currentTurnId)?.name} is deciding...
            </p>
          ))}

        {phase === "clue-reveal" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">The clue is revealed above.</p>
            <Button onClick={proceedToRequote}>Continue</Button>
          </div>
        )}

        {phase === "requote" &&
          (isHumanMM ? (
            <RequotePanel winningSpread={winningSpread ?? 0} onSubmit={submitRequote} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {players.find((p) => p.id === marketMakerId)?.name} is reviewing the market...
            </p>
          ))}

        {phase === "settlement" && (
          <SettlementPanel trueAnswer={currentQuestion.answer} onContinue={showRoundLeaderboard} />
        )}

        {phase === "round-leaderboard" && (
          <Leaderboard
            players={players}
            onContinue={nextRoundOrEnd}
            continueLabel={roundNum >= questions.length ? "See final results" : "Next round"}
          />
        )}

        {phase === "game-over" && (
          <div className="flex flex-col items-center gap-4">
            <Leaderboard players={players} final />
            <Button
              onClick={() => {
                resetToLobby();
                router.push("/");
              }}
            >
              Play again
            </Button>
          </div>
        )}
      </div>

      {showChrome && (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <PositionsPanel players={players} marketMakerId={marketMakerId} />
          <ActivityFeed entries={activityLog} />
        </div>
      )}
    </div>
  );
}
