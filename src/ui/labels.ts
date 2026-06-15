import type { DeckTheme, GameSnapshot, PlayerId } from "../types";

/** "Player 1" / "Player 2" — neutral seat name, used in pass-and-play. */
export function pLabel(id: PlayerId): string {
  return `Player ${id}`;
}

/**
 * Context-aware seat name. In a bot match the human is "You" and the bot is
 * named for its difficulty; in pass-and-play both sides are "Player N".
 */
export function playerLabel(id: PlayerId, g: GameSnapshot): string {
  if (!g.bot) return `Player ${id}`;
  if (id === g.bot.player) {
    return g.bot.difficulty === "hard"
      ? "Hard Bot"
      : g.bot.difficulty === "medium"
        ? "Medium Bot"
        : "Easy Bot";
  }
  return "You";
}

export function otherPlayer(p: PlayerId): PlayerId {
  return p === 1 ? 2 : 1;
}

/** The non-leader for the round. */
export function challenger(g: GameSnapshot): PlayerId {
  return otherPlayer(g.leader);
}

/** Zero-padded card number parsed from an id like "sw-07" → "07". */
export function cardNum(cardId: string): string {
  const n = parseInt(cardId.replace(/\D/g, ""), 10);
  return isNaN(n) ? "–" : String(n).padStart(2, "0");
}

/** Short, uppercased deck tag shown on the card header strip. */
export function deckShortName(theme: DeckTheme): string {
  return theme.title.split(" ")[0].substring(0, 8).toUpperCase();
}
