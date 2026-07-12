import { create } from "zustand";
import { bidSpread, decideTrade, quoteMarket, updateEstimateWithClue } from "@/lib/game/botLogic";
import { formatMarket } from "@/lib/game/format";
import { shuffle } from "@/lib/game/rng";
import { computeRoundPnl } from "@/lib/game/settlement";
import { TRIVIA_QUESTIONS } from "@/data/triviaQuestions";
import {
  PLAYER_ORDER,
  type ActivityEntry,
  type MarketState,
  type Phase,
  type Player,
  type PlayerId,
  type QuoteInput,
  type RoundQuestion,
  type TradeAction,
} from "@/lib/game/types";
import { useConfigStore } from "./configStore";

const ROUNDS_PER_GAME = 5;
export const ROUND_INTRO_MS = 5000;
const EMPTY_MARKET: MarketState = { bid: 0, ask: 0, bidSize: 0, askSize: 0 };

let logCounter = 0;
function makeLog(text: string): ActivityEntry {
  logCounter += 1;
  return { id: logCounter, text };
}

function initialPlayers(): Player[] {
  return [
    { id: "human", name: "Human (You)", isHuman: true, profile: null, pnl: 0, lastRoundPnl: 0, cash: 0, inventory: 0, currentEstimate: 0 },
    { id: "alpha", name: "Bot Alpha", isHuman: false, profile: "aggressive", pnl: 0, lastRoundPnl: 0, cash: 0, inventory: 0, currentEstimate: 0 },
    { id: "beta", name: "Bot Beta", isHuman: false, profile: "conservative", pnl: 0, lastRoundPnl: 0, cash: 0, inventory: 0, currentEstimate: 0 },
    { id: "gamma", name: "Bot Gamma", isHuman: false, profile: "random", pnl: 0, lastRoundPnl: 0, cash: 0, inventory: 0, currentEstimate: 0 },
  ];
}

function resetRoundState(players: Player[]): Player[] {
  return players.map((p) => ({ ...p, cash: 0, inventory: 0, currentEstimate: 0 }));
}

interface GameState {
  phase: Phase;
  roundNum: number; // 1-based
  questions: RoundQuestion[];
  players: Player[];
  marketMakerId: PlayerId | null;
  winningSpread: number | null;
  market: MarketState;
  spreadBids: Partial<Record<PlayerId, number>>;
  activityLog: ActivityEntry[];
  tradeTurnOrder: PlayerId[];
  tradeTurnIndex: number;
  actionEndsAt: number | null; // epoch ms; timer for whichever decision is currently pending
  timerMs: number; // snapshot of configStore's answerTimerSeconds at game start

  startGame: () => void;
  beginRound: () => void;
  submitSpreadBid: (humanSpread: number) => void;
  proceedToQuoting: () => void;
  submitMarketQuote: (quote: QuoteInput) => void;
  processTradingTurn: () => void;
  submitTradeDecision: (action: TradeAction, size?: number) => void;
  proceedToRequote: () => void;
  submitRequote: (update: boolean, quote?: QuoteInput) => void;
  showRoundLeaderboard: () => void;
  nextRoundOrEnd: () => void;
  tick: () => void;
  resetToLobby: () => void;

  /** Internal: applies a buy/sell/pass action from `playerId` against the shared market, clamped to available depth. */
  executeTrade: (playerId: PlayerId, action: TradeAction, size: number) => void;
  enterTrading1: () => void;
  enterTrading2: () => void;
  settleRound: () => void;
}

function tradingOrderExcluding(marketMakerId: PlayerId | null): PlayerId[] {
  return PLAYER_ORDER.filter((id) => id !== marketMakerId);
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: "lobby",
  roundNum: 1,
  questions: [],
  players: initialPlayers(),
  marketMakerId: null,
  winningSpread: null,
  market: EMPTY_MARKET,
  spreadBids: {},
  activityLog: [],
  tradeTurnOrder: [],
  tradeTurnIndex: 0,
  actionEndsAt: null,
  timerMs: 15_000,

  startGame: () => {
    const timerMs = useConfigStore.getState().answerTimerSeconds * 1000;
    const questions = shuffle(TRIVIA_QUESTIONS, Math.random).slice(0, ROUNDS_PER_GAME);
    set({
      phase: "round-intro",
      roundNum: 1,
      questions,
      players: initialPlayers(),
      marketMakerId: null,
      winningSpread: null,
      market: EMPTY_MARKET,
      spreadBids: {},
      activityLog: [],
      tradeTurnOrder: [],
      tradeTurnIndex: 0,
      actionEndsAt: Date.now() + ROUND_INTRO_MS,
      timerMs,
    });
  },

  beginRound: () => {
    const state = get();
    if (state.phase !== "round-intro") return;
    set({ phase: "spread-bidding", actionEndsAt: Date.now() + state.timerMs });
  },

  submitSpreadBid: (humanSpread) => {
    const state = get();
    if (state.phase !== "spread-bidding") return;
    const trueAnswer = state.questions[state.roundNum - 1].answer;

    const bids: Partial<Record<PlayerId, number>> = { human: humanSpread };
    const players = state.players.map((p) => {
      if (p.isHuman) return p;
      const { spread, estimate } = bidSpread(trueAnswer, p.profile!, Math.random);
      bids[p.id] = spread;
      return { ...p, currentEstimate: estimate };
    });

    const winner = PLAYER_ORDER.reduce((best, id) => ((bids[id] as number) < (bids[best] as number) ? id : best));
    const winnerName = players.find((p) => p.id === winner)!.name;

    const log = [
      ...state.activityLog,
      ...players
        .filter((p) => !p.isHuman)
        .map((p) => makeLog(`${p.name} bids a spread of ${bids[p.id]}`)),
      makeLog(`${winnerName} wins the right to quote with a spread of ${bids[winner]}!`),
    ];

    set({
      players,
      spreadBids: bids,
      marketMakerId: winner,
      winningSpread: bids[winner] as number,
      phase: "spread-reveal",
      actionEndsAt: null,
      activityLog: log,
    });
  },

  proceedToQuoting: () => {
    const state = get();
    if (state.phase !== "spread-reveal") return;
    const mmId = state.marketMakerId!;

    if (mmId === "human") {
      set({ phase: "quoting", actionEndsAt: Date.now() + state.timerMs });
      return;
    }

    const mm = state.players.find((p) => p.id === mmId)!;
    const quote = quoteMarket(mm.currentEstimate, state.winningSpread!, mm.profile!, Math.random);
    const market: MarketState = quote;
    set({
      phase: "quoting",
      market,
      actionEndsAt: null,
      activityLog: [...state.activityLog, makeLog(`${mm.name} sets the market: ${formatMarket(market)}`)],
    });
  },

  submitMarketQuote: (quote) => {
    const state = get();
    if (state.phase !== "quoting" || state.marketMakerId !== "human") return;
    const ask = quote.bid + state.winningSpread!;
    const market: MarketState = { bid: quote.bid, ask, bidSize: quote.bidSize, askSize: quote.askSize };
    set({
      market,
      activityLog: [...state.activityLog, makeLog(`You set the market: ${formatMarket(market)}`)],
    });
    get().enterTrading1();
  },

  enterTrading1: () => {
    const state = get();
    if (state.phase !== "quoting") return;
    set({
      phase: "trading-1",
      tradeTurnOrder: tradingOrderExcluding(state.marketMakerId),
      tradeTurnIndex: 0,
      actionEndsAt: null,
    });
  },

  executeTrade: (playerId, action, size) => {
    const state = get();
    const mmId = state.marketMakerId!;
    const player = state.players.find((p) => p.id === playerId)!;
    let market = state.market;
    let players = state.players;
    let text: string;

    if (action === "buy") {
      const qty = Math.min(size, market.askSize);
      if (qty <= 0) {
        text = `${player.name} wanted to BUY but no asks remaining in market.`;
      } else {
        players = players.map((p) => {
          if (p.id === playerId) return { ...p, inventory: p.inventory + qty, cash: p.cash - market.ask * qty };
          if (p.id === mmId) return { ...p, inventory: p.inventory - qty, cash: p.cash + market.ask * qty };
          return p;
        });
        market = { ...market, askSize: market.askSize - qty };
        text = `${player.name} BOUGHT ${qty} @ ${market.ask}`;
      }
    } else if (action === "sell") {
      const qty = Math.min(size, market.bidSize);
      if (qty <= 0) {
        text = `${player.name} wanted to SELL but no bids remaining in market.`;
      } else {
        players = players.map((p) => {
          if (p.id === playerId) return { ...p, inventory: p.inventory - qty, cash: p.cash + market.bid * qty };
          if (p.id === mmId) return { ...p, inventory: p.inventory + qty, cash: p.cash - market.bid * qty };
          return p;
        });
        market = { ...market, bidSize: market.bidSize - qty };
        text = `${player.name} SOLD ${qty} @ ${market.bid}`;
      }
    } else {
      text = `${player.name} passed.`;
    }

    set({ players, market, activityLog: [...state.activityLog, makeLog(text)] });
  },

  processTradingTurn: () => {
    const state = get();
    if (state.phase !== "trading-1" && state.phase !== "trading-2") return;
    const turnId = state.tradeTurnOrder[state.tradeTurnIndex];

    if (turnId === undefined) {
      if (state.phase === "trading-1") {
        set({ phase: "clue-reveal", actionEndsAt: null });
      } else {
        get().settleRound();
      }
      return;
    }

    const player = state.players.find((p) => p.id === turnId)!;
    if (player.isHuman) {
      if (state.actionEndsAt === null) set({ actionEndsAt: Date.now() + state.timerMs });
      return;
    }

    const { action, size } = decideTrade(player.currentEstimate, state.market, player.profile!, Math.random);
    get().executeTrade(turnId, action, size);
    set((s) => ({ tradeTurnIndex: s.tradeTurnIndex + 1, actionEndsAt: null }));
  },

  submitTradeDecision: (action, size = 1) => {
    const state = get();
    if (state.phase !== "trading-1" && state.phase !== "trading-2") return;
    const turnId = state.tradeTurnOrder[state.tradeTurnIndex];
    if (turnId === undefined) return;
    const player = state.players.find((p) => p.id === turnId)!;
    if (!player.isHuman) return;

    get().executeTrade(turnId, action, action === "pass" ? 0 : size);
    set((s) => ({ tradeTurnIndex: s.tradeTurnIndex + 1, actionEndsAt: null }));
  },

  proceedToRequote: () => {
    const state = get();
    if (state.phase !== "clue-reveal") return;
    const mmId = state.marketMakerId!;

    if (mmId === "human") {
      set({ phase: "requote", actionEndsAt: Date.now() + state.timerMs });
      return;
    }

    const mm = state.players.find((p) => p.id === mmId)!;
    const trueAnswer = state.questions[state.roundNum - 1].answer;
    const newEstimate = updateEstimateWithClue(trueAnswer, mm.profile!, Math.random);
    const quote = quoteMarket(newEstimate, state.winningSpread!, mm.profile!, Math.random);
    const market: MarketState = quote;
    const players = state.players.map((p) => (p.id === mmId ? { ...p, currentEstimate: newEstimate } : p));

    set({
      phase: "requote",
      players,
      market,
      actionEndsAt: null,
      activityLog: [...state.activityLog, makeLog(`${mm.name} updates market to: ${formatMarket(market)}`)],
    });
  },

  submitRequote: (update, quote) => {
    const state = get();
    if (state.phase !== "requote" || state.marketMakerId !== "human") return;

    if (update && quote) {
      const ask = quote.bid + state.winningSpread!;
      const market: MarketState = { bid: quote.bid, ask, bidSize: quote.bidSize, askSize: quote.askSize };
      set({ market, activityLog: [...state.activityLog, makeLog(`You updated the market: ${formatMarket(market)}`)] });
    } else {
      set({ activityLog: [...state.activityLog, makeLog(`You kept the market unchanged.`)] });
    }

    get().enterTrading2();
  },

  enterTrading2: () => {
    const state = get();
    if (state.phase !== "requote") return;
    set({
      phase: "trading-2",
      tradeTurnOrder: tradingOrderExcluding(state.marketMakerId),
      tradeTurnIndex: 0,
      actionEndsAt: null,
    });
  },

  settleRound: () => {
    const state = get();
    const trueAnswer = state.questions[state.roundNum - 1].answer;
    const roundPnls = state.players.map((p) => computeRoundPnl(p.cash, p.inventory, trueAnswer));
    const players = state.players.map((p, i) => ({ ...p, pnl: p.pnl + roundPnls[i], lastRoundPnl: roundPnls[i] }));
    const log = [
      ...state.activityLog,
      makeLog(`The true answer was ${trueAnswer}!`),
      ...players.map((p, i) => makeLog(`${p.name} | Inv: ${p.inventory} | Round P&L: ${roundPnls[i].toFixed(2)}`)),
    ];
    set({ phase: "settlement", players, activityLog: log, actionEndsAt: null });
  },

  showRoundLeaderboard: () => {
    const state = get();
    if (state.phase !== "settlement") return;
    set({ phase: "round-leaderboard" });
  },

  nextRoundOrEnd: () => {
    const state = get();
    if (state.phase !== "round-leaderboard") return;

    if (state.roundNum >= state.questions.length) {
      set({ phase: "game-over" });
      return;
    }

    set({
      roundNum: state.roundNum + 1,
      phase: "round-intro",
      marketMakerId: null,
      winningSpread: null,
      market: EMPTY_MARKET,
      spreadBids: {},
      activityLog: [],
      tradeTurnOrder: [],
      tradeTurnIndex: 0,
      actionEndsAt: Date.now() + ROUND_INTRO_MS,
      players: resetRoundState(state.players),
    });
  },

  tick: () => {
    const state = get();
    if (state.actionEndsAt === null || Date.now() < state.actionEndsAt) return;
    switch (state.phase) {
      case "round-intro":
        get().beginRound();
        break;
      case "spread-bidding":
        get().submitSpreadBid(Number.MAX_SAFE_INTEGER);
        break;
      case "quoting":
        get().submitMarketQuote({ bid: 0, bidSize: 1, askSize: 1 });
        break;
      case "trading-1":
      case "trading-2":
        get().submitTradeDecision("pass");
        break;
      case "requote":
        get().submitRequote(false);
        break;
    }
  },

  resetToLobby: () => set({ phase: "lobby" }),
}));
