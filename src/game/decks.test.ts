import { describe, expect, it } from "vitest";
import { DECKS } from "./decks";
import { validateDeck } from "./engine";

describe("DECKS data", () => {
  it("exposes seven themes with 30 cards and six stats each", () => {
    expect(DECKS).toHaveLength(7);
    for (const d of DECKS) {
      expect(d.cards).toHaveLength(30);
      expect(d.stats).toHaveLength(6);
      const ids = d.cards.map((c) => c.id);
      expect(new Set(ids).size).toBe(30);
    }
  });

  it("has unique theme ids", () => {
    const ids = DECKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(7);
  });

  it("includes an original showcase deck with self-contained artwork", () => {
    const deck = DECKS.find((theme) => theme.id === "field-lab")!;
    expect(deck.cards.every((card) => card.image?.startsWith("data:image/svg+xml"))).toBe(true);
  });

  it("passes engine validateDeck for every theme", () => {
    for (const d of DECKS) {
      expect(validateDeck(d), d.id).toEqual([]);
    }
  });
});
