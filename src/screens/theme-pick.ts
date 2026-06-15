import type { GameContext } from "../app/context";
import { DECKS } from "../game/decks";
import { abandonToHome } from "../game/engine";
import { el, escapeHtml } from "../ui/dom";
import { deckIcon } from "../ui/icons";

/** Deck picker grid. */
export function renderThemePick(ctx: GameContext): HTMLElement {
  const frag = el("div", "stack");

  const hdr = el("div");
  hdr.innerHTML = `<h1>Pick a deck</h1><p>${DECKS.length} themes · 30 cards each · 6 stats · classic Top Trumps rules.</p>`;
  frag.appendChild(hdr);

  const grid = el("div", "theme-grid");
  for (const deck of DECKS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-card";
    btn.style.setProperty("--theme-accent", deck.accent);
    btn.style.setProperty("--theme-accent-raw", deck.accent);

    btn.innerHTML = `
      <span class="deck-icon" aria-hidden="true">${deckIcon(deck.id)}</span>
      <span class="badge">${deck.stats.length} stats · 30 cards</span>
      <h3>${escapeHtml(deck.title)}</h3>
      <p class="tagline">${escapeHtml(deck.tagline)}</p>
    `;

    btn.addEventListener("click", () => {
      ctx.game = { ...ctx.game, screen: "mode_pick", theme: deck };
      ctx.render();
    });

    grid.appendChild(btn);
  }
  frag.appendChild(grid);

  const tb = el("div", "toolbar");
  const back = el("button", "btn btn-ghost");
  back.type = "button";
  back.textContent = "← Home";
  back.addEventListener("click", () => {
    ctx.game = abandonToHome();
    ctx.render();
  });
  tb.appendChild(back);
  frag.appendChild(tb);

  return frag;
}
