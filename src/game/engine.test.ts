import { describe, expect, it } from "vitest";
import { DECKS } from "./decks";
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
    const g: import("../types").GameSnapshot = {
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
        cardsWon: 2,
      },
      winner: null,
      bot: null,
    };
    const next = continueAfterRound(g);
    expect(next.screen).toBe("game_over");
    expect(next.winner).toBe(2);
  });
});

describe("card conservation and final ties", () => {
  const card = (id: string, value: number) => ({ id, name: id, stats: { power: value } });
  function fixture(
    p1: ReturnType<typeof card>[],
    p2: ReturnType<typeof card>[],
    kitty: ReturnType<typeof card>[] = [],
  ) {
    return {
      ...newGame(DECKS[0], 42),
      theme: {
        ...DECKS[0],
        cards: [...p1, ...p2, ...kitty],
        stats: [{ id: "power", label: "Power", shortLabel: "P", higherIsBetter: true }],
      },
      screen: "opponent_view" as const,
      pendingStatId: "power",
      p1,
      p2,
      kitty,
    };
  }
  const ids = (g: import("../types").GameSnapshot) =>
    [...g.p1, ...g.p2, ...g.kitty].map((c) => c.id).sort();

  it.each([1, 2] as const)(
    "player %i takes the pair without losing the next unplayed card",
    (winner) => {
      const g = fixture(
        [card("a", winner === 1 ? 90 : 10), card("b", 20)],
        [card("c", 50), card("d", 30)],
      );
      const original = ids(g);
      const next = revealAndResolve(g);
      expect(ids(next)).toEqual(original);
      expect(next.p1.map((c) => c.id)).toEqual(winner === 1 ? ["b", "a", "c"] : ["b"]);
      expect(next.p2.map((c) => c.id)).toEqual(winner === 2 ? ["d", "a", "c"] : ["d"]);
      expect(next.lastRound?.cardsWon).toBe(2);
      expect(ids(g)).toEqual(original); // resolver is immutable
    },
  );

  it("preserves repeated ties and awards the entire kitty on the next decisive round", () => {
    let g: import("../types").GameSnapshot = fixture(
      [card("a", 50), card("b", 30), card("c", 80)],
      [card("d", 50), card("e", 30), card("f", 20)],
    );
    const original = ids(g);
    for (let round = 0; round < 3; round++) {
      g = revealAndResolve({ ...g, screen: "opponent_view", pendingStatId: "power" });
      expect(ids(g)).toEqual(original);
      if (round < 2) expect(g.kitty).toHaveLength((round + 1) * 2);
    }
    expect(g.p1).toHaveLength(6);
    expect(g.kitty).toHaveLength(0);
    expect(g.lastRound?.cardsWon).toBe(6);
    g = continueAfterRound(g);
    expect(g.winner).toBe(1);
    expect(ids(g)).toEqual(original);
  });

  it.each([1, 2] as const)(
    "the remaining player %i collects the kitty after the other player's final tie",
    (winner) => {
      const g = fixture(
        [card("a", 50), ...(winner === 1 ? [card("b", 10)] : [])],
        [card("c", 50), ...(winner === 2 ? [card("d", 10)] : [])],
        [card("earlier-tie", 40)],
      );
      const next = continueAfterRound(revealAndResolve(g));
      expect(next.screen).toBe("game_over");
      expect(next.winner).toBe(winner);
      expect(winner === 1 ? next.p1 : next.p2).toHaveLength(4);
      expect(next.kitty).toHaveLength(0);
      expect(ids(next)).toEqual(ids(g));
    },
  );

  it("both final cards tying produces a draw with every card still in the centre", () => {
    const g = fixture([card("a", 50)], [card("b", 50)], [card("c", 30), card("d", 30)]);
    const next = continueAfterRound(revealAndResolve(g));
    expect(next.screen).toBe("game_over");
    expect(next.winner).toBeNull();
    expect(next.kitty).toHaveLength(4);
    expect(ids(next)).toEqual(ids(g));
  });
});
