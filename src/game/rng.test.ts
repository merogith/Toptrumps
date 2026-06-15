import { describe, expect, it } from "vitest";
import { mulberry32, randomSeed, shuffle } from "./rng";

describe("mulberry32", () => {
  it("is deterministic for a seed", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("produces values in [0, 1)", () => {
    const rnd = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rnd();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  const deck = Array.from({ length: 30 }, (_, i) => i);

  it("is a pure permutation (same multiset, input untouched)", () => {
    const input = [...deck];
    const out = shuffle(input, 42);
    expect(input).toEqual(deck); // not mutated
    expect([...out].sort((a, b) => a - b)).toEqual(deck);
  });

  it("is deterministic for a seed and varies across seeds", () => {
    expect(shuffle(deck, 42)).toEqual(shuffle(deck, 42));
    expect(shuffle(deck, 1)).not.toEqual(shuffle(deck, 2));
  });

  it("is reasonably unbiased — no card sticks to its starting index", () => {
    // Over many shuffles, every card should land in many different positions.
    const positions = deck.map(() => new Set<number>());
    for (let seed = 0; seed < 600; seed++) {
      const out = shuffle(deck, seed);
      out.forEach((card, pos) => positions[card].add(pos));
    }
    // A biased shuffle would pin cards near their origin; expect broad spread.
    for (const seen of positions) {
      expect(seen.size).toBeGreaterThan(15);
    }
  });
});

describe("randomSeed", () => {
  it("returns a 32-bit unsigned integer", () => {
    for (let i = 0; i < 50; i++) {
      const s = randomSeed();
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(0xffffffff);
    }
  });
});
