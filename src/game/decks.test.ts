import { describe, expect, it } from "vitest";
import { DECKS } from "./decks";
import { validateDeck } from "./engine";

describe("DECKS data", () => {
  it("exposes six themes with 30 cards and six stats each", () => {
    expect(DECKS).toHaveLength(6);
    for (const d of DECKS) {
      expect(d.cards).toHaveLength(30);
      expect(d.stats).toHaveLength(6);
      const ids = d.cards.map((c) => c.id);
      expect(new Set(ids).size).toBe(30);
    }
  });

  it("has unique theme ids", () => {
    const ids = DECKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("passes engine validateDeck for every theme", () => {
    for (const d of DECKS) {
      expect(validateDeck(d), d.id).toEqual([]);
    }
  });
});
