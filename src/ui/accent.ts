import type { DeckTheme } from "../types";

/** Neutral accent used on menus before a deck is chosen. */
const NEUTRAL = {
  accent: "#94a3b8",
  soft: "rgba(148, 163, 184, 0.12)",
  mid: "rgba(148, 163, 184, 0.3)",
};

/** Push the active deck's accent colours onto the document root as CSS vars. */
export function setAccent(theme: DeckTheme | null): void {
  const r = document.documentElement;
  if (theme) {
    r.style.setProperty("--accent", theme.accent);
    r.style.setProperty("--accent-soft", theme.accentSoft);
    r.style.setProperty("--accent-mid", `color-mix(in srgb, ${theme.accent} 35%, transparent)`);
  } else {
    r.style.setProperty("--accent", NEUTRAL.accent);
    r.style.setProperty("--accent-soft", NEUTRAL.soft);
    r.style.setProperty("--accent-mid", NEUTRAL.mid);
  }
}
