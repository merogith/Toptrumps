import type { GameContext } from "../app/context";
import type { GameSnapshot, PlayerId } from "../types";
import { continueAfterRound } from "../game/engine";
import { renderCard } from "../components/card";
import { el, escapeHtml } from "../ui/dom";
import { playerLabel } from "../ui/labels";
import { announce } from "../ui/announce";
import { animateCount, haptic } from "../ui/feedback";
import { abandonToolbar } from "./shared";

/** The bot's reaction line based on outcome and margin. Bot matches only. */
function botReactionLine(g: GameSnapshot, winner: PlayerId | "tie", margin: number): string {
  if (!g.bot) return "";
  const botWon = winner === g.bot.player;
  const youWon = winner !== "tie" && winner !== g.bot.player;
  const big = margin >= 40;
  const close = margin > 0 && margin <= 8;
  if (winner === "tie") return 'Bot: "A perfect draw. Curious."';
  if (youWon && big) return 'Bot: "…that wasn\'t even close."';
  if (youWon && close) return 'Bot: "Lucky pick. I\'ll remember that one."';
  if (youWon) return 'Bot: "Well played. Next round."';
  if (botWon && big) return 'Bot: "Outclassed. Better luck next round."';
  if (botWon && close) return 'Bot: "Squeaked that one out."';
  if (botWon) return 'Bot: "My round."';
  return "";
}

/** Shows the head-to-head comparison and the outcome of the round. */
export function renderRoundResult(ctx: GameContext): HTMLElement {
  const g = ctx.game;
  const frag = el("div", "stack");
  if (!g.theme || !g.lastRound) return frag;

  const lr = g.lastRound;
  const isTie = lr.winner === "tie";
  const winnerPid = isTie ? null : (lr.winner as PlayerId);
  const matchFinished = g.p1.length === 0 || g.p2.length === 0;
  const margin = Math.abs(lr.p1Value - lr.p2Value);

  /* Haptic on mount — only when a human is in the seat (bot mode). */
  if (g.bot) {
    const userWon = winnerPid !== null && winnerPid !== g.bot.player;
    if (isTie) haptic(40);
    else if (userWon) haptic([20, 60, 30, 60, 80]);
    else haptic([80, 80, 20]);
  }

  /* Sticky action bar pinned to the top so the player never has to scroll
     past two tall cards to reach the next-round button. */
  const ctaBar = el("div", "play-cta-dock");
  const ctaBtn = el("button", "btn btn-primary");
  ctaBtn.type = "button";
  ctaBtn.textContent = matchFinished ? "Finish match" : "Next round →";
  ctaBtn.addEventListener("click", () => {
    ctx.game = continueAfterRound(ctx.game);
    if (ctx.game.screen === "game_over") {
      announce(
        ctx.game.winner
          ? `${playerLabel(ctx.game.winner, ctx.game)} wins the match!`
          : "Game over.",
      );
    }
    ctx.render();
  });
  ctaBar.appendChild(ctaBtn);
  frag.appendChild(ctaBar);

  /* Result banner */
  const banner = el("div", `result-banner reveal-pop ${isTie ? "is-tie" : "is-win"}`);
  const icon = el("div", "result-icon");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = isTie ? "🤝" : "🏆";
  const headline = el("h1");
  headline.textContent = isTie ? "Draw!" : `${playerLabel(winnerPid!, g)} wins!`;
  const statLine = el("p", "result-stat-line");
  statLine.innerHTML = `<strong>${escapeHtml(lr.statLabel)}</strong> · ${lr.higherIsBetter ? "higher wins" : "lower wins"}`;
  banner.append(icon, headline, statLine);
  if (isTie) {
    const extra = el("p", "result-stat-line");
    extra.textContent = `${g.kitty.length} card${g.kitty.length !== 1 ? "s" : ""} go to the centre pile.`;
    banner.append(extra);
  }
  frag.appendChild(banner);

  /* Bot reaction quip (bot mode only) */
  if (g.bot) {
    const quipText = botReactionLine(g, lr.winner, margin);
    if (quipText) {
      const quip = el("p", "bot-quip reveal-fade");
      quip.textContent = quipText;
      frag.appendChild(quip);
    }
  }

  /* Big stat-first VS comparison with animated count-up */
  const cmp = el("div", "stat-compare big reveal-pop");

  const p1side = el("div", "sc-player");
  const p1lbl = el("div", "sc-label");
  p1lbl.textContent = playerLabel(1, g);
  const p1val = el(
    "div",
    `sc-value${!isTie && winnerPid === 1 ? " is-winner" : !isTie ? " is-loser" : ""}`,
  );
  p1val.textContent = "0";
  p1side.append(p1lbl, p1val);

  const divider = el("div", "sc-divider");
  divider.innerHTML = `${escapeHtml(lr.statLabel)}<br><span class="sc-vs">VS</span>`;

  const p2side = el("div", "sc-player");
  const p2lbl = el("div", "sc-label");
  p2lbl.textContent = playerLabel(2, g);
  const p2val = el(
    "div",
    `sc-value${!isTie && winnerPid === 2 ? " is-winner" : !isTie ? " is-loser" : ""}`,
  );
  p2val.textContent = "0";
  p2side.append(p2lbl, p2val);

  cmp.append(p1side, divider, p2side);
  frag.appendChild(cmp);

  /* Trigger count-up after the element mounts. */
  queueMicrotask(() => {
    animateCount(p1val, lr.p1Value);
    animateCount(p2val, lr.p2Value);
  });

  /* Card count strip */
  const scoreLine = el("p", "score-line");
  let scoreText = `Cards — ${playerLabel(1, g)}: ${g.p1.length} · ${playerLabel(2, g)}: ${g.p2.length}`;
  if (g.kitty.length) scoreText += ` · Centre: ${g.kitty.length}`;
  scoreLine.textContent = scoreText;
  frag.appendChild(scoreLine);

  /* Collapsible full-card view — keyboard accessible, forced open on desktop. */
  const details = document.createElement("details");
  details.className = "compare-details";
  const summary = document.createElement("summary");
  summary.className = "compare-summary";
  summary.innerHTML = `<span class="cd-chevron" aria-hidden="true">▾</span><span>See both cards</span>`;
  details.appendChild(summary);

  const grid = el("div", "compare-grid two");

  const wrap1 = el("div", "compare-player");
  const lbl1 = el(
    "div",
    `compare-player-label${!isTie && winnerPid === 1 ? " is-winner" : !isTie ? " is-loser" : ""}`,
  );
  lbl1.textContent = playerLabel(1, g) + (!isTie && winnerPid === 1 ? " 🏆" : "");
  wrap1.append(
    lbl1,
    renderCard(g.theme, lr.p1Card, {
      activeStatId: lr.statId,
      compact: true,
      winnerOutcome: lr.winner,
      thisPlayer: 1,
    }),
  );

  const wrap2 = el("div", "compare-player");
  const lbl2 = el(
    "div",
    `compare-player-label${!isTie && winnerPid === 2 ? " is-winner" : !isTie ? " is-loser" : ""}`,
  );
  lbl2.textContent = playerLabel(2, g) + (!isTie && winnerPid === 2 ? " 🏆" : "");
  wrap2.append(
    lbl2,
    renderCard(g.theme, lr.p2Card, {
      activeStatId: lr.statId,
      compact: true,
      winnerOutcome: lr.winner,
      thisPlayer: 2,
    }),
  );

  grid.append(wrap1, wrap2);
  details.appendChild(grid);
  frag.appendChild(details);

  frag.appendChild(abandonToolbar(ctx, "Abandon this match?"));

  return frag;
}
