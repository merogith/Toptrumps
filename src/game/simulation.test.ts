import { describe, expect, it, vi } from "vitest";
import { DECKS } from "./decks";
import { decideStat } from "./bot";
import { mulberry32 } from "./rng";
import {
  acknowledgePass,
  acknowledgeRevealPass,
  continueAfterRound,
  newGame,
  revealAndResolve,
  selectStat,
} from "./engine";
import type { Difficulty, GameSnapshot } from "../types";

function cardIds(g: GameSnapshot): string[] {
  return [...g.p1, ...g.p2, ...g.kitty].map((card) => card.id).sort();
}

describe("complete matches preserve every card", () => {
  for (const deck of DECKS) {
    for (const difficulty of [null, "easy", "medium", "hard"] as const) {
      it(`${deck.id}: ${difficulty ?? "two humans"} reaches an outcome with the original deck`, () => {
        const random = mulberry32(42);
        const spy = vi.spyOn(Math, "random").mockImplementation(random);
        try {
          const bot = difficulty
            ? { player: 2 as const, difficulty: difficulty as Difficulty }
            : null;
          let g = newGame(deck, 42, bot);
          const original = cardIds(g);
          let rounds = 0;
          while (g.screen !== "game_over" && rounds < 10000) {
            g = acknowledgePass(acknowledgePass(g));
            const stat =
              bot && g.leader === bot.player
                ? decideStat(g, bot.player, bot.difficulty)
                : deck.stats[Math.floor(random() * deck.stats.length)].id;
            g = selectStat(g, stat);
            g = acknowledgeRevealPass(g);
            g = revealAndResolve(g);
            expect(cardIds(g)).toEqual(original);
            g = continueAfterRound(g);
            expect(cardIds(g)).toEqual(original);
            rounds++;
          }
          expect(g.screen).toBe("game_over");
          if (g.winner) {
            expect(g.winner === 1 ? g.p1 : g.p2).toHaveLength(deck.cards.length);
            expect(g.kitty).toHaveLength(0);
          } else {
            expect(g.p1.length + g.p2.length).toBe(0);
            expect(g.kitty).toHaveLength(deck.cards.length);
          }
        } finally {
          spy.mockRestore();
        }
      });
    }
  }
});
