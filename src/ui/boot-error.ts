import { escapeHtml } from "./dom";

/**
 * Last-resort error UI. If boot or a render throws, replace the app with a
 * readable message (and the stack) instead of leaving a blank screen.
 */
export function showBootError(err: unknown, context: "boot" | "render" = "boot"): void {
  const app = document.querySelector("#app");
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? (err.stack ?? "") : "";
  const title = context === "render" ? "Something broke during play" : "Something went wrong";
  const subtitle =
    context === "render"
      ? "The screen could not be drawn. Refresh the page to try again."
      : "The game did not start.";

  console.error(context === "boot" ? "Top Trumps boot error:" : "Top Trumps render error:", err);

  if (app) {
    app.innerHTML = `
      <main style="padding:1.5rem;max-width:36rem;margin:0 auto;font-family:system-ui,sans-serif;color:#e4e4e7">
        <h1 style="color:#f87171;margin:0 0 0.5rem">${escapeHtml(title)}</h1>
        <p style="color:#94a3b8;margin:0 0 1rem">${escapeHtml(subtitle)}</p>
        <pre style="background:#1e1e2e;padding:1rem;border-radius:8px;overflow:auto;font-size:0.85rem;white-space:pre-wrap">${escapeHtml(msg + (stack ? "\n\n" + stack : ""))}</pre>
      </main>`;
  }
}
