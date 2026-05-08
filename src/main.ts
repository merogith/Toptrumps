import "./style.css";
import { DECKS, getDeckById, cardImageUrl } from "./data/decks";
import {
  abandonToHome,
  acknowledgePass,
  acknowledgeRevealPass,
  continueAfterRound,
  newGame,
  revealAndResolve,
  selectStat,
  validateDeck,
} from "./engine";
import type { Card, DeckTheme, GameSnapshot, PlayerId } from "./types";

/* ============================================================
   STATE
   ============================================================ */
let game: GameSnapshot = abandonToHome();

/* ============================================================
   ARIA LIVE REGION
   ============================================================ */
const liveRegion = document.createElement("div");
liveRegion.className = "live-region";
liveRegion.setAttribute("aria-live", "polite");
liveRegion.setAttribute("aria-atomic", "true");
document.body.appendChild(liveRegion);

function announce(msg: string): void {
  liveRegion.textContent = "";
  requestAnimationFrame(() => { liveRegion.textContent = msg; });
}

/* ============================================================
   THEME ACCENT
   ============================================================ */
function setAccent(theme: DeckTheme | null): void {
  const r = document.documentElement;
  if (theme) {
    r.style.setProperty("--accent", theme.accent);
    r.style.setProperty("--accent-soft", theme.accentSoft);
    r.style.setProperty("--accent-mid", `color-mix(in srgb, ${theme.accent} 35%, transparent)`);
  } else {
    r.style.setProperty("--accent", "#94a3b8");
    r.style.setProperty("--accent-soft", "rgba(148, 163, 184, 0.12)");
    r.style.setProperty("--accent-mid", "rgba(148, 163, 184, 0.3)");
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pLabel(id: PlayerId): string { return `Player ${id}`; }

function cardNum(cardId: string): string {
  const n = parseInt(cardId.replace(/\D/g, ""), 10);
  return isNaN(n) ? "–" : String(n).padStart(2, "0");
}

function deckShortName(theme: DeckTheme): string {
  return theme.title.split(" ")[0].substring(0, 8).toUpperCase();
}

function otherPlayer(p: PlayerId): PlayerId { return p === 1 ? 2 : 1; }

/** Extracts who is the challenger (non-leader). */
function challenger(g: GameSnapshot): PlayerId { return otherPlayer(g.leader); }

function clear(el: HTMLElement): void { el.replaceChildren(); }

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  html?: string
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/* ============================================================
   CARD RENDER
   ============================================================ */
interface CardRenderOpts {
  activeStatId?: string | null;
  compact?: boolean;
  winnerOutcome?: PlayerId | "tie" | null; // which player won this round
  thisPlayer?: PlayerId | null;             // which player this card belongs to
}

function renderCard(theme: DeckTheme, card: Card, opts: CardRenderOpts = {}): HTMLElement {
  const { activeStatId, compact = false, winnerOutcome, thisPlayer } = opts;

  const wrap = document.createElement("article");
  wrap.className = "game-card" + (compact ? " compact" : "");
  wrap.setAttribute("aria-label", `${card.name} card`);

  if (winnerOutcome && thisPlayer) {
    if (winnerOutcome === thisPlayer) wrap.classList.add("is-winner");
    else if (winnerOutcome !== "tie") wrap.classList.add("is-loser");
    else wrap.classList.add("is-tie");
  }

  /* Header strip */
  const head = el("div", "card-head");
  const headTheme = el("span", "card-head-theme");
  headTheme.textContent = deckShortName(theme);
  const headNum = el("span", "card-head-num");
  headNum.textContent = `#${cardNum(card.id)}`;
  head.appendChild(headTheme);
  head.appendChild(headNum);
  wrap.appendChild(head);

  /* Image */
  const imgWrap = el("div", "card-image-wrap");
  const img = document.createElement("img");
  img.src = card.image ?? cardImageUrl(theme.id, card.id);
  img.alt = "";
  img.decoding = "async";
  img.onerror = () => { img.src = cardImageUrl(theme.id, card.id); };
  imgWrap.appendChild(img);
  wrap.appendChild(imgWrap);

  /* Name */
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

  /* Stats */
  const statsDiv = el("div", "card-stats");
  for (const s of theme.stats) {
    const row = el("div", "card-stat-row");
    const isActive = activeStatId === s.id;

    if (isActive) {
      row.classList.add("is-active");
      if (winnerOutcome && thisPlayer && winnerOutcome === thisPlayer) {
        row.classList.add("is-win");
      }
    }

    const lbl = el("span", "stat-lbl");
    lbl.textContent = s.label;
    const val = el("span", "stat-val");
    val.textContent = String(card.stats[s.id]);

    row.appendChild(lbl);
    row.appendChild(val);
    statsDiv.appendChild(row);
  }
  wrap.appendChild(statsDiv);

  return wrap;
}

/* ============================================================
   GAME HUD (card counts during play)
   ============================================================ */
function renderHUD(g: GameSnapshot): HTMLElement {
  const hud = el("div", "game-hud");
  const p1Count = g.p1.length;
  const p2Count = g.p2.length;
  const p1Leads = p1Count > p2Count;
  const p2Leads = p2Count > p1Count;

  const p1 = el("div", "hud-player");
  const p1lbl = el("span");
  p1lbl.textContent = "P1";
  const p1cnt = el("span", "hud-count" + (p1Leads ? " is-leading" : ""));
  p1cnt.textContent = String(p1Count);
  p1.append(p1lbl, p1cnt);

  const theme = el("span", "hud-theme");
  theme.textContent = g.theme?.title.split(" ").slice(0, 2).join(" ") ?? "";

  const p2 = el("div", "hud-player");
  const p2cnt = el("span", "hud-count" + (p2Leads ? " is-leading" : ""));
  p2cnt.textContent = String(p2Count);
  const p2lbl = el("span");
  p2lbl.textContent = "P2";
  p2.append(p2cnt, p2lbl);

  hud.append(p1, theme, p2);

  if (g.kitty.length > 0) {
    const kitty = el("span", "hud-kitty");
    kitty.textContent = `Centre: ${g.kitty.length}`;
    hud.append(kitty);
  }

  return hud;
}

/* ============================================================
   MAIN RENDER DISPATCH
   ============================================================ */
function render(): void {
  try {
    const app = document.querySelector<HTMLElement>("#app");
    if (!app) return;
    setAccent(game.theme);
    clear(app);

    const main = document.createElement("main");
    main.className = "stack";
    main.dataset.screen = game.screen;

    switch (game.screen) {
      case "home":          main.appendChild(renderHome()); break;
      case "how_to_play":   main.appendChild(renderHowToPlay()); break;
      case "theme_pick":    main.appendChild(renderThemePick()); break;
      case "pass_device":   main.appendChild(renderPassDevice()); break;
      case "choose_stat":   main.appendChild(renderChooseStat()); break;
      case "reveal_prompt": main.appendChild(renderRevealPrompt()); break;
      case "opponent_view": main.appendChild(renderOpponentView()); break;
      case "round_result":  main.appendChild(renderRoundResult()); break;
      case "game_over":     main.appendChild(renderGameOver()); break;
      default:              main.textContent = "Unknown screen";
    }

    app.appendChild(main);
    /* Scroll to top on each transition */
    window.scrollTo({ top: 0, behavior: "instant" });
  } catch (e) {
    showBootError(e, "render");
  }
}

/* ============================================================
   HOME SCREEN
   ============================================================ */
function renderHome(): HTMLElement {
  const frag = el("div", "stack");

  const hero = el("div", "home-hero");
  hero.innerHTML = `
    <div class="game-logo" aria-hidden="true">🃏</div>
    <h1>Top Trumps</h1>
    <p class="tagline">Two players · one screen · pass &amp; play — no peeking!</p>
  `;
  frag.appendChild(hero);

  const actions = el("div", "home-actions");

  const play = el("button", "btn btn-primary");
  play.type = "button";
  play.textContent = "Choose deck";
  play.addEventListener("click", () => {
    game = { ...game, screen: "theme_pick" };
    announce("Choose a deck to play.");
    render();
  });

  const rules = el("button", "btn btn-ghost");
  rules.type = "button";
  rules.textContent = "How to play";
  rules.addEventListener("click", () => {
    game = { ...game, screen: "how_to_play" };
    render();
  });

  actions.append(play, rules);
  frag.appendChild(actions);

  const features = el("div", "home-feature-row");
  const chips: [string, string, string][] = [
    ["🎲", "3 Decks", "Star Wars · Foundation · Medieval"],
    ["🔒", "Pass & Play", "Privacy flow between turns"],
    ["🏆", "30 Cards", "6 stats · 1–99 values"],
  ];
  for (const [icon, lbl, sub] of chips) {
    const chip = el("div", "feature-chip");
    chip.innerHTML = `<div class="fc-icon" aria-hidden="true">${icon}</div><span class="fc-label">${escapeHtml(lbl)}</span><span class="fc-sub">${escapeHtml(sub)}</span>`;
    features.appendChild(chip);
  }
  frag.appendChild(features);

  return frag;
}

/* ============================================================
   HOW TO PLAY
   ============================================================ */
function renderHowToPlay(): HTMLElement {
  const frag = el("div", "stack");

  const hdr = el("div");
  hdr.innerHTML = `<h1>How to play</h1>`;
  frag.appendChild(hdr);

  const panel = el("div", "panel");

  const steps: [string, string][] = [
    ["Deal", "Shuffle and split the deck evenly — 15 cards each, face-down."],
    ["Lead", "Player 1 starts. The leader always picks the stat category for the round."],
    ["Pass the device", "Follow the privacy prompts so only the right player sees each screen."],
    ["Compare", "Highest value in the chosen category wins the trick. Cards go to the bottom of the winner's pile."],
    ["Tie", "Equal values send cards to the centre pile. Same leader plays again — winner takes everything."],
    ["Win", "Collect all 30 cards to win the match!"],
  ];

  const stepsDiv = el("div", "rules-steps");
  steps.forEach(([title, desc], i) => {
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
    game = { ...game, screen: "home" };
    render();
  });
  frag.appendChild(back);

  return frag;
}

/* ============================================================
   THEME PICKER
   ============================================================ */
const DECK_ICONS: Record<string, string> = {
  galactic: "🚀",
  foundation: "🔮",
  medieval: "⚔️",
};

function renderThemePick(): HTMLElement {
  const frag = el("div", "stack");

  const hdr = el("div");
  hdr.innerHTML = `<h1>Pick a deck</h1><p>Three themes · 30 cards each · 6 stats · classic Top Trumps rules.</p>`;
  frag.appendChild(hdr);

  const grid = el("div", "theme-grid");

  for (const deck of DECKS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-card";
    btn.style.setProperty("--theme-accent", deck.accent);
    btn.style.setProperty("--theme-accent-raw", deck.accent);

    const icon = DECK_ICONS[deck.id] ?? "🎴";
    btn.innerHTML = `
      <span class="deck-icon" aria-hidden="true">${icon}</span>
      <span class="badge">${deck.stats.length} stats · 30 cards</span>
      <h3>${escapeHtml(deck.title)}</h3>
      <p class="tagline">${escapeHtml(deck.tagline)}</p>
    `;

    btn.addEventListener("click", () => {
      const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
      game = newGame(deck, seed);
      announce(`${deck.title} started. Pass to ${pLabel(game.deviceHolder)}.`);
      render();
    });

    grid.appendChild(btn);
  }
  frag.appendChild(grid);

  const tb = el("div", "toolbar");
  const back = el("button", "btn btn-ghost");
  back.type = "button";
  back.textContent = "← Home";
  back.addEventListener("click", () => { game = abandonToHome(); render(); });
  tb.appendChild(back);
  frag.appendChild(tb);

  return frag;
}

/* ============================================================
   PASS DEVICE  (privacy gate — two confirmations per round)
   ============================================================ */
function renderPassDevice(): HTMLElement {
  const frag = el("div", "stack");
  if (!game.theme) return frag;

  frag.appendChild(renderHUD(game));

  /* Who needs to look away, and who should have the device */
  const holder = game.deviceHolder;
  const isFirstPass = holder !== game.leader; // challenger step (look away)

  const screen = el("div", "privacy-screen");

  const lockDiv = el("div", "privacy-lock");
  lockDiv.setAttribute("aria-hidden", "true");
  lockDiv.textContent = isFirstPass ? "🔒" : "👁";

  const playerName = el("div", "privacy-player-name");
  playerName.textContent = pLabel(holder);

  const title = el("h2");
  title.textContent = isFirstPass
    ? `${pLabel(otherPlayer(holder))} — look away now`
    : `${pLabel(holder)} — your turn`;

  const instruction = el("p", "privacy-instruction");
  instruction.textContent = isFirstPass
    ? `Hand the device to ${pLabel(holder)}. The other player should not look until asked.`
    : `You have the device. Press continue to see your top card and choose a stat.`;

  const ok = el("button", "btn btn-primary");
  ok.type = "button";
  ok.textContent = `I'm ${pLabel(holder)} — continue`;
  ok.addEventListener("click", () => {
    game = acknowledgePass(game);
    if (game.screen === "choose_stat") {
      announce(`${pLabel(game.leader)}, choose a stat on your top card.`);
    } else {
      announce(`Pass to ${pLabel(game.deviceHolder)}.`);
    }
    render();
  });

  screen.append(lockDiv, playerName, title, instruction, ok);
  frag.appendChild(screen);

  const quitRow = el("div", "toolbar");
  const quit = el("button", "btn btn-danger btn-sm");
  quit.type = "button";
  quit.textContent = "Abandon match";
  quit.addEventListener("click", () => {
    if (confirm("Abandon this match and return to the main menu?")) {
      game = abandonToHome();
      announce("Returned to menu.");
      render();
    }
  });
  quitRow.appendChild(quit);
  frag.appendChild(quitRow);

  return frag;
}

/* ============================================================
   CHOOSE STAT (leader's turn)
   ============================================================ */
function leaderCard(g: GameSnapshot): Card | null {
  return g.leader === 1 ? g.p1[0] ?? null : g.p2[0] ?? null;
}

function renderChooseStat(): HTMLElement {
  const frag = el("div", "stack");
  if (!game.theme) return frag;

  frag.appendChild(renderHUD(game));

  const banner = el("div", "player-banner");
  const dot = el("span", "banner-dot");
  const bannerText = el("span");
  bannerText.textContent = `${pLabel(game.leader)} — pick a stat to challenge`;
  banner.append(dot, bannerText);
  frag.appendChild(banner);

  const card = leaderCard(game);
  if (!card) { frag.appendChild(document.createTextNode("No cards remaining.")); return frag; }

  frag.appendChild(renderCard(game.theme, card, { activeStatId: null }));

  const hint = el("p");
  hint.textContent = "Your top card is shown. Tap a stat to challenge your opponent — higher value wins.";
  hint.style.textAlign = "center";
  hint.style.fontSize = "0.85rem";
  frag.appendChild(hint);

  const grid = el("div", "stat-grid");
  for (const s of game.theme.stats) {
    const b = el("button", "stat-btn");
    b.type = "button";

    const lbl = el("span", "sb-label");
    lbl.textContent = s.label;
    const val = el("span", "sb-value");
    val.textContent = String(card.stats[s.id]);

    b.append(lbl, val);
    b.addEventListener("click", () => {
      game = selectStat(game, s.id);
      announce(`${s.label} chosen. Pass to ${pLabel(game.deviceHolder)}.`);
      render();
    });
    grid.appendChild(b);
  }
  frag.appendChild(grid);

  const tb = el("div", "toolbar");
  const quit = el("button", "btn btn-danger btn-sm");
  quit.type = "button";
  quit.textContent = "Abandon match";
  quit.addEventListener("click", () => {
    if (confirm("Abandon this match?")) { game = abandonToHome(); render(); }
  });
  tb.appendChild(quit);
  frag.appendChild(tb);

  return frag;
}

/* ============================================================
   REVEAL PROMPT (pass to challenger before they see their card)
   ============================================================ */
function renderRevealPrompt(): HTMLElement {
  const frag = el("div", "stack");
  if (!game.theme || !game.pendingStatId) return frag;

  frag.appendChild(renderHUD(game));

  const stat = game.theme.stats.find((x) => x.id === game.pendingStatId);

  const screen = el("div", "privacy-screen");

  const lockDiv = el("div", "privacy-lock");
  lockDiv.setAttribute("aria-hidden", "true");
  lockDiv.textContent = "🔒";

  const playerName = el("div", "privacy-player-name");
  playerName.textContent = pLabel(game.deviceHolder);

  const title = el("h2");
  title.textContent = `${pLabel(otherPlayer(game.deviceHolder))} — look away`;

  const statChip = el("div");
  statChip.innerHTML = `<span class="badge" style="font-size:0.85rem;padding:0.3rem 0.8rem">${escapeHtml(stat?.label ?? "—")} locked in</span>`;
  statChip.style.textAlign = "center";

  const instruction = el("p", "privacy-instruction");
  instruction.textContent = `Hand the device to ${pLabel(game.deviceHolder)}. They will see their own card — not the leader's value.`;

  const ok = el("button", "btn btn-primary");
  ok.type = "button";
  ok.textContent = `I'm ${pLabel(game.deviceHolder)} — show my card`;
  ok.addEventListener("click", () => {
    game = acknowledgeRevealPass(game);
    announce("Review your card, then tap Reveal result.");
    render();
  });

  screen.append(lockDiv, playerName, title, statChip, instruction, ok);
  frag.appendChild(screen);

  return frag;
}

/* ============================================================
   OPPONENT VIEW (challenger sees their card with chosen stat)
   ============================================================ */
function challengerCard(g: GameSnapshot): Card | null {
  const c = otherPlayer(g.leader);
  return c === 1 ? g.p1[0] ?? null : g.p2[0] ?? null;
}

function renderOpponentView(): HTMLElement {
  const frag = el("div", "stack");
  if (!game.theme || !game.pendingStatId) return frag;

  frag.appendChild(renderHUD(game));

  const chall = challenger(game);
  const banner = el("div", "player-banner");
  const dot = el("span", "banner-dot");
  const bannerText = el("span");
  bannerText.textContent = `${pLabel(chall)} — your top card`;
  banner.append(dot, bannerText);
  frag.appendChild(banner);

  const stat = game.theme.stats.find((x) => x.id === game.pendingStatId);

  const hint = el("p");
  hint.innerHTML = `The leader chose <strong>${escapeHtml(stat?.label ?? "—")}</strong>. Your value is highlighted below.`;
  hint.style.textAlign = "center";
  hint.style.fontSize = "0.85rem";
  frag.appendChild(hint);

  const card = challengerCard(game);
  if (!card) { frag.textContent = "Error: no card found."; return frag; }

  frag.appendChild(renderCard(game.theme, card, { activeStatId: game.pendingStatId }));

  const revealBtn = el("button", "btn btn-primary");
  revealBtn.type = "button";
  revealBtn.textContent = "Reveal round result";
  revealBtn.addEventListener("click", () => {
    game = revealAndResolve(game);
    if (game.lastRound) {
      if (game.lastRound.winner === "tie") announce("Draw — cards go to the centre pile.");
      else announce(`${pLabel(game.lastRound.winner as PlayerId)} wins the trick.`);
    }
    render();
  });
  frag.appendChild(revealBtn);

  return frag;
}

/* ============================================================
   ROUND RESULT
   ============================================================ */
function renderRoundResult(): HTMLElement {
  const frag = el("div", "stack");
  if (!game.theme || !game.lastRound) return frag;

  const lr = game.lastRound;
  const isTie = lr.winner === "tie";
  const winnerPid = isTie ? null : (lr.winner as PlayerId);

  /* Result banner */
  const banner = el("div", `result-banner ${isTie ? "is-tie" : "is-win"}`);

  const icon = el("div", "result-icon");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = isTie ? "🤝" : "🏆";

  const headline = el("h1");
  headline.textContent = isTie ? "Draw!" : `${pLabel(winnerPid!)} wins!`;

  const statLine = el("p", "result-stat-line");
  statLine.innerHTML = `<strong>${escapeHtml(lr.statLabel)}</strong> · ${lr.higherIsBetter ? "higher wins" : "lower wins"}`;
  if (isTie) {
    const extra = el("p", "result-stat-line");
    extra.textContent = `${game.kitty.length} card${game.kitty.length !== 1 ? "s" : ""} go to the centre pile.`;
    banner.append(icon, headline, statLine, extra);
  } else {
    banner.append(icon, headline, statLine);
  }
  frag.appendChild(banner);

  /* Stat comparison strip */
  const cmp = el("div", "stat-compare");

  const p1side = el("div", "sc-player");
  const p1lbl = el("div", "sc-label");
  p1lbl.textContent = pLabel(1);
  const p1val = el("div", `sc-value${!isTie && winnerPid === 1 ? " is-winner" : !isTie ? " is-loser" : ""}`);
  p1val.textContent = String(lr.p1Value);
  p1side.append(p1lbl, p1val);

  const divider = el("div", "sc-divider");
  divider.innerHTML = `${escapeHtml(lr.statLabel)}<br>vs`;

  const p2side = el("div", "sc-player");
  const p2lbl = el("div", "sc-label");
  p2lbl.textContent = pLabel(2);
  const p2val = el("div", `sc-value${!isTie && winnerPid === 2 ? " is-winner" : !isTie ? " is-loser" : ""}`);
  p2val.textContent = String(lr.p2Value);
  p2side.append(p2lbl, p2val);

  cmp.append(p1side, divider, p2side);
  frag.appendChild(cmp);

  /* Both cards side by side */
  const grid = el("div", "compare-grid two");

  const wrap1 = el("div", "compare-player");
  const lbl1 = el("div", `compare-player-label${!isTie && winnerPid === 1 ? " is-winner" : !isTie ? " is-loser" : ""}`);
  lbl1.textContent = pLabel(1) + (!isTie && winnerPid === 1 ? " 🏆" : "");
  wrap1.append(lbl1, renderCard(game.theme, lr.p1Card, {
    activeStatId: lr.statId,
    compact: true,
    winnerOutcome: lr.winner,
    thisPlayer: 1,
  }));

  const wrap2 = el("div", "compare-player");
  const lbl2 = el("div", `compare-player-label${!isTie && winnerPid === 2 ? " is-winner" : !isTie ? " is-loser" : ""}`);
  lbl2.textContent = pLabel(2) + (!isTie && winnerPid === 2 ? " 🏆" : "");
  wrap2.append(lbl2, renderCard(game.theme, lr.p2Card, {
    activeStatId: lr.statId,
    compact: true,
    winnerOutcome: lr.winner,
    thisPlayer: 2,
  }));

  grid.append(wrap1, wrap2);
  frag.appendChild(grid);

  /* Card count */
  const scoreLine = el("p");
  scoreLine.style.textAlign = "center";
  scoreLine.style.fontSize = "0.85rem";
  let scoreText = `Cards remaining — ${pLabel(1)}: ${game.p1.length} · ${pLabel(2)}: ${game.p2.length}`;
  if (game.kitty.length) scoreText += ` · Centre: ${game.kitty.length}`;
  scoreLine.textContent = scoreText;
  frag.appendChild(scoreLine);

  const matchFinished = game.p1.length === 0 || game.p2.length === 0;

  const nextBtn = el("button", "btn btn-primary");
  nextBtn.type = "button";
  nextBtn.textContent = matchFinished ? "Finish" : "Next round";
  nextBtn.addEventListener("click", () => {
    game = continueAfterRound(game);
    if (game.screen === "game_over") {
      announce(game.winner ? `${pLabel(game.winner)} wins the match!` : "Game over.");
    } else if (game.screen === "pass_device") {
      announce(`Pass to ${pLabel(game.deviceHolder)}.`);
    }
    render();
  });
  frag.appendChild(nextBtn);

  const tb = el("div", "toolbar");
  const quit = el("button", "btn btn-danger btn-sm");
  quit.type = "button";
  quit.textContent = "Abandon match";
  quit.addEventListener("click", () => {
    if (confirm("Abandon this match?")) { game = abandonToHome(); render(); }
  });
  tb.appendChild(quit);
  frag.appendChild(tb);

  return frag;
}

/* ============================================================
   GAME OVER
   ============================================================ */
function renderGameOver(): HTMLElement {
  const frag = el("div", "stack");

  const hero = el("div", "game-over-hero");

  const trophy = el("div", "game-over-trophy");
  trophy.setAttribute("aria-hidden", "true");
  trophy.textContent = game.winner ? "🏆" : "🤝";

  const headline = el("h1");
  headline.textContent = game.winner
    ? `${pLabel(game.winner)} wins the game!`
    : "Game over!";

  const sub = el("p");
  sub.textContent = game.winner
    ? `${pLabel(game.winner)} collected all 30 cards — classic Top Trumps victory.`
    : "The deck ran out with no clear winner.";

  hero.append(trophy, headline, sub);
  frag.appendChild(hero);

  /* Stats panel */
  if (game.theme) {
    const statsGrid = el("div", "game-stats-grid");

    const themeChip = el("div", "game-stat-chip");
    const themeIcon = DECK_ICONS[game.theme.id] ?? "🎴";
    themeChip.innerHTML = `<span class="chip-val">${themeIcon}</span><span class="chip-lbl">${escapeHtml(game.theme.title)}</span>`;

    const winChip = el("div", "game-stat-chip");
    winChip.innerHTML = `<span class="chip-val">${game.winner ?? "—"}</span><span class="chip-lbl">Winner</span>`;

    statsGrid.append(themeChip, winChip);
    frag.appendChild(statsGrid);
  }

  /* Final trick info */
  if (game.lastRound) {
    const panel = el("div", "panel");
    panel.innerHTML = `<p>Final round used <strong>${escapeHtml(game.lastRound.statLabel)}</strong> — ${pLabel(1)}: ${game.lastRound.p1Value} vs ${pLabel(2)}: ${game.lastRound.p2Value}.</p>`;
    frag.appendChild(panel);
  }

  /* Action buttons */
  const row = el("div", "row");

  const again = el("button", "btn btn-primary");
  again.type = "button";
  again.textContent = "Rematch (same deck)";
  again.addEventListener("click", () => {
    const deck = game.theme?.id ? getDeckById(game.theme.id) : undefined;
    if (deck) {
      const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
      game = newGame(deck, seed);
      announce("New match started.");
    }
    render();
  });

  const menu = el("button", "btn btn-ghost");
  menu.type = "button";
  menu.textContent = "Pick deck";
  menu.addEventListener("click", () => {
    game = { ...abandonToHome(), screen: "theme_pick" };
    render();
  });

  const home = el("button", "btn btn-ghost");
  home.type = "button";
  home.textContent = "Home";
  home.addEventListener("click", () => { game = abandonToHome(); render(); });

  row.append(again, menu, home);
  frag.appendChild(row);

  return frag;
}

/* ============================================================
   BOOT ERROR
   ============================================================ */
function showBootError(err: unknown, context: "boot" | "render" = "boot"): void {
  const app = document.querySelector("#app");
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? (err.stack ?? "") : "";
  const title = context === "render" ? "Something broke during play" : "Something went wrong";
  const subtitle = context === "render"
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

/* ============================================================
   BOOT
   ============================================================ */
function sanityCheckDecks(): void {
  for (const d of DECKS) {
    const errs = validateDeck(d);
    if (errs.length) console.error(`Deck ${d.id} errors:`, errs);
  }
}

try {
  sanityCheckDecks();
  render();
} catch (e) {
  showBootError(e, "boot");
}
