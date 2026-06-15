import type { Difficulty } from "../types";
import { el } from "../ui/dom";

const ICONS: Record<Difficulty, string> = { easy: "👾", medium: "🤖", hard: "🧠" };
const NAMES: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

/** Placeholder shown while the bot leader is picking a stat. */
export function renderBotThinking(difficulty: Difficulty): HTMLElement {
  const wrap = el("div", "bot-thinking");

  const iconDiv = el("div", "bot-think-icon");
  iconDiv.setAttribute("aria-hidden", "true");
  iconDiv.textContent = ICONS[difficulty];

  const label = el("h2", "bot-think-label");
  label.textContent = `${NAMES[difficulty]} bot is choosing…`;

  const dots = el("div", "bot-think-dots");
  dots.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) dots.appendChild(document.createElement("span"));

  wrap.append(iconDiv, label, dots);
  return wrap;
}
