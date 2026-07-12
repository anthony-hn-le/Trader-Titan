import type { RngFn } from "./types";

export function uniform(min: number, max: number, rng: RngFn): number {
  return min + rng() * (max - min);
}

export function randInt(min: number, max: number, rng: RngFn): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Fisher-Yates shuffle; does not mutate the input array. */
export function shuffle<T>(items: readonly T[], rng: RngFn): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
