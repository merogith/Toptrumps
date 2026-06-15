import type { GameContext } from "../app/context";
import { acknowledgeRevealPass } from "../game/engine";
import { renderHUD } from "../components/hud";
import { el, escapeHtml } from "../ui/dom";
import { pLabel, otherPlayer } from "../ui/labels";
import { announce } from "../ui/announce";

/**
 * Second privacy gate: the leader has locked in a stat; now the device passes
 * to the challenger so they can see their own card (but not the leader's value).
 */
export function renderRevealPrompt(ctx: GameContext): HTMLElement {
  const g = ctx.game;
  const frag = el("div", "stack");
  if (!g.theme || !g.pendingStatId) return frag;

  frag.appendChild(renderHUD(g));

  /* In bot mode the privacy step is unnecessary — it auto-advances. */
  if (g.bot) return frag;

  const stat = g.theme.stats.find((x) => x.id === g.pendingStatId);

  const screen = el("div", "privacy-screen");

  const lockDiv = el("div", "privacy-lock");
  lockDiv.setAttribute("aria-hidden", "true");
  lockDiv.textContent = "🔒";

  const playerName = el("div", "privacy-player-name");
  playerName.textContent = pLabel(g.deviceHolder);

  const title = el("h2");
  title.textContent = `${pLabel(otherPlayer(g.deviceHolder))} — look away`;

  const statChip = el("div");
  statChip.innerHTML = `<span class="badge" style="font-size:0.85rem;padding:0.3rem 0.8rem">${escapeHtml(stat?.label ?? "—")} locked in</span>`;
  statChip.style.textAlign = "center";

  const instruction = el("p", "privacy-instruction");
  instruction.textContent = `Hand the device to ${pLabel(g.deviceHolder)}. They will see their own card — not the leader's value.`;

  const ok = el("button", "btn btn-primary");
  ok.type = "button";
  ok.textContent = `I'm ${pLabel(g.deviceHolder)} — show my card`;
  ok.addEventListener("click", () => {
    ctx.game = acknowledgeRevealPass(ctx.game);
    announce("Review your card, then tap Reveal result.");
    ctx.render();
  });

  screen.append(lockDiv, playerName, title, statChip, instruction, ok);
  frag.appendChild(screen);

  return frag;
}
