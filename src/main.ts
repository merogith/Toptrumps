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
import { decideStat } from "./bot";
import type { Card, DeckTheme, Difficulty, GameSnapshot, PlayerId } from "./types";

/* ============================================================
   STATE
   ============================================================ */
let game: GameSnapshot = abandonToHome();

/* ============================================================
   BOT SCHEDULER
   ============================================================ */
let botTimerId: ReturnType<typeof setTimeout> | null = null;

function clearBotTimer(): void {
  if (botTimerId !== null) {
    clearTimeout(botTimerId);
    botTimerId = null;
  }
}

function executeBotAction(): void {
  if (!game.bot) return;
  const { player: botPlayer, difficulty } = game.bot;

  switch (game.screen) {
    case "pass_device":
      game = acknowledgePass(game);
      break;
    case "choose_stat":
      if (game.leader === botPlayer) {
        game = selectStat(game, decideStat(game, botPlayer, difficulty));
      }
      break;
    case "reveal_prompt":
      game = acknowledgeRevealPass(game);
      break;
    case "opponent_view":
      if (game.deviceHolder === botPlayer) {
        game = revealAndResolve(game);
        if (game.lastRound) {
          if (game.lastRound.winner === "tie") announce("Draw — cards go to the centre pile.");
          else announce(`${playerLabel(game.lastRound.winner as PlayerId, game)} wins the trick.`);
        }
      }
      break;
  }
}

function scheduleBot(): void {
  if (!game.bot || botTimerId !== null) return;
  const { player: botPlayer, difficulty } = game.bot;

  let delay = 0;
  let shouldAct = false;

  if (game.screen === "pass_device") {
    shouldAct = true;
    delay = 0;
  } else if (game.screen === "choose_stat" && game.leader === botPlayer) {
    shouldAct = true;
    delay = difficulty === "easy" ? 1200 : difficulty === "medium" ? 800 : 500;
  } else if (game.screen === "reveal_prompt") {
    shouldAct = true;
    delay = 0;
  } else if (game.screen === "opponent_view" && game.deviceHolder === botPlayer) {
    shouldAct = true;
    delay = 0;
  }

  if (!shouldAct) return;

  botTimerId = setTimeout(() => {
    botTimerId = null;
    executeBotAction();
    render();
  }, delay);
}

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

function playerLabel(id: PlayerId, g: GameSnapshot): string {
  if (!g.bot) return `Player ${id}`;
  if (id === g.bot.player) {
    return g.bot.difficulty === "hard" ? "Hard Bot"
         : g.bot.difficulty === "medium" ? "Medium Bot"
         : "Easy Bot";
  }
  return "You";
}

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
  winnerOutcome?: PlayerId | "tie" | null;
  thisPlayer?: PlayerId | null;
  onStatSelect?: (statId: string) => void;
}

function renderCard(theme: DeckTheme, card: Card, opts: CardRenderOpts = {}): HTMLElement {
  const { activeStatId, compact = false, winnerOutcome, thisPlayer, onStatSelect } = opts;

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
  if (card.imageFocus) img.style.objectPosition = card.imageFocus;
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
    const row = onStatSelect
      ? el("button", "card-stat-row")
      : el("div", "card-stat-row");
    const isActive = activeStatId === s.id;

    if (isActive) {
      row.classList.add("is-active");
      if (winnerOutcome && thisPlayer && winnerOutcome === thisPlayer) {
        row.classList.add("is-win");
      }
    }

    if (onStatSelect) {
      (row as HTMLButtonElement).type = "button";
      row.addEventListener("click", () => onStatSelect(s.id));
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
  p1lbl.textContent = g.bot ? (g.bot.player === 1 ? "Bot" : "You") : "P1";
  const p1cnt = el("span", "hud-count" + (p1Leads ? " is-leading" : ""));
  p1cnt.textContent = String(p1Count);
  p1.append(p1lbl, p1cnt);

  const theme = el("span", "hud-theme");
  if (g.bot) {
    const diffShort = g.bot.difficulty === "hard" ? "Hard" : g.bot.difficulty === "medium" ? "Med" : "Easy";
    theme.textContent = `${g.theme?.title.split(" ").slice(0, 2).join(" ") ?? ""} · ${diffShort}`;
  } else {
    theme.textContent = g.theme?.title.split(" ").slice(0, 2).join(" ") ?? "";
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
      case "mode_pick":     main.appendChild(renderModePick()); break;
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
    scheduleBot();
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
  starwars: "🚀",
  foundation: "🔮",
  medieval: "⚔️",
  pokemon: "⚡",
  spongebob: "🧽",
  behzat: "🕵️",
};

function renderThemePick(): HTMLElement {
  const frag = el("div", "stack");

  const hdr = el("div");
  hdr.innerHTML = `<h1>Pick a deck</h1><p>${DECKS.length} themes · 30 cards each · 6 stats · classic Top Trumps rules.</p>`;
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
      game = { ...game, screen: "mode_pick", theme: deck };
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
   MODE PICKER  (2-player vs bot, and difficulty)
   ============================================================ */
function renderModePick(): HTMLElement {
  const frag = el("div", "stack");
  const deck = game.theme;
  if (!deck) return frag;

  const icon = DECK_ICONS[deck.id] ?? "🎴";

  /* Deck context strip */
  const strip = el("div", "mode-deck-strip");
  const stripIcon = el("span", "mds-icon");
  stripIcon.setAttribute("aria-hidden", "true");
  stripIcon.textContent = icon;
  const stripInfo = el("div");
  const stripName = el("div", "mds-name");
  stripName.textContent = deck.title;
  const stripTag = el("div", "mds-tag");
  stripTag.textContent = deck.tagline;
  stripInfo.append(stripName, stripTag);
  strip.append(stripIcon, stripInfo);
  frag.appendChild(strip);

  /* Section: pass & play */
  const humanLabel = el("p", "mode-section-label");
  humanLabel.textContent = "Pass & play";
  frag.appendChild(humanLabel);

  const twoBtn = el("button", "mode-2p-btn");
  twoBtn.type = "button";
  const m2pIcon = el("span", "m2p-icon");
  m2pIcon.setAttribute("aria-hidden", "true");
  m2pIcon.textContent = "👥";
  const m2pText = el("span");
  const m2pName = el("span", "m2p-name");
  m2pName.textContent = "2 Players";
  const m2pDesc = el("span", "m2p-desc");
  m2pDesc.textContent = "Two humans take turns on one screen";
  m2pText.append(m2pName, m2pDesc);
  twoBtn.append(m2pIcon, m2pText);
  twoBtn.addEventListener("click", () => {
    const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    game = newGame(deck, seed, null);
    announce(`${deck.title} started. Pass to Player 1.`);
    render();
  });
  frag.appendChild(twoBtn);

  /* Section: vs computer */
  const botLabel = el("p", "mode-section-label");
  botLabel.textContent = "Vs computer";
  frag.appendChild(botLabel);

  const diffGrid = el("div", "mode-diff-grid");

  const diffs: Array<{ d: Difficulty; icon: string; name: string; desc: string }> = [
    { d: "easy",   icon: "👾", name: "Easy",   desc: "Slips up sometimes" },
    { d: "medium", icon: "🤖", name: "Medium", desc: "Plays its best stat every turn" },
    { d: "hard",   icon: "🧠", name: "Hard",   desc: "Counts every card in the deck" },
  ];

  for (const item of diffs) {
    const btn = el("button", "mode-diff-btn");
    btn.type = "button";

    const ico = el("div", "mdb-icon");
    ico.setAttribute("aria-hidden", "true");
    ico.textContent = item.icon;

    const name = el("div", "mdb-name");
    name.textContent = item.name;

    const desc = el("div", "mdb-desc");
    desc.textContent = item.desc;

    btn.append(ico, name, desc);
    btn.addEventListener("click", () => {
      const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
      game = newGame(deck, seed, { player: 2, difficulty: item.d });
      announce(`${deck.title} vs ${item.name} bot. Your turn first.`);
      render();
    });
    diffGrid.appendChild(btn);
  }
  frag.appendChild(diffGrid);

  /* Back button */
  const tb = el("div", "toolbar");
  const back = el("button", "btn btn-ghost");
  back.type = "button";
  back.textContent = "← Back to decks";
  back.addEventListener("click", () => {
    game = { ...game, screen: "theme_pick" };
    render();
  });
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

  /* In bot mode all pass_device screens auto-advance — just show the HUD */
  if (game.bot) {
    frag.appendChild(renderHUD(game));
    return frag;
  }

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
      clearBotTimer();
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
   BOT THINKING SCREEN (shown while bot picks a stat)
   ============================================================ */
function renderBotThinking(difficulty: Difficulty): HTMLElement {
  const icons: Record<Difficulty, string> = { easy: "👾", medium: "🤖", hard: "🧠" };
  const names: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

  const wrap = el("div", "bot-thinking");

  const iconDiv = el("div", "bot-think-icon");
  iconDiv.setAttribute("aria-hidden", "true");
  iconDiv.textContent = icons[difficulty];

  const label = el("h2", "bot-think-label");
  label.textContent = `${names[difficulty]} bot is choosing…`;

  const dots = el("div", "bot-think-dots");
  dots.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) dots.appendChild(document.createElement("span"));

  wrap.append(iconDiv, label, dots);
  return wrap;
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

  /* Bot is the leader — show thinking indicator, auto-picks via scheduleBot */
  if (game.bot && game.bot.player === game.leader) {
    frag.appendChild(renderBotThinking(game.bot.difficulty));
    return frag;
  }

  const banner = el("div", "player-banner");
  const dot = el("span", "banner-dot");
  const bannerText = el("span");
  bannerText.textContent = `${playerLabel(game.leader, game)} — pick a stat to challenge`;
  banner.append(dot, bannerText);
  frag.appendChild(banner);

  const card = leaderCard(game);
  if (!card) { frag.appendChild(document.createTextNode("No cards remaining.")); return frag; }

  frag.appendChild(renderCard(game.theme, card, {
    activeStatId: null,
    onStatSelect: (statId) => {
      const stat = game.theme!.stats.find((s) => s.id === statId);
      game = selectStat(game, statId);
      announce(`${stat?.label ?? statId} chosen.`);
      render();
    },
  }));

  const tb = el("div", "toolbar");
  const quit = el("button", "btn btn-danger btn-sm");
  quit.type = "button";
  quit.textContent = "Abandon match";
  quit.addEventListener("click", () => {
    if (confirm("Abandon this match?")) { clearBotTimer(); game = abandonToHome(); render(); }
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

  /* In bot mode the privacy step is unnecessary — auto-advances */
  if (game.bot) {
    frag.appendChild(renderHUD(game));
    return frag;
  }

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

  /* Bot is the challenger — auto-reveals, show HUD briefly */
  if (game.bot && game.deviceHolder === game.bot.player) {
    frag.appendChild(renderHUD(game));
    return frag;
  }

  frag.appendChild(renderHUD(game));

  /* Sticky action bar at the top of the viewport so the player can
     tap Reveal without scrolling past the full card. */
  const ctaBar = el("div", "play-cta-dock");
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
  ctaBar.appendChild(revealBtn);
  frag.appendChild(ctaBar);

  const chall = challenger(game);
  const banner = el("div", "player-banner");
  const dot = el("span", "banner-dot");
  const bannerText = el("span");
  bannerText.textContent = `${playerLabel(chall, game)} — your top card`;
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

  return frag;
}

/* ============================================================
   ROUND RESULT
   ============================================================ */

/** True if user prefers reduced motion. Honoured by reveal animations. */
function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Animate a number from 0 to `to` over `duration` ms. No-op under reduced motion. */
function animateCount(node: HTMLElement, to: number, duration = 650): void {
  if (prefersReducedMotion()) { node.textContent = String(to); return; }
  const start = performance.now();
  const from = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    /* easeOutCubic */
    const eased = 1 - Math.pow(1 - t, 3);
    const v = Math.round(from + (to - from) * eased);
    node.textContent = String(v);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Soft haptic feedback. Silently no-ops where unsupported. */
function haptic(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch { /* ignore */ }
}

/** Bot's reaction line based on outcome and margin. Only used in bot mode. */
function botReactionLine(g: GameSnapshot, winner: PlayerId | "tie", margin: number): string {
  if (!g.bot) return "";
  const botWon = winner === g.bot.player;
  const youWon = winner !== "tie" && winner !== g.bot.player;
  const big = margin >= 40;
  const close = margin > 0 && margin <= 8;
  if (winner === "tie") return "Bot: \"A perfect draw. Curious.\"";
  if (youWon && big)   return "Bot: \"…that wasn't even close.\"";
  if (youWon && close) return "Bot: \"Lucky pick. I'll remember that one.\"";
  if (youWon)          return "Bot: \"Well played. Next round.\"";
  if (botWon && big)   return "Bot: \"Outclassed. Better luck next round.\"";
  if (botWon && close) return "Bot: \"Squeaked that one out.\"";
  if (botWon)          return "Bot: \"My round.\"";
  return "";
}

/* Tracks which round we last ran the count-up animation for, so toggling
   the mobile card view does NOT restart the reveal sequence. */
let lastAnimatedRoundKey: string | null = null;

function renderRoundResult(): HTMLElement {
  const frag = el("div", "stack");
  if (!game.theme || !game.lastRound) return frag;

  const lr = game.lastRound;
  const isTie = lr.winner === "tie";
  const winnerPid = isTie ? null : (lr.winner as PlayerId);
  const matchFinished = game.p1.length === 0 || game.p2.length === 0;
  const margin = Math.abs(lr.p1Value - lr.p2Value);

  /* Animation gating — only animate on first render of this round. */
  const roundKey = `${lr.statId}-${game.p1.length}-${game.p2.length}-${lr.p1Card.id}-${lr.p2Card.id}`;
  const isFirstReveal = lastAnimatedRoundKey !== roundKey;
  if (isFirstReveal) lastAnimatedRoundKey = roundKey;

  /* Haptic only on first reveal of the round (not on toggle re-renders). */
  if (game.bot && isFirstReveal) {
    const userWon = winnerPid !== null && winnerPid !== game.bot.player;
    if (isTie) haptic(40);
    else if (userWon) haptic([20, 60, 30, 60, 80]);
    else haptic([80, 80, 20]);
  }

  /* Determine human side on mobile: in bot mode, the human is the
     non-bot player; in 2P pass-and-play, we don't toggle (both human). */
  const humanSide: PlayerId | null = game.bot ? otherPlayer(game.bot.player) : null;

  /* Sticky action bar at the top of the viewport so the player never has
     to scroll past tall card content to reach the next-round button. */
  const ctaBar = el("div", "play-cta-dock");
  const ctaBtn = el("button", "btn btn-primary");
  ctaBtn.type = "button";
  ctaBtn.textContent = matchFinished ? "Finish match" : "Next round →";
  ctaBtn.addEventListener("click", () => {
    game = continueAfterRound(game);
    if (game.screen === "game_over") {
      announce(game.winner ? `${playerLabel(game.winner, game)} wins the match!` : "Game over.");
    }
    render();
  });
  ctaBar.appendChild(ctaBtn);
  frag.appendChild(ctaBar);

  /* Compact result summary — minimalist verdict + score + reveal toggle.
     One card replaces the previous three stacked blocks. */
  const summary = el("div", `result-summary ${isTie ? "is-tie" : "is-win"}${isFirstReveal ? " reveal-pop" : ""}`);

  /* Verdict row: small trophy + headline + stat sublabel */
  const verdict = el("div", "rs-verdict");
  const vIcon = el("span", "rs-icon");
  vIcon.setAttribute("aria-hidden", "true");
  vIcon.textContent = isTie ? "🤝" : "🏆";
  const vText = el("div", "rs-text");
  const vHead = el("div", "rs-headline");
  /* "You win" (no s) for the human; "Bot wins" / "Player 1 wins" otherwise. */
  const winnerLabel = winnerPid !== null ? playerLabel(winnerPid, game) : "";
  const winVerb = winnerLabel === "You" ? "win" : "wins";
  vHead.textContent = isTie ? "Draw" : `${winnerLabel} ${winVerb}`;
  const vSub = el("div", "rs-sublabel");
  vSub.textContent = `${lr.statLabel} · ${lr.higherIsBetter ? "higher wins" : "lower wins"}`;
  vText.append(vHead, vSub);
  verdict.append(vIcon, vText);
  summary.appendChild(verdict);

  /* Score row: P1 value · vs · P2 value, compact */
  const score = el("div", "rs-score");

  const s1 = el("div", "rs-side");
  const s1lbl = el("div", "rs-side-label");
  s1lbl.textContent = playerLabel(1, game);
  const s1val = el("div", `rs-side-value${!isTie && winnerPid === 1 ? " is-winner" : !isTie ? " is-loser" : ""}`);
  s1val.textContent = isFirstReveal ? "0" : String(lr.p1Value);
  s1.append(s1lbl, s1val);

  const sVs = el("div", "rs-vs");
  sVs.textContent = "VS";

  const s2 = el("div", "rs-side");
  const s2lbl = el("div", "rs-side-label");
  s2lbl.textContent = playerLabel(2, game);
  const s2val = el("div", `rs-side-value${!isTie && winnerPid === 2 ? " is-winner" : !isTie ? " is-loser" : ""}`);
  s2val.textContent = isFirstReveal ? "0" : String(lr.p2Value);
  s2.append(s2lbl, s2val);

  score.append(s1, sVs, s2);
  summary.appendChild(score);

  if (isFirstReveal) {
    queueMicrotask(() => {
      animateCount(s1val, lr.p1Value);
      animateCount(s2val, lr.p2Value);
    });
  }

  frag.appendChild(summary);

  /* Card display area — both cards in DOM; CSS hides the non-active one
     on mobile, shows both on desktop. */
  const cardArea = el("div", "result-cards");
  if (humanSide) cardArea.dataset.mobileSide = String(humanSide);

  const wrap1 = el("div", "compare-player");
  wrap1.dataset.side = "1";
  const lbl1 = el("div", `compare-player-label${!isTie && winnerPid === 1 ? " is-winner" : !isTie ? " is-loser" : ""}`);
  lbl1.textContent = playerLabel(1, game) + (!isTie && winnerPid === 1 ? " 🏆" : "");
  wrap1.append(lbl1, renderCard(game.theme, lr.p1Card, {
    activeStatId: lr.statId,
    compact: true,
    winnerOutcome: lr.winner,
    thisPlayer: 1,
  }));

  const wrap2 = el("div", "compare-player");
  wrap2.dataset.side = "2";
  const lbl2 = el("div", `compare-player-label${!isTie && winnerPid === 2 ? " is-winner" : !isTie ? " is-loser" : ""}`);
  lbl2.textContent = playerLabel(2, game) + (!isTie && winnerPid === 2 ? " 🏆" : "");
  wrap2.append(lbl2, renderCard(game.theme, lr.p2Card, {
    activeStatId: lr.statId,
    compact: true,
    winnerOutcome: lr.winner,
    thisPlayer: 2,
  }));

  cardArea.append(wrap1, wrap2);

  /* Mobile-only reveal toggle (bot mode only — there's a meaningful
     "your card vs theirs" distinction). Lives inside the summary panel
     so the three pieces — verdict, score, toggle — sit together. */
  if (humanSide) {
    const toggleBtn = el("button", "rs-reveal-toggle");
    toggleBtn.type = "button";
    const updateToggleLabel = () => {
      const showingHuman = cardArea.dataset.mobileSide === String(humanSide);
      toggleBtn.innerHTML = showingHuman
        ? `<span aria-hidden="true">👁</span><span>Reveal bot's card</span>`
        : `<span aria-hidden="true">↩</span><span>Show my card</span>`;
      toggleBtn.setAttribute("aria-pressed", showingHuman ? "false" : "true");
    };
    updateToggleLabel();
    toggleBtn.addEventListener("click", () => {
      const current = Number(cardArea.dataset.mobileSide ?? humanSide) as PlayerId;
      const next = otherPlayer(current);
      cardArea.dataset.mobileSide = String(next);
      updateToggleLabel();
      /* Brief flip animation on the card being revealed */
      const reveal = cardArea.querySelector<HTMLElement>(`.compare-player[data-side="${next}"]`);
      if (reveal && !prefersReducedMotion()) {
        reveal.classList.remove("flip-in");
        /* force reflow so re-adding the class re-runs the animation */
        void reveal.offsetWidth;
        reveal.classList.add("flip-in");
      }
      haptic(15);
    });
    summary.appendChild(toggleBtn);
  }

  frag.appendChild(cardArea);

  /* Bot reaction quip — small, under the cards */
  if (game.bot) {
    const quipText = botReactionLine(game, lr.winner, margin);
    if (quipText) {
      const quip = el("p", "bot-quip");
      quip.textContent = quipText;
      frag.appendChild(quip);
    }
  }

  if (isTie) {
    const tieNote = el("p", "score-line");
    tieNote.textContent = `${game.kitty.length} card${game.kitty.length !== 1 ? "s" : ""} go to the centre pile.`;
    frag.appendChild(tieNote);
  }

  /* Card count strip */
  const scoreLine = el("p", "score-line");
  let scoreText = `Cards — ${playerLabel(1, game)}: ${game.p1.length} · ${playerLabel(2, game)}: ${game.p2.length}`;
  if (game.kitty.length) scoreText += ` · Centre: ${game.kitty.length}`;
  scoreLine.textContent = scoreText;
  frag.appendChild(scoreLine);

  const tb = el("div", "toolbar");
  const quit = el("button", "btn btn-danger btn-sm");
  quit.type = "button";
  quit.textContent = "Abandon match";
  quit.addEventListener("click", () => {
    if (confirm("Abandon this match?")) { clearBotTimer(); game = abandonToHome(); render(); }
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
    ? `${playerLabel(game.winner, game)} wins!`
    : "Game over!";

  const sub = el("p");
  sub.textContent = game.winner
    ? `${playerLabel(game.winner, game)} collected all 30 cards — classic Top Trumps victory.`
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
      game = newGame(deck, seed, game.bot);  /* preserve mode (2P or bot difficulty) */
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
