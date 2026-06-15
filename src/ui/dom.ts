/** Tiny DOM helpers shared across screens and components. */

/** Escape user/data-derived strings before injecting into innerHTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Remove all children from an element. */
export function clear(node: HTMLElement): void {
  node.replaceChildren();
}

/** Create an element with an optional class and innerHTML in one call. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  html?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
}
