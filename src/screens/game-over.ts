import type { GameContext } from "../app/context";
import { abandonToHome, newGame } from "../game/engine";
import { getDeckById } from "../game/decks";
import { randomSeed } from "../game/rng";
import { el, escapeHtml } from "../ui/dom";
import { deckIcon } from "../ui/icons";
import { pLabel, playerLabel } from "../ui/labels";
import { announce } from "../ui/announce";

/** End-of-match screen: winner, a small stats panel, and rematch/menu actions. */
export function renderGameOver(ctx: GameContext): HTMLElement {
  const g = ctx.game;
  const frag = el("div", "stack");

  const hero = el("div", "game-over-hero");
  const trophy = el("div", "game-over-trophy");
  trophy.setAttribute("aria-hidden", "true");
  trophy.textContent = g.winner ? "🏆" : "🤝";
  const headline = el("h1");
  headline.textContent = g.winner ? `${playerLabel(g.winner, g)} wins!` : "Game over!";
  const sub = el("p");
  sub.textContent = g.winner
    ? `${playerLabel(g.winner, g)} collected all 30 cards — classic Top Trumps victory.`
    : "The deck ran out with no clear winner.";
  hero.append(trophy, headline, sub);
  frag.appendChild(hero);

  /* Stats panel */
  if (g.theme) {
    const statsGrid = el("div", "game-stats-grid");

    const themeChip = el("div", "game-stat-chip");
    themeChip.innerHTML = `<span class="chip-val">${deckIcon(g.theme.id)}</span><span class="chip-lbl">${escapeHtml(g.theme.title)}</span>`;

    const winChip = el("div", "game-stat-chip");
    winChip.innerHTML = `<span class="chip-val">${g.winner ?? "—"}</span><span class="chip-lbl">Winner</span>`;

    statsGrid.append(themeChip, winChip);
    frag.appendChild(statsGrid);
  }

  /* Final trick info */
  if (g.lastRound) {
    const panel = el("div", "panel");
    panel.innerHTML = `<p>Final round used <strong>${escapeHtml(g.lastRound.statLabel)}</strong> — ${pLabel(1)}: ${g.lastRound.p1Value} vs ${pLabel(2)}: ${g.lastRound.p2Value}.</p>`;
    frag.appendChild(panel);
  }

  /* Action buttons */
  const row = el("div", "row");

  const again = el("button", "btn btn-primary");
  again.type = "button";
  again.textContent = "Rematch (same deck)";
  again.addEventListener("click", () => {
    const deck = ctx.game.theme?.id ? getDeckById(ctx.game.theme.id) : undefined;
    if (deck) {
      ctx.game = newGame(deck, randomSeed(), ctx.game.bot); // preserve mode (2P or bot difficulty)
      announce("New match started.");
    }
    ctx.render();
  });

  const menu = el("button", "btn btn-ghost");
  menu.type = "button";
  menu.textContent = "Pick deck";
  menu.addEventListener("click", () => {
    ctx.game = { ...abandonToHome(), screen: "theme_pick" };
    ctx.render();
  });

  const home = el("button", "btn btn-ghost");
  home.type = "button";
  home.textContent = "Home";
  home.addEventListener("click", () => {
    ctx.game = abandonToHome();
    ctx.render();
  });

  row.append(again, menu, home);
  frag.appendChild(row);

  return frag;
}
