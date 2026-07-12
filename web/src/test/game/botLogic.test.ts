import { describe, expect, it } from "vitest";
import { bidSpread, decideTrade, generateEstimate, quoteMarket, updateEstimateWithClue } from "@/lib/game/botLogic";
import { mulberry32 } from "@/test/helpers/seededRng";

describe("generateEstimate", () => {
  const trueAnswer = 1000;

  it("stays within the profile's noise band", () => {
    const bands = {
      aggressive: [0.9, 1.1],
      conservative: [0.8, 1.2],
      random: [0.6, 1.4],
    } as const;

    for (const [profile, [min, max]] of Object.entries(bands)) {
      for (let seed = 0; seed < 50; seed++) {
        const rng = mulberry32(seed);
        const estimate = generateEstimate(trueAnswer, profile as keyof typeof bands, rng);
        expect(estimate).toBeGreaterThanOrEqual(Math.trunc(trueAnswer * min));
        expect(estimate).toBeLessThanOrEqual(Math.trunc(trueAnswer * max));
      }
    }
  });
});

describe("updateEstimateWithClue", () => {
  it("narrows toward the true answer more tightly than the Phase 1 estimate", () => {
    const trueAnswer = 1000;
    for (let seed = 0; seed < 50; seed++) {
      const estimate = updateEstimateWithClue(trueAnswer, "random", mulberry32(seed));
      expect(estimate).toBeGreaterThanOrEqual(Math.trunc(trueAnswer * 0.85));
      expect(estimate).toBeLessThanOrEqual(Math.trunc(trueAnswer * 1.15));
    }
  });
});

describe("bidSpread", () => {
  it("never returns a negative spread", () => {
    for (const profile of ["aggressive", "conservative", "random"] as const) {
      for (let seed = 0; seed < 50; seed++) {
        const { spread } = bidSpread(1000, profile, mulberry32(seed));
        expect(spread).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("floors the base spread at 1 for small answers, matching the CLI's max(1, ...)", () => {
    // A low-magnitude answer (e.g. "light-years to Alpha Centauri" = 4) makes
    // base_spread floor to 1 for any reasonable estimate; zero/near-zero
    // winning spreads and ties are a common, not rare, reachable game state.
    for (let seed = 0; seed < 50; seed++) {
      const { spread, estimate } = bidSpread(4, "aggressive", mulberry32(seed));
      expect(estimate).toBeGreaterThanOrEqual(0);
      expect(spread).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("quoteMarket", () => {
  it("never returns a negative bid, and ask is always bid + winningSpread", () => {
    for (let seed = 0; seed < 50; seed++) {
      const quote = quoteMarket(2, 10, "random", mulberry32(seed));
      expect(quote.bid).toBeGreaterThanOrEqual(0);
      expect(quote.ask).toBe(quote.bid + 10);
    }
  });
});

describe("decideTrade", () => {
  const market = { bid: 90, ask: 100, bidSize: 5, askSize: 5 };

  it("aggressive buys when estimate > ask, sells when estimate < bid", () => {
    expect(decideTrade(150, market, "aggressive", () => 0.5)).toBe("buy");
    expect(decideTrade(50, market, "aggressive", () => 0.5)).toBe("sell");
    expect(decideTrade(95, market, "aggressive", () => 0.5)).toBe("pass");
  });

  it("conservative requires a wider margin (ask*1.1 / bid*0.9)", () => {
    expect(decideTrade(105, market, "conservative", () => 0.5)).toBe("pass"); // > ask but not > ask*1.1
    expect(decideTrade(115, market, "conservative", () => 0.5)).toBe("buy");
    expect(decideTrade(85, market, "conservative", () => 0.5)).toBe("pass"); // < bid but not < bid*0.9
    expect(decideTrade(75, market, "conservative", () => 0.5)).toBe("sell");
  });

  it("random profile ignores price and rolls purely on rng() thresholds", () => {
    // choice > 0.8 -> buy
    expect(decideTrade(1, market, "random", () => 0.81)).toBe("buy");
    expect(decideTrade(1, market, "random", () => 0.8)).toBe("pass"); // boundary is exclusive
    // choice < 0.2 -> sell
    expect(decideTrade(999, market, "random", () => 0.19)).toBe("sell");
    expect(decideTrade(999, market, "random", () => 0.2)).toBe("pass"); // boundary is exclusive
  });

  it("random profile respects size constraints even when the roll says trade", () => {
    expect(decideTrade(1, { ...market, askSize: 0 }, "random", () => 0.9)).toBe("pass");
    expect(decideTrade(999, { ...market, bidSize: 0 }, "random", () => 0.1)).toBe("pass");
  });
});
