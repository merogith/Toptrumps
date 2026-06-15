/** Motion, haptic and count-up feedback helpers, all reduced-motion aware. */

/** True when the user has asked the OS to minimise animation. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Animate a number from 0 to `to`. Jumps straight to the value under reduced motion. */
export function animateCount(node: HTMLElement, to: number, duration = 650): void {
  if (prefersReducedMotion()) {
    node.textContent = String(to);
    return;
  }
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    node.textContent = String(Math.round(to * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Soft haptic feedback. Silently no-ops where the API is unavailable. */
export function haptic(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore — vibration is a progressive enhancement */
  }
}
