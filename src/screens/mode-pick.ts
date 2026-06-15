import type { GameContext } from "../app/context";
import type { Difficulty } from "../types";
import { newGame } from "../game/engine";
import { randomSeed } from "../game/rng";
import { el } from "../ui/dom";
import { deckIcon } from "../ui/icons";
import { announce } from "../ui/announce";

const DIFFS: Array<{ d: Difficulty; icon: string; name: string; desc: string }> = [
  { d: "easy", icon: "👾", name: "Easy", desc: "Slips up sometimes" },
  { d: "medium", icon: "🤖", name: "Medium", desc: "Plays its best stat every turn" },
  { d: "hard", icon: "🧠", name: "Hard", desc: "Counts every card in the deck" },
];

/** Mode picker: 2-player pass-and-play, or vs the computer at three difficulties. */
export function renderModePick(ctx: GameContext): HTMLElement {
  const frag = el("div", "stack");
  const deck = ctx.game.theme;
  if (!deck) return frag;

  /* Deck context strip */
  const strip = el("div", "mode-deck-strip");
  const stripIcon = el("span", "mds-icon");
  stripIcon.setAttribute("aria-hidden", "true");
  stripIcon.textContent = deckIcon(deck.id);
  const stripInfo = el("div");
  const stripName = el("div", "mds-name");
  stripName.textContent = deck.title;
  const stripTag = el("div", "mds-tag");
  stripTag.textContent = deck.tagline;
  stripInfo.append(stripName, stripTag);
  strip.append(stripIcon, stripInfo);
  frag.appendChild(strip);

  /* Section: pass & play */
  const humanLabel = el("p", "mode-section-label");
  humanLabel.textContent = "Pass & play";
  frag.appendChild(humanLabel);

  const twoBtn = el("button", "mode-2p-btn");
  twoBtn.type = "button";
  const m2pIcon = el("span", "m2p-icon");
  m2pIcon.setAttribute("aria-hidden", "true");
  m2pIcon.textContent = "👥";
  const m2pText = el("span");
  const m2pName = el("span", "m2p-name");
  m2pName.textContent = "2 Players";
  const m2pDesc = el("span", "m2p-desc");
  m2pDesc.textContent = "Two humans take turns on one screen";
  m2pText.append(m2pName, m2pDesc);
  twoBtn.append(m2pIcon, m2pText);
  twoBtn.addEventListener("click", () => {
    ctx.game = newGame(deck, randomSeed(), null);
    announce(`${deck.title} started. Pass to Player 1.`);
    ctx.render();
  });
  frag.appendChild(twoBtn);

  /* Section: vs computer */
  const botLabel = el("p", "mode-section-label");
  botLabel.textContent = "Vs computer";
  frag.appendChild(botLabel);

  const diffGrid = el("div", "mode-diff-grid");
  for (const item of DIFFS) {
    const btn = el("button", "mode-diff-btn");
    btn.type = "button";

    const ico = el("div", "mdb-icon");
    ico.setAttribute("aria-hidden", "true");
    ico.textContent = item.icon;

    const name = el("div", "mdb-name");
    name.textContent = item.name;

    const desc = el("div", "mdb-desc");
    desc.textContent = item.desc;

    btn.append(ico, name, desc);
    btn.addEventListener("click", () => {
      ctx.game = newGame(deck, randomSeed(), { player: 2, difficulty: item.d });
      announce(`${deck.title} vs ${item.name} bot. Your turn first.`);
      ctx.render();
    });
    diffGrid.appendChild(btn);
  }
  frag.appendChild(diffGrid);

  /* Back button */
  const tb = el("div", "toolbar");
  const back = el("button", "btn btn-ghost");
  back.type = "button";
  back.textContent = "← Back to decks";
  back.addEventListener("click", () => {
    ctx.game = { ...ctx.game, screen: "theme_pick" };
    ctx.render();
  });
  tb.appendChild(back);
  frag.appendChild(tb);

  return frag;
}
