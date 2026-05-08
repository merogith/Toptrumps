export type PlayerId = 1 | 2;

export type Difficulty = "easy" | "medium" | "hard";

export interface StatDef {
  id: string;
  label: string;
  shortLabel: string;
  /** When false, lower numeric value wins (e.g. reaction time). */
  higherIsBetter: boolean;
}

export interface Card {
  id: string;
  name: string;
  subtitle?: string;
  stats: Record<string, number>;
}

export interface DeckTheme {
  id: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  accentSoft: string;
  stats: StatDef[];
  cards: Card[];
}

export type ScreenId =
  | "home"
  | "how_to_play"
  | "theme_pick"
  | "mode_pick"
  | "pass_device"
  | "choose_stat"
  | "reveal_prompt"
  | "opponent_view"
  | "round_result"
  | "game_over";

export interface GameSnapshot {
  screen: ScreenId;
  theme: DeckTheme | null;
  /** Deck order after shuffle (full list). */
  shuffledIds: string[];
  p1: Card[];
  p2: Card[];
  kitty: Card[];
  leader: PlayerId;
  /** Player who must confirm they have the device (pass-and-play). */
  deviceHolder: PlayerId;
  pendingStatId: string | null;
  lastRound: {
    statId: string;
    statLabel: string;
    p1Card: Card;
    p2Card: Card;
    p1Value: number;
    p2Value: number;
    winner: PlayerId | "tie";
    higherIsBetter: boolean;
  } | null;
  winner: PlayerId | null;
  /** Null means 2-player pass-and-play. When set, that player is the bot. */
  bot: { player: PlayerId; difficulty: Difficulty } | null;
}
