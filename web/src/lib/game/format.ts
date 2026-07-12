import type { MarketState } from "./types";

/** Ported from TraderTitanGame._format_market. */
export function formatMarket(market: MarketState): string {
  return `${market.bid} at ${market.ask}, ${market.bidSize} by ${market.askSize}`;
}
