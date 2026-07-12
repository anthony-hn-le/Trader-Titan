export type RngFn = () => number;

export type BotProfile = "aggressive" | "conservative" | "random";

export type PlayerId = "human" | "alpha" | "beta" | "gamma";

export const PLAYER_ORDER: PlayerId[] = ["human", "alpha", "beta", "gamma"];

export interface Player {
  id: PlayerId;
  name: string;
  isHuman: boolean;
  profile: BotProfile | null;
  pnl: number;
  lastRoundPnl: number;
  cash: number;
  inventory: number;
  currentEstimate: number;
}

export interface MarketState {
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
}

export interface QuoteInput {
  bid: number;
  bidSize: number;
  askSize: number;
}

export interface RoundQuestion {
  question: string;
  answer: number;
  clue: string;
}

export type TradeAction = "buy" | "sell" | "pass";

export interface ActivityEntry {
  id: number;
  text: string;
}

export type Phase =
  | "lobby"
  | "round-intro"
  | "spread-bidding"
  | "spread-reveal"
  | "quoting"
  | "trading-1"
  | "clue-reveal"
  | "requote"
  | "trading-2"
  | "settlement"
  | "round-leaderboard"
  | "game-over";
