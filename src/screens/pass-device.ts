import type { GameContext } from "../app/context";
import { acknowledgePass } from "../game/engine";
import { renderHUD } from "../components/hud";
import { el } from "../ui/dom";
import { pLabel, otherPlayer } from "../ui/labels";
import { announce } from "../ui/announce";
import { abandonToolbar } from "./shared";

/**
 * Privacy gate at the start of a round. There are two confirmations: the
 * challenger looks away, then the leader takes the device. In bot matches the
 * step is invisible — it auto-advances and only the HUD is shown.
 */
export function renderPassDevice(ctx: GameContext): HTMLElement {
  const g = ctx.game;
  const frag = el("div", "stack");
  if (!g.theme) return frag;

  frag.appendChild(renderHUD(g));

  /* In bot mode every pass_device screen auto-advances — just show the HUD. */
  if (g.bot) return frag;

  const holder = g.deviceHolder;
  const isFirstPass = holder !== g.leader; // challenger step (look away)

  const screen = el("div", "privacy-screen");

  const lockDiv = el("div", "privacy-lock");
  lockDiv.setAttribute("aria-hidden", "true");
  lockDiv.textContent = isFirstPass ? "🔒" : "👁";

  const playerName = el("div", "privacy-player-name");
  playerName.textContent = pLabel(holder);

  const title = el("h2");
  title.textContent = isFirstPass
    ? `${pLabel(otherPlayer(holder))} — look away now`
    : `${pLabel(holder)} — your turn`;

  const instruction = el("p", "privacy-instruction");
  instruction.textContent = isFirstPass
    ? `Hand the device to ${pLabel(holder)}. The other player should not look until asked.`
    : `You have the device. Press continue to see your top card and choose a stat.`;

  const ok = el("button", "btn btn-primary");
  ok.type = "button";
  ok.textContent = `I'm ${pLabel(holder)} — continue`;
  ok.addEventListener("click", () => {
    ctx.game = acknowledgePass(ctx.game);
    if (ctx.game.screen === "choose_stat") {
      announce(`${pLabel(ctx.game.leader)}, choose a stat on your top card.`);
    } else {
      announce(`Pass to ${pLabel(ctx.game.deviceHolder)}.`);
    }
    ctx.render();
  });

  screen.append(lockDiv, playerName, title, instruction, ok);
  frag.appendChild(screen);

  frag.appendChild(abandonToolbar(ctx, "Abandon this match and return to the main menu?"));

  return frag;
}
