import type { GameSnapshot } from "../types";

/**
 * The slice of the game controller that screen modules are allowed to touch.
 * Screens receive this instead of importing the controller class, which keeps
 * the dependency arrow one-way (controller → screens) and avoids cycles.
 */
export interface GameContext {
  /** Current game state. Screens read it and may reassign it before re-rendering. */
  game: GameSnapshot;
  /** Re-draw the active screen and (re)schedule the bot if it is its turn. */
  render(): void;
  /** Cancel any pending bot action — call before leaving a match. */
  clearBotTimer(): void;
}
