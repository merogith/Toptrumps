import { describe, expect, it } from "vitest";
import { DECKS } from "./decks";
import type { DeckTheme } from "../types";

/**
 * Balance guardrails. Top Trumps always has stronger and weaker cards, but a
 * deck feels broken when a single card wins almost everything or a card can
 * never win at all. "Win power" = the fraction of all (stat × other-card)
 * matchups a card wins, ignoring ties. We assert the spread stays sane so a
 * future data edit can't silently introduce a god-card.
 */
function winPowers(deck: DeckTheme): { name: string; power: number }[] {
  const { cards, stats } = deck;
  return cards
    .map((c) => {
      let wins = 0;
      let total = 0;
      for (const s of stats) {
        for (const o of cards) {
          if (o === c) continue;
          total++;
          const a = c.stats[s.id];
          const b = o.stats[s.id];
          if (s.higherIsBetter ? a > b : a < b) wins++;
        }
      }
      return { name: c.name, power: wins / total };
    })
    .sort((x, y) => y.power - x.power);
}

describe("deck balance", () => {
  for (const deck of DECKS) {
    describe(deck.title, () => {
      const powers = winPowers(deck);
      const max = powers[0];
      const min = powers[powers.length - 1];
      const avg = powers.reduce((s, p) => s + p.power, 0) / powers.length;

      it(`has no god-card (strongest ${max.name} ≤ 0.85)`, () => {
        expect(max.power).toBeLessThanOrEqual(0.85);
      });

      it(`has no dead-weight card (weakest ${min.name} ≥ 0.08)`, () => {
        expect(min.power).toBeGreaterThanOrEqual(0.08);
      });

      it("is centred near a coin-flip on average", () => {
        // Every card beats every other on ~half of matchups by construction;
        // a large drift would mean systematically lop-sided stats.
        expect(avg).toBeGreaterThan(0.4);
        expect(avg).toBeLessThan(0.6);
      });
    });
  }
});
