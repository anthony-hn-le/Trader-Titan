import { describe, expect, it } from "vitest";
import { computeRoundPnl } from "@/lib/game/settlement";

describe("computeRoundPnl", () => {
  it("is cash plus inventory times the true answer", () => {
    expect(computeRoundPnl(100, 2, 50)).toBe(200);
    expect(computeRoundPnl(-30, -1, 50)).toBe(-80);
    expect(computeRoundPnl(0, 0, 12345)).toBe(0);
  });
});
