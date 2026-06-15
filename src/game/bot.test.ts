import { describe, expect, it } from "vitest";
import { decideStat } from "./bot";
import { newGame } from "./engine";
import { DECKS } from "./decks";
import type { Card, DeckTheme, GameSnapshot } from "../types";

/** A tiny, fully-controlled deck for asserting exact bot decisions. */
const TEST_THEME: DeckTheme = {
  id: "test",
  title: "Test",
  tagline: "",
  description: "",
  accent: "#fff",
  accentSoft: "#fff",
  stats: [
    { id: "power", label: "Power", shortLabel: "PW", higherIsBetter: true },
    { id: "weight", label: "Weight", shortLabel: "WT", higherIsBetter: false },
  ],
  cards: [
    { id: "t-01", name: "A", stats: { power: 90, weight: 10 } },
    { id: "t-02", name: "B", stats: { power: 20, weight: 50 } },
    { id: "t-03", name: "C", stats: { power: 30, weight: 80 } },
  ],
};

function snapshotWith(theme: DeckTheme, p2Top: Card): GameSnapshot {
  const g = newGame(theme, 1, { player: 2, difficulty: "medium" });
  g.p2 = [p2Top, ...g.p2.filter((c) => c.id !== p2Top.id)];
  return g;
}

describe("decideStat", () => {
  it("always returns a real stat id for every deck and difficulty", () => {
    for (const deck of DECKS) {
      const g = newGame(deck, 3, { player: 2, difficulty: "hard" });
      const ids = new Set(deck.stats.map((s) => s.id));
      for (const diff of ["easy", "medium", "hard"] as const) {
        for (let i = 0; i < 20; i++) {
          expect(ids.has(decideStat(g, 2, diff))).toBe(true);
        }
      }
    }
  });

  it("medium picks the card's strongest stat, honouring lower-is-better", () => {
    // Card with very high power should lead with power.
    const g1 = snapshotWith(TEST_THEME, TEST_THEME.cards[0]);
    expect(decideStat(g1, 2, "medium")).toBe("power");
    // Card with low power but low (good) weight should lead with weight.
    const g2 = snapshotWith(TEST_THEME, TEST_THEME.cards[1]);
    expect(decideStat(g2, 2, "medium")).toBe("weight");
  });

  it("hard picks the stat that beats the most possible opponents", () => {
    // Bot holds card B (power 20, weight 50). Remaining opponents are A and C.
    // power: 20 beats neither A(90) nor C(30) → 0/2.
    // weight (lower better): 50 beats C(80) but not A(10) → 1/2. Hard prefers weight.
    const g = snapshotWith(TEST_THEME, TEST_THEME.cards[1]);
    expect(decideStat(g, 2, "hard")).toBe("weight");
  });

  it("falls back to the first stat when the bot has no card", () => {
    const g = newGame(TEST_THEME, 1, { player: 2, difficulty: "hard" });
    g.p2 = [];
    expect(decideStat(g, 2, "hard")).toBe("power");
  });
});
