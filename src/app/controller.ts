import type { GameContext } from "./context";
import type { GameSnapshot, PlayerId } from "../types";
import {
  abandonToHome,
  acknowledgePass,
  acknowledgeRevealPass,
  revealAndResolve,
  selectStat,
} from "../game/engine";
import { decideStat } from "../game/bot";
import { setAccent } from "../ui/accent";
import { playerLabel } from "../ui/labels";
import { announce } from "../ui/announce";
import { showBootError } from "../ui/boot-error";

import { renderHome } from "../screens/home";
import { renderHowToPlay } from "../screens/how-to-play";
import { renderThemePick } from "../screens/theme-pick";
import { renderModePick } from "../screens/mode-pick";
import { renderPassDevice } from "../screens/pass-device";
import { renderChooseStat } from "../screens/choose-stat";
import { renderRevealPrompt } from "../screens/reveal-prompt";
import { renderOpponentView } from "../screens/opponent-view";
import { renderRoundResult } from "../screens/round-result";
import { renderGameOver } from "../screens/game-over";

/**
 * Owns the single game state, draws the active screen, and drives the bot.
 * Screens receive `this` (typed as the narrower {@link GameContext}) so they can
 * read/replace the state and request a re-render without importing the class.
 */
export class GameController implements GameContext {
  game: GameSnapshot = abandonToHome();
  private botTimerId: ReturnType<typeof setTimeout> | null = null;

  /** Cancel any pending bot action (e.g. when abandoning a match). */
  clearBotTimer(): void {
    if (this.botTimerId !== null) {
      clearTimeout(this.botTimerId);
      this.botTimerId = null;
    }
  }

  /** Advance the game by one bot move for the current screen. */
  private executeBotAction(): void {
    const g = this.game;
    if (!g.bot) return;
    const { player: botPlayer, difficulty } = g.bot;

    switch (g.screen) {
      case "pass_device":
        this.game = acknowledgePass(g);
        break;
      case "choose_stat":
        if (g.leader === botPlayer) {
          this.game = selectStat(g, decideStat(g, botPlayer, difficulty));
        }
        break;
      case "reveal_prompt":
        this.game = acknowledgeRevealPass(g);
        break;
      case "opponent_view":
        if (g.deviceHolder === botPlayer) {
          this.game = revealAndResolve(g);
          const lr = this.game.lastRound;
          if (lr) {
            if (lr.winner === "tie") announce("Draw — cards go to the centre pile.");
            else announce(`${playerLabel(lr.winner as PlayerId, this.game)} wins the trick.`);
          }
        }
        break;
    }
  }

  /** Queue the next bot move for the current screen, if it is the bot's turn. */
  private scheduleBot(): void {
    const g = this.game;
    if (!g.bot || this.botTimerId !== null) return;
    const { player: botPlayer, difficulty } = g.bot;

    let delay = 0;
    let shouldAct = false;

    if (g.screen === "pass_device") {
      shouldAct = true;
    } else if (g.screen === "choose_stat" && g.leader === botPlayer) {
      shouldAct = true;
      delay = difficulty === "easy" ? 1200 : difficulty === "medium" ? 800 : 500;
    } else if (g.screen === "reveal_prompt") {
      shouldAct = true;
    } else if (g.screen === "opponent_view" && g.deviceHolder === botPlayer) {
      shouldAct = true;
    }

    if (!shouldAct) return;

    this.botTimerId = setTimeout(() => {
      this.botTimerId = null;
      this.executeBotAction();
      this.render();
    }, delay);
  }

  /** Draw the active screen and (re)schedule the bot. */
  render(): void {
    try {
      const app = document.querySelector<HTMLElement>("#app");
      if (!app) return;
      setAccent(this.game.theme);
      app.replaceChildren();

      const main = document.createElement("main");
      main.className = "stack";
      main.dataset.screen = this.game.screen;

      switch (this.game.screen) {
        case "home":
          main.appendChild(renderHome(this));
          break;
        case "how_to_play":
          main.appendChild(renderHowToPlay(this));
          break;
        case "theme_pick":
          main.appendChild(renderThemePick(this));
          break;
        case "mode_pick":
          main.appendChild(renderModePick(this));
          break;
        case "pass_device":
          main.appendChild(renderPassDevice(this));
          break;
        case "choose_stat":
          main.appendChild(renderChooseStat(this));
          break;
        case "reveal_prompt":
          main.appendChild(renderRevealPrompt(this));
          break;
        case "opponent_view":
          main.appendChild(renderOpponentView(this));
          break;
        case "round_result":
          main.appendChild(renderRoundResult(this));
          break;
        case "game_over":
          main.appendChild(renderGameOver(this));
          break;
        default:
          main.textContent = "Unknown screen";
      }

      app.appendChild(main);
      window.scrollTo({ top: 0, behavior: "instant" });
      this.scheduleBot();
    } catch (e) {
      showBootError(e, "render");
    }
  }
}
