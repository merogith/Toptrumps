/**
 * Screen-reader announcements via a single polite ARIA live region.
 * The region is created lazily on first use so importing this module has no
 * side effects (keeps it safe for unit tests in a non-DOM environment).
 */
let liveRegion: HTMLElement | null = null;

function ensureRegion(): HTMLElement {
  if (liveRegion) return liveRegion;
  const region = document.createElement("div");
  region.className = "live-region";
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  document.body.appendChild(region);
  liveRegion = region;
  return region;
}

/** Announce a message politely. Clearing first guarantees re-announcement. */
export function announce(msg: string): void {
  const region = ensureRegion();
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = msg;
  });
}
