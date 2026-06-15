import type { GameSnapshot } from "../types";
import { el } from "../ui/dom";

/** Top-of-screen status bar: each player's card count, theme, and centre pile. */
export function renderHUD(g: GameSnapshot): HTMLElement {
  const hud = el("div", "game-hud");
  const p1Count = g.p1.length;
  const p2Count = g.p2.length;
  const p1Leads = p1Count > p2Count;
  const p2Leads = p2Count > p1Count;

  const p1 = el("div", "hud-player");
  const p1lbl = el("span");
  p1lbl.textContent = g.bot ? (g.bot.player === 1 ? "Bot" : "You") : "P1";
  const p1cnt = el("span", "hud-count" + (p1Leads ? " is-leading" : ""));
  p1cnt.textContent = String(p1Count);
  p1.append(p1lbl, p1cnt);

  const theme = el("span", "hud-theme");
  const themeName = g.theme?.title.split(" ").slice(0, 2).join(" ") ?? "";
  if (g.bot) {
    const diffShort =
      g.bot.difficulty === "hard" ? "Hard" : g.bot.difficulty === "medium" ? "Med" : "Easy";
    theme.textContent = `${themeName} · ${diffShort}`;
  } else {
    theme.textContent = themeName;
  }

  const p2 = el("div", "hud-player");
  const p2cnt = el("span", "hud-count" + (p2Leads ? " is-leading" : ""));
  p2cnt.textContent = String(p2Count);
  const p2lbl = el("span");
  p2lbl.textContent = g.bot ? (g.bot.player === 2 ? "Bot" : "You") : "P2";
  p2.append(p2cnt, p2lbl);

  hud.append(p1, theme, p2);

  if (g.kitty.length > 0) {
    const kitty = el("span", "hud-kitty");
    kitty.textContent = `Centre: ${g.kitty.length}`;
    hud.append(kitty);
  }

  return hud;
}
