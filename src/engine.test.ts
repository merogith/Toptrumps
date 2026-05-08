import { describe, expect, it } from "vitest";
import { DECKS } from "./data/decks";
import {
  acknowledgePass,
  acknowledgeRevealPass,
  compareStat,
  continueAfterRound,
  newGame,
  revealAndResolve,
  selectStat,
  validateDeck,
} from "./engine";

describe("validateDeck", () => {
  it("accepts all bundled decks", () => {
    for (const d of DECKS) {
      expect(validateDeck(d)).toEqual([]);
    }
  });
});

describe("two-player flow", () => {
  it("runs a deterministic round with winner taking trick", () => {
    const deck = DECKS[0];
    let g = newGame(deck, 42);
    expect(g.screen).toBe("pass_device");
    expect(g.deviceHolder).not.toBe(g.leader);

    g = acknowledgePass(g);
    expect(g.screen).toBe("pass_device");
    expect(g.deviceHolder).toBe(g.leader);

    g = acknowledgePass(g);
    expect(g.screen).toBe("choose_stat");
    expect(g.deviceHolder).toBe(g.leader);

    const statId = deck.stats[0].id;
    g = selectStat(g, statId);
    expect(g.screen).toBe("reveal_prompt");

    g = acknowledgeRevealPass(g);
    expect(g.screen).toBe("opponent_view");

    g = revealAndResolve(g);
    expect(g.screen).toBe("round_result");
    expect(g.lastRound).not.toBeNull();
    expect(g.kitty.length).toBe(0);
    const won = g.lastRound!.winner;
    expect(won === 1 || won === 2 || won === "tie").toBe(true);
  });

  it("tie places cards in kitty and same leader chooses again", () => {
    const deck = structuredClone(DECKS[0]);
    const sid = deck.stats[0].id;
    const c0 = { ...deck.cards[0], stats: { ...deck.cards[0].stats, [sid]: 50 } };
    const c1 = { ...deck.cards[1], stats: { ...deck.cards[1].stats, [sid]: 50 } };

    let g = newGame(deck, 1);
    g.p1[0] = c0;
    g.p2[0] = c1;

    g = acknowledgePass(g);
    g = acknowledgePass(g);
    g = selectStat(g, sid);
    g = acknowledgeRevealPass(g);
    g = revealAndResolve(g);
    expect(g.lastRound?.winner).toBe("tie");
    expect(g.kitty.length).toBe(2);
    expect(g.leader).toBe(1);
  });
});

describe("compareStat", () => {
  it("higher wins when higherIsBetter", () => {
    expect(compareStat(5, 3, true)).toBe("p1");
    expect(compareStat(3, 5, true)).toBe("p2");
  });
  it("lower wins when not higherIsBetter", () => {
    expect(compareStat(5, 8, false)).toBe("p1");
    expect(compareStat(9, 4, false)).toBe("p2");
  });
  it("ties", () => {
    expect(compareStat(7, 7, true)).toBe("tie");
  });
});

describe("continueAfterRound", () => {
  it("transitions to game_over when a player has no cards", () => {
    const deck = DECKS[0];
    const c = deck.cards[0];
    const g: import("./types").GameSnapshot = {
      screen: "round_result",
      theme: deck,
      shuffledIds: [],
      p1: [],
      p2: [{ ...c, id: "only" }],
      kitty: [],
      leader: 2,
      deviceHolder: 2,
      pendingStatId: null,
      lastRound: {
        statId: deck.stats[0].id,
        statLabel: deck.stats[0].label,
        p1Card: c,
        p2Card: c,
        p1Value: 1,
        p2Value: 2,
        winner: 2,
        higherIsBetter: true,
      },
      winner: null,
      bot: null,
    };
    const next = continueAfterRound(g);
    expect(next.screen).toBe("game_over");
    expect(next.winner).toBe(2);
  });
});
