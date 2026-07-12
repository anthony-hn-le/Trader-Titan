import { uniform, randInt } from "./rng";
import type { BotProfile, MarketState, RngFn, TradeAction } from "./types";

/** Ported from Player.generate_estimate in trader_titan.py. */
export function generateEstimate(trueAnswer: number, profile: BotProfile, rng: RngFn): number {
  const noise =
    profile === "aggressive"
      ? uniform(0.9, 1.1, rng)
      : profile === "conservative"
        ? uniform(0.8, 1.2, rng)
        : uniform(0.6, 1.4, rng);
  return Math.trunc(trueAnswer * noise);
}

/** Ported from Player.update_estimate_with_clue — narrower noise than the Phase 1 estimate. */
export function updateEstimateWithClue(trueAnswer: number, profile: BotProfile, rng: RngFn): number {
  const noise =
    profile === "aggressive"
      ? uniform(0.95, 1.05, rng)
      : profile === "conservative"
        ? uniform(0.9, 1.1, rng)
        : uniform(0.85, 1.15, rng);
  return Math.trunc(trueAnswer * noise);
}

export interface SpreadBidResult {
  spread: number;
  estimate: number;
}

/** Ported from Player.bid_spread. Bots always (re)generate their estimate here, from the true answer. */
export function bidSpread(trueAnswer: number, profile: BotProfile, rng: RngFn): SpreadBidResult {
  const estimate = generateEstimate(trueAnswer, profile, rng);
  const baseSpread = Math.max(1, Math.trunc(estimate * 0.1));
  const multiplier =
    profile === "aggressive"
      ? uniform(0.5, 1.0, rng)
      : profile === "conservative"
        ? uniform(1.5, 2.5, rng)
        : uniform(0.8, 2.0, rng);
  return { spread: Math.trunc(baseSpread * multiplier), estimate };
}

export interface Quote {
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
}

/** Ported from Player.quote_market. */
export function quoteMarket(estimate: number, winningSpread: number, profile: BotProfile, rng: RngFn): Quote {
  const halfSpread = Math.floor(winningSpread / 2);
  const bid = Math.max(0, estimate - halfSpread);
  const ask = bid + winningSpread;
  const [bidSize, askSize] =
    profile === "aggressive"
      ? [randInt(15, 40, rng), randInt(15, 40, rng)]
      : profile === "conservative"
        ? [randInt(3, 10, rng), randInt(3, 10, rng)]
        : [randInt(5, 25, rng), randInt(5, 25, rng)];
  return { bid, ask, bidSize, askSize };
}

export interface TradeDecision {
  action: TradeAction;
  size: number;
}

/** How many contracts of the available `depth` a bot of this profile lifts/hits. */
function sizeFor(depth: number, profile: BotProfile, rng: RngFn): number {
  if (depth <= 0) return 0;
  if (profile === "aggressive") return depth;
  if (profile === "conservative") return Math.min(depth, randInt(1, 2, rng));
  return randInt(1, depth, rng);
}

/**
 * Ported from Player.decide_trade. The "random" profile deliberately ignores
 * price entirely (a dumb/noise trader) — do not turn this into a valuation check.
 */
export function decideTrade(estimate: number, market: MarketState, profile: BotProfile, rng: RngFn): TradeDecision {
  const { bid, ask, bidSize, askSize } = market;
  if (profile === "aggressive") {
    if (estimate > ask && askSize > 0) return { action: "buy", size: sizeFor(askSize, profile, rng) };
    if (estimate < bid && bidSize > 0) return { action: "sell", size: sizeFor(bidSize, profile, rng) };
  } else if (profile === "conservative") {
    if (estimate > ask * 1.1 && askSize > 0) return { action: "buy", size: sizeFor(askSize, profile, rng) };
    if (estimate < bid * 0.9 && bidSize > 0) return { action: "sell", size: sizeFor(bidSize, profile, rng) };
  } else {
    const choice = rng();
    if (choice > 0.8 && askSize > 0) return { action: "buy", size: sizeFor(askSize, profile, rng) };
    if (choice < 0.2 && bidSize > 0) return { action: "sell", size: sizeFor(bidSize, profile, rng) };
  }
  return { action: "pass", size: 0 };
}
