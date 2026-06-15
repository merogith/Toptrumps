import type { GameContext } from "../app/context";
import type { Card, GameSnapshot } from "../types";
import { selectStat } from "../game/engine";
import { renderHUD } from "../components/hud";
import { renderBotThinking } from "../components/bot-thinking";
import { renderCard } from "../components/card";
import { el } from "../ui/dom";
import { playerLabel } from "../ui/labels";
import { announce } from "../ui/announce";
import { abandonToolbar } from "./shared";

function leaderCard(g: GameSnapshot): Card | null {
  return g.leader === 1 ? (g.p1[0] ?? null) : (g.p2[0] ?? null);
}

/** The leader sees their top card and taps a stat to challenge with. */
export function renderChooseStat(ctx: GameContext): HTMLElement {
  const g = ctx.game;
  const frag = el("div", "stack");
  if (!g.theme) return frag;

  frag.appendChild(renderHUD(g));

  /* Bot is the leader — show the thinking indicator; scheduleBot auto-picks. */
  if (g.bot && g.bot.player === g.leader) {
    frag.appendChild(renderBotThinking(g.bot.difficulty));
    return frag;
  }

  const banner = el("div", "player-banner");
  const dot = el("span", "banner-dot");
  const bannerText = el("span");
  bannerText.textContent = `${playerLabel(g.leader, g)} — pick a stat to challenge`;
  banner.append(dot, bannerText);
  frag.appendChild(banner);

  const card = leaderCard(g);
  if (!card) {
    frag.appendChild(document.createTextNode("No cards remaining."));
    return frag;
  }

  frag.appendChild(
    renderCard(g.theme, card, {
      activeStatId: null,
      onStatSelect: (statId) => {
        const stat = ctx.game.theme!.stats.find((s) => s.id === statId);
        ctx.game = selectStat(ctx.game, statId);
        announce(`${stat?.label ?? statId} chosen.`);
        ctx.render();
      },
    }),
  );

  frag.appendChild(abandonToolbar(ctx, "Abandon this match?"));

  return frag;
}
