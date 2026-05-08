import type { Card, DeckTheme, GameSnapshot, PlayerId, StatDef } from "./types";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rnd = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dealEven(cards: Card[]): { p1: Card[]; p2: Card[]; kitty: Card[] } {
  const p1: Card[] = [];
  const p2: Card[] = [];
  cards.forEach((c, i) => {
    if (i % 2 === 0) p1.push(c);
    else p2.push(c);
  });
  return { p1, p2, kitty: [] };
}

export function compareStat(
  a: number,
  b: number,
  higherIsBetter: boolean
): "p1" | "p2" | "tie" {
  if (a === b) return "tie";
  if (higherIsBetter) return a > b ? "p1" : "p2";
  return a < b ? "p1" : "p2";
}

export function findStatDef(theme: DeckTheme, statId: string): StatDef | undefined {
  return theme.stats.find((s) => s.id === statId);
}

export function newGame(
  theme: DeckTheme,
  seed: number,
  bot: GameSnapshot["bot"] = null
): GameSnapshot {
  const shuffled = shuffle(theme.cards, seed).map((c) => c.id);
  const byId = new Map(theme.cards.map((c) => [c.id, c]));
  const ordered = shuffled.map((id) => byId.get(id)!);
  const { p1, p2, kitty } = dealEven(ordered);
  const leader: PlayerId = 1;
  const challenger: PlayerId = leader === 1 ? 2 : 1;
  return {
    screen: "pass_device",
    theme,
    shuffledIds: shuffled,
    p1,
    p2,
    kitty,
    leader,
    /** Challenger confirms they are not peeking before the leader sees their card. */
    deviceHolder: challenger,
    pendingStatId: null,
    lastRound: null,
    winner: null,
    bot,
  };
}

function appendBottom(stack: Card[], won: Card[]): Card[] {
  return [...stack.slice(1), ...won];
}

function otherPlayer(p: PlayerId): PlayerId {
  return p === 1 ? 2 : 1;
}

/**
 * Start-of-round pass-and-play: challenger confirms privacy, then leader takes
 * the device and picks a stat (official Top Trumps: leader left of dealer).
 */
export function acknowledgePass(g: GameSnapshot): GameSnapshot {
  if (g.screen !== "pass_device") return g;
  const { leader, deviceHolder } = g;
  if (deviceHolder !== leader) {
    return { ...g, deviceHolder: leader };
  }
  return { ...g, screen: "choose_stat", deviceHolder: leader };
}

export function selectStat(g: GameSnapshot, statId: string): GameSnapshot {
  if (g.screen !== "choose_stat" || !g.theme) return g;
  if (!g.theme.stats.some((s) => s.id === statId)) return g;
  if (g.deviceHolder !== g.leader) return g;
  const challenger = otherPlayer(g.leader);
  return {
    ...g,
    pendingStatId: statId,
    screen: "reveal_prompt",
    deviceHolder: challenger,
  };
}

/** Challenger has the device; they confirm before seeing their card and the category. */
export function acknowledgeRevealPass(g: GameSnapshot): GameSnapshot {
  if (g.screen !== "reveal_prompt" || !g.pendingStatId) return g;
  const challenger = otherPlayer(g.leader);
  if (g.deviceHolder !== challenger) return g;
  return { ...g, screen: "opponent_view", deviceHolder: challenger };
}

export function revealAndResolve(g: GameSnapshot): GameSnapshot {
  if (g.screen !== "opponent_view") return g;
  if (!g.theme || !g.pendingStatId) return g;
  if (g.p1.length === 0 || g.p2.length === 0) return resolveWinner({ ...g, screen: "game_over" });

  const stat = findStatDef(g.theme, g.pendingStatId);
  if (!stat) return g;

  const c1 = g.p1[0];
  const c2 = g.p2[0];
  const v1 = c1.stats[g.pendingStatId];
  const v2 = c2.stats[g.pendingStatId];
  const outcome = compareStat(v1, v2, stat.higherIsBetter);

  const trick: Card[] = [c1, c2, ...g.kitty];
  const emptyKitty: Card[] = [];

  let nextP1 = g.p1.slice(1);
  let nextP2 = g.p2.slice(1);
  let winner: PlayerId;

  if (outcome === "tie") {
    return {
      ...g,
      p1: nextP1,
      p2: nextP2,
      kitty: trick,
      leader: g.leader,
      pendingStatId: null,
      lastRound: {
        statId: stat.id,
        statLabel: stat.label,
        p1Card: c1,
        p2Card: c2,
        p1Value: v1,
        p2Value: v2,
        winner: "tie",
        higherIsBetter: stat.higherIsBetter,
      },
      screen: "round_result",
      deviceHolder: g.leader,
    };
  }

  winner = outcome === "p1" ? 1 : 2;
  if (winner === 1) {
    nextP1 = appendBottom(nextP1, trick);
  } else {
    nextP2 = appendBottom(nextP2, trick);
  }

  const next: GameSnapshot = {
    ...g,
    p1: nextP1,
    p2: nextP2,
    kitty: emptyKitty,
    leader: winner,
    pendingStatId: null,
    lastRound: {
      statId: stat.id,
      statLabel: stat.label,
      p1Card: c1,
      p2Card: c2,
      p1Value: v1,
      p2Value: v2,
      winner,
      higherIsBetter: stat.higherIsBetter,
    },
    screen: "round_result",
    deviceHolder: winner,
  };

  /* Show the comparison first; continueAfterRound moves to game_over if a pile is empty. */
  return next;
}

function resolveWinner(g: GameSnapshot): GameSnapshot {
  let winner: PlayerId | null = null;
  if (g.p1.length === 0 && g.p2.length > 0) winner = 2;
  else if (g.p2.length === 0 && g.p1.length > 0) winner = 1;
  else if (g.p1.length === 0 && g.p2.length === 0) winner = null;
  return { ...g, winner, screen: "game_over", deviceHolder: winner ?? 1 };
}

export function continueAfterRound(g: GameSnapshot): GameSnapshot {
  if (g.screen === "game_over") return g;
  if (g.screen !== "round_result") return g;

  if (g.p1.length === 0 || g.p2.length === 0) {
    return resolveWinner({ ...g, screen: "round_result" });
  }

  return {
    ...g,
    screen: "pass_device",
    deviceHolder: otherPlayer(g.leader),
    lastRound: g.lastRound,
  };
}

export function abandonToHome(): GameSnapshot {
  return {
    screen: "home",
    theme: null,
    shuffledIds: [],
    p1: [],
    p2: [],
    kitty: [],
    leader: 1,
    deviceHolder: 1,
    pendingStatId: null,
    lastRound: null,
    winner: null,
    bot: null,
  };
}

export function pickThemeScreen(): Partial<GameSnapshot> {
  return { screen: "theme_pick", theme: null };
}

/** Validates deck shape for release sanity. */
export function validateDeck(theme: DeckTheme): string[] {
  const errors: string[] = [];
  const n = theme.cards.length;
  if (n < 20 || n > 36) errors.push(`Card count ${n} should be typical Top Trumps range (e.g. 30).`);
  if (theme.stats.length < 5 || theme.stats.length > 8) errors.push(`Stat count should be 5–8, got ${theme.stats.length}.`);
  const statIds = new Set(theme.stats.map((s) => s.id));
  for (const c of theme.cards) {
    for (const sid of statIds) {
      if (typeof c.stats[sid] !== "number") errors.push(`Card ${c.id} missing stat ${sid}`);
    }
    for (const k of Object.keys(c.stats)) {
      if (!statIds.has(k)) errors.push(`Card ${c.id} has unknown stat ${k}`);
    }
  }
  return errors;
}

