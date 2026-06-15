import type { GameContext } from "../app/context";
import { abandonToHome } from "../game/engine";
import { el } from "../ui/dom";
import { announce } from "../ui/announce";

/**
 * The "Abandon match" toolbar shared by the in-game screens. Confirms, cancels
 * any pending bot move, and returns to the main menu.
 */
export function abandonToolbar(ctx: GameContext, confirmMsg: string): HTMLElement {
  const tb = el("div", "toolbar");
  const quit = el("button", "btn btn-danger btn-sm");
  quit.type = "button";
  quit.textContent = "Abandon match";
  quit.addEventListener("click", () => {
    if (confirm(confirmMsg)) {
      ctx.clearBotTimer();
      ctx.game = abandonToHome();
      announce("Returned to menu.");
      ctx.render();
    }
  });
  tb.appendChild(quit);
  return tb;
}
