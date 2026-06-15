/** Emoji icon shown for each deck on the picker, mode screen and game-over card. */
export const DECK_ICONS: Record<string, string> = {
  starwars: "🚀",
  foundation: "🔮",
  medieval: "⚔️",
  pokemon: "⚡",
  spongebob: "🧽",
  behzat: "🕵️",
};

/** Icon for a deck id, falling back to a generic card face. */
export function deckIcon(id: string): string {
  return DECK_ICONS[id] ?? "🎴";
}
