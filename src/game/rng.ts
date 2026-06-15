/**
 * Deterministic, seedable pseudo-random number generator.
 *
 * `mulberry32` is a tiny, fast 32-bit PRNG. Seeding it means a given match
 * can be replayed exactly (used by tests and the deterministic shuffle), while
 * a time-based seed gives players a fresh deal every game.
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle. Pure: returns a new array, leaves the input untouched. */
export function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rnd = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A fresh, non-deterministic seed for a new match. */
export function randomSeed(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}
