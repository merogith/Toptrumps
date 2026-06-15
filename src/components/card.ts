import type { Card, DeckTheme, PlayerId } from "../types";
import { cardPlaceholderUrl } from "../game/decks";
import { el } from "../ui/dom";
import { cardNum, deckShortName } from "../ui/labels";

export interface CardRenderOpts {
  /** Stat id to highlight (the chosen category). */
  activeStatId?: string | null;
  /** Render in the smaller side-by-side comparison size. */
  compact?: boolean;
  /** Outcome of the round, used to tint winner/loser/tie. */
  winnerOutcome?: PlayerId | "tie" | null;
  /** Which seat this card belongs to (paired with winnerOutcome for tinting). */
  thisPlayer?: PlayerId | null;
  /** When provided, stat rows become buttons that call back with the stat id. */
  onStatSelect?: (statId: string) => void;
}

/** Renders a single play card: header, artwork, name and the six stat rows. */
export function renderCard(theme: DeckTheme, card: Card, opts: CardRenderOpts = {}): HTMLElement {
  const { activeStatId, compact = false, winnerOutcome, thisPlayer, onStatSelect } = opts;

  const wrap = document.createElement("article");
  wrap.className = "game-card" + (compact ? " compact" : "");
  wrap.setAttribute("aria-label", `${card.name} card`);

  if (winnerOutcome && thisPlayer) {
    if (winnerOutcome === thisPlayer) wrap.classList.add("is-winner");
    else if (winnerOutcome !== "tie") wrap.classList.add("is-loser");
    else wrap.classList.add("is-tie");
  }

  /* Header strip: deck tag + card number */
  const head = el("div", "card-head");
  const headTheme = el("span", "card-head-theme");
  headTheme.textContent = deckShortName(theme);
  const headNum = el("span", "card-head-num");
  headNum.textContent = `#${cardNum(card.id)}`;
  head.append(headTheme, headNum);
  wrap.appendChild(head);

  /* Artwork — falls back to the placeholder SVG on load error */
  const imgWrap = el("div", "card-image-wrap");
  const img = document.createElement("img");
  img.src = card.image ?? cardPlaceholderUrl();
  img.alt = "";
  img.decoding = "async";
  if (card.imageFocus) img.style.objectPosition = card.imageFocus;
  img.onerror = () => {
    img.src = cardPlaceholderUrl();
  };
  imgWrap.appendChild(img);
  wrap.appendChild(imgWrap);

  /* Name + subtitle */
  const info = el("div", "card-info");
  const name = el("h3", "card-name");
  name.textContent = card.name;
  info.appendChild(name);
  if (card.subtitle) {
    const sub = el("p", "card-sub");
    sub.textContent = card.subtitle;
    info.appendChild(sub);
  }
  wrap.appendChild(info);

  /* Stat rows */
  const statsDiv = el("div", "card-stats");
  for (const s of theme.stats) {
    const row = onStatSelect ? el("button", "card-stat-row") : el("div", "card-stat-row");
    const isActive = activeStatId === s.id;

    if (isActive) {
      row.classList.add("is-active");
      if (winnerOutcome && thisPlayer && winnerOutcome === thisPlayer) {
        row.classList.add("is-win");
      }
    }

    if (onStatSelect) {
      (row as HTMLButtonElement).type = "button";
      row.addEventListener("click", () => onStatSelect(s.id));
    }

    const lbl = el("span", "stat-lbl");
    lbl.textContent = s.label;
    const val = el("span", "stat-val");
    val.textContent = String(card.stats[s.id]);

    row.append(lbl, val);
    statsDiv.appendChild(row);
  }
  wrap.appendChild(statsDiv);

  return wrap;
}
