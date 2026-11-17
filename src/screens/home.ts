import type { GameContext } from "../app/context";
import { DECKS } from "../game/decks";
import { el, escapeHtml } from "../ui/dom";
import { announce } from "../ui/announce";
import { newGame } from "../game/engine";
import { randomSeed } from "../game/rng";

/** Landing screen: title, primary actions, and a row of feature highlights. */
export function renderHome(ctx: GameContext): HTMLElement {
  const frag = el("div", "stack");

  const hero = el("div", "home-hero");
  hero.innerHTML = `
    <div class="game-logo" aria-hidden="true">🃏</div>
    <h1>Top Trumps</h1>
    <p class="tagline">Pass &amp; play with a friend — or take on the bot. No peeking!</p>
  `;
  frag.appendChild(hero);

  const actions = el("div", "home-actions");

  const quick = el("button", "btn btn-primary");
  quick.type = "button";
  quick.textContent = "Play Field Lab vs Easy bot";
  quick.addEventListener("click", () => {
    ctx.game = newGame(DECKS.find((deck) => deck.id === "field-lab")!, randomSeed(), {
      player: 2,
      difficulty: "easy",
    });
    announce("Field Lab started. Pick a stat on your card to challenge the bot.");
    ctx.render();
  });

  const play = el("button", "btn btn-ghost");
  play.type = "button";
  play.textContent = "Choose deck";
  play.addEventListener("click", () => {
    ctx.game = { ...ctx.game, screen: "theme_pick" };
    announce("Choose a deck to play.");
    ctx.render();
  });

  const rules = el("button", "btn btn-ghost");
  rules.type = "button";
  rules.textContent = "How to play";
  rules.addEventListener("click", () => {
    ctx.game = { ...ctx.game, screen: "how_to_play" };
    ctx.render();
  });

  actions.append(quick, play, rules);
  frag.appendChild(actions);

  const hint = el("p", "score-line");
  hint.textContent =
    "Start with 15 cards. Pick a stat, compare, and collect the winning pair. No account or setup needed.";
  frag.appendChild(hint);

  const features = el("div", "home-feature-row");
  const chips: [string, string, string][] = [
    ["🎲", `${DECKS.length} Decks`, "Sci-fi, history, cartoons & more"],
    ["🔒", "Pass & Play", "Privacy flow between turns"],
    ["🏆", "30 Cards", "6 stats · 1–99 values"],
  ];
  for (const [icon, lbl, sub] of chips) {
    const chip = el("div", "feature-chip");
    chip.innerHTML = `<div class="fc-icon" aria-hidden="true">${icon}</div><span class="fc-label">${escapeHtml(lbl)}</span><span class="fc-sub">${escapeHtml(sub)}</span>`;
    features.appendChild(chip);
  }
  frag.appendChild(features);

  return frag;
}
