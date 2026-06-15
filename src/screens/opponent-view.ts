import type { GameContext } from "../app/context";
import type { Card, GameSnapshot, PlayerId } from "../types";
import { revealAndResolve } from "../game/engine";
import { renderHUD } from "../components/hud";
import { renderCard } from "../components/card";
import { el, escapeHtml } from "../ui/dom";
import { pLabel, playerLabel, challenger, otherPlayer } from "../ui/labels";
import { announce } from "../ui/announce";

function challengerCard(g: GameSnapshot): Card | null {
  const c = otherPlayer(g.leader);
  return c === 1 ? (g.p1[0] ?? null) : (g.p2[0] ?? null);
}

/** The challenger reviews their own card with the chosen stat highlighted. */
export function renderOpponentView(ctx: GameContext): HTMLElement {
  const g = ctx.game;
  const frag = el("div", "stack");
  if (!g.theme || !g.pendingStatId) return frag;

  frag.appendChild(renderHUD(g));

  /* Bot is the challenger — it auto-reveals; just show the HUD briefly. */
  if (g.bot && g.deviceHolder === g.bot.player) return frag;

  /* Sticky action bar pinned to the top so the player can tap Reveal without
     scrolling past the full card. */
  const ctaBar = el("div", "play-cta-dock");
  const revealBtn = el("button", "btn btn-primary");
  revealBtn.type = "button";
  revealBtn.textContent = "Reveal round result";
  revealBtn.addEventListener("click", () => {
    ctx.game = revealAndResolve(ctx.game);
    if (ctx.game.lastRound) {
      if (ctx.game.lastRound.winner === "tie") announce("Draw — cards go to the centre pile.");
      else announce(`${pLabel(ctx.game.lastRound.winner as PlayerId)} wins the trick.`);
    }
    ctx.render();
  });
  ctaBar.appendChild(revealBtn);
  frag.appendChild(ctaBar);

  const chall = challenger(g);
  const banner = el("div", "player-banner");
  const dot = el("span", "banner-dot");
  const bannerText = el("span");
  bannerText.textContent = `${playerLabel(chall, g)} — your top card`;
  banner.append(dot, bannerText);
  frag.appendChild(banner);

  const stat = g.theme.stats.find((x) => x.id === g.pendingStatId);

  const hint = el("p");
  hint.innerHTML = `The leader chose <strong>${escapeHtml(stat?.label ?? "—")}</strong>. Your value is highlighted below.`;
  hint.style.textAlign = "center";
  hint.style.fontSize = "0.85rem";
  frag.appendChild(hint);

  const card = challengerCard(g);
  if (!card) {
    frag.textContent = "Error: no card found.";
    return frag;
  }

  frag.appendChild(renderCard(g.theme, card, { activeStatId: g.pendingStatId }));

  return frag;
}
