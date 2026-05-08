import type { Difficulty, GameSnapshot, PlayerId } from "./types";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function indexOfBestStat(
  card: { stats: Record<string, number> },
  stats: Array<{ id: string; higherIsBetter: boolean }>
): number {
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    const score = s.higherIsBetter ? card.stats[s.id] : -card.stats[s.id];
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/**
 * Easy   — 35% random pick, 65% highest stat. Feels amateur; anyone can beat it.
 * Medium — Always picks the highest absolute-value stat. Greedy but no opponent
 *           modeling; consistent and predictable once you learn it.
 * Hard   — Calculates win rate against every card not in its own pile or the kitty,
 *           then picks the stat with the best expected outcome. Proper card counting.
 */
export function decideStat(
  g: GameSnapshot,
  botPlayer: PlayerId,
  difficulty: Difficulty
): string {
  const stats = g.theme!.stats;
  const myCard = botPlayer === 1 ? g.p1[0] : g.p2[0];
  if (!myCard) return stats[0].id;

  if (difficulty === "easy") {
    if (Math.random() < 0.35) return pickRandom(stats).id;
    return stats[indexOfBestStat(myCard, stats)].id;
  }

  if (difficulty === "medium") {
    return stats[indexOfBestStat(myCard, stats)].id;
  }

  // hard: win-rate analysis against all inferred opponent cards
  const myPileIds = new Set((botPlayer === 1 ? g.p1 : g.p2).map((c) => c.id));
  const kittyIds = new Set(g.kitty.map((c) => c.id));
  const possible = g.theme!.cards.filter(
    (c) => !myPileIds.has(c.id) && !kittyIds.has(c.id)
  );

  let bestId = stats[0].id;
  let bestRate = -1;

  for (const s of stats) {
    const mine = myCard.stats[s.id];
    let wins = 0;
    for (const opp of possible) {
      const theirs = opp.stats[s.id];
      if (s.higherIsBetter ? mine > theirs : mine < theirs) wins++;
    }
    const rate = possible.length > 0 ? wins / possible.length : 0;
    if (rate > bestRate) {
      bestRate = rate;
      bestId = s.id;
    }
  }
  return bestId;
}
