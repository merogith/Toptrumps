import { describe, expect, it } from "vitest";
import { DECKS } from "./data/decks";
import {
  acknowledgePass,
  acknowledgeRevealPass,
  continueAfterRound,
  newGame,
  revealAndResolve,
  selectStat,
} from "./engine";
import type { GameSnapshot } from "./types";

/**
 * Simulates the same steps the UI takes until the game ends.
 * Proves a match always reaches game_over with a winner.
 */
function stepGame(g: GameSnapshot): GameSnapshot {
  switch (g.screen) {
    case "pass_device":
      return acknowledgePass(acknowledgePass(g));
    case "choose_stat": {
      const sid = g.theme!.stats[0].id;
      return selectStat(g, sid);
    }
    case "reveal_prompt":
      return acknowledgeRevealPass(g);
    case "opponent_view":
      return revealAndResolve(g);
    case "round_result":
      return continueAfterRound(g);
    case "game_over":
      return g;
    default:
      throw new Error(`Unexpected screen in simulation: ${g.screen}`);
  }
}

describe("full match simulation", () => {
  it("reaches game_over with a single winner for each deck (seed 0)", () => {
    for (const deck of DECKS) {
      let g = newGame(deck, 0);
      let steps = 0;
      const maxSteps = 5000;
      while (g.screen !== "game_over" && steps < maxSteps) {
        g = stepGame(g);
        steps++;
      }
      expect(steps, deck.id).toBeLessThan(maxSteps);
      expect(g.screen).toBe("game_over");
      expect(g.winner).not.toBeNull();
      expect(g.p1.length === 0 || g.p2.length === 0).toBe(true);
    }
  });
});
