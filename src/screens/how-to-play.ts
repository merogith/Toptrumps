import type { GameContext } from "../app/context";
import { el, escapeHtml } from "../ui/dom";

const STEPS: [string, string][] = [
  ["Deal", "Shuffle and split the deck evenly — 15 cards each, face-down."],
  ["Lead", "Player 1 starts. The leader always picks the stat category for the round."],
  ["Pass the device", "Follow the privacy prompts so only the right player sees each screen."],
  [
    "Compare",
    "Follow the arrow: ↑ higher wins, ↓ lower wins. Both played cards go to the bottom of the winner's pile.",
  ],
  [
    "Tie",
    "Equal values send cards to the centre pile. Same leader plays again — the next winner takes the pair and centre pile. If a player runs out after a tie, the remaining player takes the centre pile. If both run out together, it is a draw.",
  ],
  [
    "Win",
    "Collect all 30 cards to win the match! You can rematch or choose another deck afterwards. Matches can run long; Abandon match returns you to the menu.",
  ],
];

/** Static rules screen. */
export function renderHowToPlay(ctx: GameContext): HTMLElement {
  const frag = el("div", "stack");

  const hdr = el("div");
  hdr.innerHTML = `<h1>How to play</h1>`;
  frag.appendChild(hdr);

  const panel = el("div", "panel");
  const stepsDiv = el("div", "rules-steps");
  STEPS.forEach(([title, desc], i) => {
    const step = el("div", "rule-step");
    const num = el("div", "rule-num");
    num.textContent = String(i + 1);
    const body = el("div", "rule-body");
    body.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(desc)}</p>`;
    step.append(num, body);
    stepsDiv.appendChild(step);
  });
  panel.appendChild(stepsDiv);
  frag.appendChild(panel);

  const back = el("button", "btn btn-ghost");
  back.type = "button";
  back.textContent = "← Back";
  back.addEventListener("click", () => {
    ctx.game = { ...ctx.game, screen: "home" };
    ctx.render();
  });
  frag.appendChild(back);

  return frag;
}
