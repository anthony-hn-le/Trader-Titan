import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "@/stores/gameStore";

describe("gameStore", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("startGame / beginRound", () => {
    it("startGame samples 5 questions and enters round-intro", () => {
      useGameStore.getState().startGame();
      const state = useGameStore.getState();
      expect(state.phase).toBe("round-intro");
      expect(state.roundNum).toBe(1);
      expect(state.questions).toHaveLength(5);
      expect(state.players.every((p) => p.pnl === 0 && p.cash === 0 && p.inventory === 0)).toBe(true);
    });

    it("beginRound starts the spread-bidding timer and is a no-op once already started", () => {
      useGameStore.getState().startGame();
      useGameStore.getState().beginRound();
      expect(useGameStore.getState().phase).toBe("spread-bidding");
      const endsAtAfterFirstCall = useGameStore.getState().actionEndsAt;
      expect(endsAtAfterFirstCall).not.toBeNull();

      useGameStore.getState().beginRound(); // wrong phase now, must no-op
      expect(useGameStore.getState().actionEndsAt).toBe(endsAtAfterFirstCall);
    });
  });

  describe("submitSpreadBid", () => {
    beforeEach(() => {
      // Pinning Math.random at 0.5 makes every profile's noise multiplier
      // resolve to exactly 1.0, so every bot's estimate equals the true
      // answer and spreads become deterministic: aggressive=75, random=140,
      // conservative=200 for a true answer of 1000 (see botLogic.test.ts).
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      useGameStore.getState().startGame();
      useGameStore.setState({ questions: [{ question: "Q", answer: 1000, clue: "C" }] });
      useGameStore.getState().beginRound();
    });

    it("is a no-op outside the spread-bidding phase", () => {
      useGameStore.setState({ phase: "quoting" });
      useGameStore.getState().submitSpreadBid(10);
      expect(useGameStore.getState().phase).toBe("quoting");
    });

    it("picks the lowest bidder as market maker", () => {
      useGameStore.getState().submitSpreadBid(999_999); // human bids absurdly high, a bot must win
      const state = useGameStore.getState();
      expect(state.phase).toBe("spread-reveal");
      expect(state.marketMakerId).toBe("alpha"); // aggressive's 75 is the lowest bot spread
      expect(state.winningSpread).toBe(75);
    });

    it("ties go to the first player in fixed order [human, alpha, beta, gamma]", () => {
      useGameStore.getState().submitSpreadBid(75); // ties alpha's spread exactly
      const state = useGameStore.getState();
      expect(state.marketMakerId).toBe("human");
      expect(state.winningSpread).toBe(75);
    });
  });

  describe("proceedToQuoting", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      useGameStore.getState().startGame();
      useGameStore.setState({ questions: [{ question: "Q", answer: 1000, clue: "C" }] });
      useGameStore.getState().beginRound();
    });

    it("starts an interactive timer when the human is market maker", () => {
      useGameStore.getState().submitSpreadBid(1); // beats every bot, human wins MM
      useGameStore.getState().proceedToQuoting();
      const state = useGameStore.getState();
      expect(state.phase).toBe("quoting");
      expect(state.marketMakerId).toBe("human");
      expect(state.actionEndsAt).not.toBeNull();
    });

    it("auto-quotes instantly with no timer when a bot is market maker", () => {
      useGameStore.getState().submitSpreadBid(999_999);
      useGameStore.getState().proceedToQuoting();
      const state = useGameStore.getState();
      expect(state.phase).toBe("quoting");
      expect(state.actionEndsAt).toBeNull();
      expect(state.market.ask).toBe(state.market.bid + state.winningSpread!);
    });
  });

  describe("tick", () => {
    it("auto-submits a forfeiting spread bid once the spread-bidding timer expires", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      useGameStore.getState().startGame();
      useGameStore.setState({ questions: [{ question: "Q", answer: 1000, clue: "C" }] });
      useGameStore.getState().beginRound();
      useGameStore.setState({ actionEndsAt: Date.now() - 1 }); // force-expire without waiting real time

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      expect(state.phase).toBe("spread-reveal");
      expect(state.marketMakerId).not.toBe("human"); // MAX_SAFE_INTEGER bid can never win
    });

    it("does nothing while the timer hasn't expired yet", () => {
      useGameStore.getState().startGame();
      useGameStore.getState().beginRound();
      useGameStore.getState().tick();
      expect(useGameStore.getState().phase).toBe("spread-bidding");
    });
  });

  describe("submitTradeDecision guard/idempotency", () => {
    it("is a no-op when it isn't the human's turn (manual-vs-timeout race guard)", () => {
      useGameStore.setState({
        phase: "trading-1",
        tradeTurnOrder: ["alpha", "human", "beta"],
        tradeTurnIndex: 0, // alpha's turn, not human's
        players: useGameStore.getState().players,
      });
      useGameStore.getState().submitTradeDecision("buy");
      expect(useGameStore.getState().tradeTurnIndex).toBe(0); // unchanged
    });

    it("advances the turn exactly once even if called twice in a row", () => {
      useGameStore.setState({
        phase: "trading-1",
        marketMakerId: "gamma",
        tradeTurnOrder: ["human", "alpha", "beta"],
        tradeTurnIndex: 0,
        market: { bid: 90, ask: 100, bidSize: 5, askSize: 5 },
      });
      useGameStore.getState().submitTradeDecision("pass");
      const indexAfterFirst = useGameStore.getState().tradeTurnIndex;
      expect(indexAfterFirst).toBe(1);

      useGameStore.getState().submitTradeDecision("pass"); // now alpha's turn, not human's -> guarded no-op
      expect(useGameStore.getState().tradeTurnIndex).toBe(indexAfterFirst);
    });
  });

  describe("full game flow", () => {
    it("plays all 5 rounds through to game-over", () => {
      // Pinning rng at 0.5 makes aggressive/conservative bots' estimate land
      // exactly on the market center (never strictly beyond bid/ask) and
      // random-profile's roll (0.5) fall in its neutral [0.2, 0.8] zone, so
      // every bot decision resolves to "pass" -- a fully deterministic,
      // trade-free walk through every phase transition.
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      useGameStore.getState().startGame();

      for (let round = 1; round <= 5; round++) {
        expect(useGameStore.getState().phase).toBe("round-intro");
        expect(useGameStore.getState().roundNum).toBe(round);
        useGameStore.getState().beginRound();

        // Human always bids absurdly high so a bot is always market maker,
        // keeping the human's own trading-turn path exercised every round.
        useGameStore.getState().submitSpreadBid(999_999);
        expect(useGameStore.getState().phase).toBe("spread-reveal");
        expect(useGameStore.getState().marketMakerId).not.toBe("human");

        useGameStore.getState().proceedToQuoting();
        expect(useGameStore.getState().phase).toBe("quoting");
        useGameStore.getState().enterTrading1();
        expect(useGameStore.getState().phase).toBe("trading-1");

        while ((useGameStore.getState().phase as string) === "trading-1") {
          const s = useGameStore.getState();
          const turnId = s.tradeTurnOrder[s.tradeTurnIndex];
          if (turnId === "human") s.submitTradeDecision("pass");
          else s.processTradingTurn();
        }
        expect(useGameStore.getState().phase).toBe("clue-reveal");

        useGameStore.getState().proceedToRequote();
        expect(useGameStore.getState().phase).toBe("requote");
        useGameStore.getState().enterTrading2();
        expect(useGameStore.getState().phase).toBe("trading-2");

        while ((useGameStore.getState().phase as string) === "trading-2") {
          const s = useGameStore.getState();
          const turnId = s.tradeTurnOrder[s.tradeTurnIndex];
          if (turnId === "human") s.submitTradeDecision("pass");
          else s.processTradingTurn();
        }
        expect(useGameStore.getState().phase).toBe("settlement");

        useGameStore.getState().showRoundLeaderboard();
        expect(useGameStore.getState().phase).toBe("round-leaderboard");
        useGameStore.getState().nextRoundOrEnd();
      }

      expect(useGameStore.getState().phase).toBe("game-over");
    });
  });
});
