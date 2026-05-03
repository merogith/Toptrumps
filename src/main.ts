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

let game: GameSnapshot = abandonToHome();

const liveRegion = document.createElement("div");
liveRegion.className = "live-region";
liveRegion.setAttribute("aria-live", "polite");
liveRegion.setAttribute("aria-atomic", "true");
document.body.appendChild(liveRegion);

function announce(msg: string): void {
  liveRegion.textContent = "";
  requestAnimationFrame(() => {
    liveRegion.textContent = msg;
  });
}

function setAccent(theme: DeckTheme | null): void {
  const root = document.documentElement;
  if (theme) {
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-soft", theme.accentSoft);
  } else {
    root.style.setProperty("--accent", "#94a3b8");
    root.style.setProperty("--accent-soft", "rgba(148, 163, 184, 0.12)");
  }
}

function playerLabel(id: PlayerId): string {
  return `Player ${id}`;
}

function renderCard(
  theme: DeckTheme,
  card: Card,
  options: { activeStatId?: string | null; showStats?: boolean } = {}
): HTMLElement {
  const wrap = document.createElement("article");
  wrap.className = "game-card";
  wrap.setAttribute("aria-label", `${card.name} card`);

  const img = document.createElement("img");
  img.src = cardImageUrl(theme.id, card.id);
  img.alt = "";
  img.width = 320;
  img.height = 220;
  img.decoding = "async";
  wrap.appendChild(img);

  const body = document.createElement("div");
  body.className = "body";
  const title = document.createElement("h3");
  title.className = "title";
  title.textContent = card.name;
  body.appendChild(title);
  if (card.subtitle) {
    const sub = document.createElement("p");
    sub.className = "subtitle";
    sub.textContent = card.subtitle;
    body.appendChild(sub);
  }
  wrap.appendChild(body);

  if (options.showStats !== false) {
    const statsEl = document.createElement("div");
    statsEl.className = "stats";
    for (const s of theme.stats) {
      const row = document.createElement("div");
      row.className = "stat-row";
      if (options.activeStatId === s.id) row.classList.add("is-active");
      const lab = document.createElement("span");
      lab.textContent = s.label;
      const val = document.createElement("strong");
      val.textContent = String(card.stats[s.id]);
      row.appendChild(lab);
      row.appendChild(val);
      statsEl.appendChild(row);
    }
    wrap.appendChild(statsEl);
  }

  return wrap;
}

function clear(el: HTMLElement): void {
  el.replaceChildren();
}

function render(): void {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  setAccent(game.theme);
  clear(app);

  const main = document.createElement("main");
  main.className = "stack";

  switch (game.screen) {
    case "home":
      main.appendChild(renderHome());
      break;
    case "how_to_play":
      main.appendChild(renderHowToPlay());
      break;
    case "theme_pick":
      main.appendChild(renderThemePick());
      break;
    case "pass_device":
      main.appendChild(renderPassDevice());
      break;
    case "choose_stat":
      main.appendChild(renderChooseStat());
      break;
    case "reveal_prompt":
      main.appendChild(renderRevealPrompt());
      break;
    case "opponent_view":
      main.appendChild(renderOpponentView());
      break;
    case "round_result":
      main.appendChild(renderRoundResult());
      break;
    case "game_over":
      main.appendChild(renderGameOver());
      break;
    default:
      main.textContent = "Unknown screen";
  }

  app.appendChild(main);
}

function renderHome(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";

  const hero = document.createElement("div");
  hero.className = "hero";
  hero.innerHTML = `
    <p class="eyebrow">Local pass-and-play</p>
    <h1>Top Trumps</h1>
    <p class="muted">Two players, one screen. Hand the device between turns so nobody peeks at the wrong card.</p>
  `;
  frag.appendChild(hero);

  const row = document.createElement("div");
  row.className = "row";
  const play = document.createElement("button");
  play.type = "button";
  play.className = "btn btn-primary";
  play.textContent = "Choose deck";
  play.addEventListener("click", () => {
    game = { ...game, screen: "theme_pick" };
    announce("Choose a deck");
    render();
  });
  const rules = document.createElement("button");
  rules.type = "button";
  rules.className = "btn btn-ghost";
  rules.textContent = "How to play";
  rules.addEventListener("click", () => {
    game = { ...game, screen: "how_to_play" };
    render();
  });
  row.appendChild(play);
  row.appendChild(rules);
  frag.appendChild(row);

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <h2>Designed for honesty</h2>
    <p>Each round uses a short <strong>pass the device</strong> flow: challenger confirms, leader picks a category on their top card, challenger sees only their own card and value, then the app shows the result for both.</p>
    <p class="muted">Decks use 30 cards and six stats, in line with common Top Trumps packs. Art is placeholder until you add open-licensed images.</p>
  `;
  frag.appendChild(panel);

  return frag;
}

function renderHowToPlay(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";
  frag.innerHTML = `<h1>How to play</h1>`;

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <p class="muted">Based on classic Top Trumps rules: shuffle and deal the whole deck; each player holds a face-down pile and only looks at their top card; highest value in the chosen category wins the trick; winner picks next round’s category; ties go to a centre pile and the next winner takes everything.</p>
    <ol class="rules-list">
      <li><strong>Deal</strong> — the app shuffles and splits the deck evenly (30 cards → 15 each).</li>
      <li><strong>Leader</strong> — Player 1 leads first (like sitting left of the dealer). The leader always picks the stat for the round.</li>
      <li><strong>Pass the device</strong> — follow on-screen prompts so only the active player sees sensitive info.</li>
      <li><strong>Win</strong> — first player to collect all cards wins.</li>
    </ol>
    <p class="muted">Optional house rule (not enabled here): with three or fewer cards, some packs let you reorder your hand.</p>
  `;
  frag.appendChild(panel);

  const back = document.createElement("button");
  back.type = "button";
  back.className = "btn btn-ghost";
  back.textContent = "Back";
  back.addEventListener("click", () => {
    game = { ...game, screen: "home" };
    render();
  });
  frag.appendChild(back);

  return frag;
}

function renderThemePick(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";
  const head = document.createElement("div");
  head.innerHTML = `<h1>Pick a deck</h1><p class="muted">Three themes. Same Top Trumps style — 30 cards, six stats, 1–99 style values.</p>`;
  frag.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "theme-grid";
  for (const deck of DECKS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-card";
    btn.style.setProperty("--theme-accent", deck.accent);
    btn.innerHTML = `<span class="badge">30 cards</span><h3>${escapeHtml(deck.title)}</h3><p class="tagline">${escapeHtml(deck.tagline)}</p>`;
    btn.addEventListener("click", () => {
      const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
      game = newGame(deck, seed);
      announce(`Started ${deck.title}. Pass the device to ${playerLabel(game.deviceHolder)}.`);
      render();
    });
    grid.appendChild(btn);
  }
  frag.appendChild(grid);

  const tb = document.createElement("div");
  tb.className = "toolbar";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "btn btn-ghost";
  back.textContent = "Home";
  back.addEventListener("click", () => {
    game = abandonToHome();
    render();
  });
  tb.appendChild(back);
  frag.appendChild(tb);

  return frag;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPassDevice(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";
  if (!game.theme) return frag;

  const counts = document.createElement("p");
  counts.className = "muted";
  counts.textContent = `${game.theme.title} · ${playerLabel(1)}: ${game.p1.length} cards · ${playerLabel(2)}: ${game.p2.length} cards${
    game.kitty.length ? ` · Centre pile: ${game.kitty.length}` : ""
  }`;

  const banner = document.createElement("div");
  banner.className = "player-banner";
  banner.textContent = `Pass to ${playerLabel(game.deviceHolder)}`;

  const pass = document.createElement("div");
  pass.className = "pass-screen panel";
  pass.innerHTML = `
    <div class="icon" aria-hidden="true">🔒</div>
    <h2>Privacy check</h2>
    <p class="muted">Only <strong>${playerLabel(game.deviceHolder)}</strong> should look at the screen now. The other player steps back or looks away.</p>
  `;

  const ok = document.createElement("button");
  ok.type = "button";
  ok.className = "btn btn-primary";
  ok.textContent = `I'm ${playerLabel(game.deviceHolder)} — continue`;
  ok.addEventListener("click", () => {
    game = acknowledgePass(game);
    if (game.screen === "choose_stat") {
      announce(`${playerLabel(game.leader)}, choose a stat on your top card.`);
    } else {
      announce(`Pass to ${playerLabel(game.deviceHolder)}.`);
    }
    render();
  });

  const quit = document.createElement("button");
  quit.type = "button";
  quit.className = "btn btn-danger";
  quit.textContent = "Quit to menu";
  quit.addEventListener("click", () => {
    if (confirm("Quit this match?")) {
      game = abandonToHome();
      announce("Returned to menu.");
      render();
    }
  });

  frag.appendChild(counts);
  frag.appendChild(banner);
  frag.appendChild(pass);
  frag.appendChild(ok);
  frag.appendChild(quit);
  return frag;
}

function leaderTopCard(): import("./types").Card | null {
  return game.leader === 1 ? game.p1[0] ?? null : game.p2[0] ?? null;
}

function challengerTopCard(): import("./types").Card | null {
  const c = game.leader === 1 ? 2 : 1;
  return c === 1 ? game.p1[0] ?? null : game.p2[0] ?? null;
}

function renderChooseStat(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";
  if (!game.theme) return frag;

  const banner = document.createElement("div");
  banner.className = "player-banner";
  banner.textContent = `${playerLabel(game.leader)} — your turn to lead`;

  const intro = document.createElement("p");
  intro.className = "muted";
  intro.innerHTML = `Pick <strong>one</strong> category from your top card. Higher number wins unless the deck says otherwise.`;

  frag.appendChild(banner);
  frag.appendChild(intro);

  const card = leaderTopCard();
  if (!card) {
    frag.appendChild(document.createTextNode("No cards left."));
    return frag;
  }

  frag.appendChild(renderCard(game.theme, card, { activeStatId: null }));

  const grid = document.createElement("div");
  grid.className = "stat-grid";
  for (const s of game.theme.stats) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "stat-btn";
    b.innerHTML = `<span class="label">${escapeHtml(s.label)}</span><span class="value">${card.stats[s.id]}</span>`;
    b.addEventListener("click", () => {
      game = selectStat(game, s.id);
      announce(`Category chosen. Pass to ${playerLabel(game.deviceHolder)}.`);
      render();
    });
    grid.appendChild(b);
  }
  frag.appendChild(grid);

  const tb = document.createElement("div");
  tb.className = "toolbar";
  const quit = document.createElement("button");
  quit.type = "button";
  quit.className = "btn btn-danger";
  quit.textContent = "Quit";
  quit.addEventListener("click", () => {
    if (confirm("Quit?")) {
      game = abandonToHome();
      render();
    }
  });
  tb.appendChild(quit);
  frag.appendChild(tb);

  return frag;
}

function renderRevealPrompt(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";
  if (!game.theme || !game.pendingStatId) return frag;

  const stat = game.theme.stats.find((x) => x.id === game.pendingStatId);
  const banner = document.createElement("div");
  banner.className = "player-banner";
  banner.textContent = `Pass to ${playerLabel(game.deviceHolder)}`;

  const panel = document.createElement("div");
  panel.className = "panel pass-screen";
  panel.innerHTML = `
    <h2>Category locked</h2>
    <p class="muted">The leader has chosen a category. Do <strong>not</strong> show this screen to them if you already know their card.</p>
    <p><strong>${stat ? escapeHtml(stat.label) : "Stat"}</strong> will be compared.</p>
    <p class="muted">Next, only the challenger sees their own card and value.</p>
  `;

  const ok = document.createElement("button");
  ok.type = "button";
  ok.className = "btn btn-primary";
  ok.textContent = `I'm ${playerLabel(game.deviceHolder)} — show my card`;
  ok.addEventListener("click", () => {
    game = acknowledgeRevealPass(game);
    announce("Review your card, then reveal the result.");
    render();
  });

  frag.appendChild(banner);
  frag.appendChild(panel);
  frag.appendChild(ok);
  return frag;
}

function renderOpponentView(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";
  if (!game.theme || !game.pendingStatId) return frag;

  const challenger: PlayerId = game.leader === 1 ? 2 : 1;
  const banner = document.createElement("div");
  banner.className = "player-banner";
  banner.textContent = `${playerLabel(challenger)} — your top card`;

  const stat = game.theme.stats.find((x) => x.id === game.pendingStatId);
  const card = challengerTopCard();
  if (!card) {
    frag.textContent = "Error: no card.";
    return frag;
  }

  const note = document.createElement("p");
  note.className = "muted";
  note.innerHTML = `Compared stat: <strong>${stat ? escapeHtml(stat.label) : ""}</strong>. Your value is highlighted.`;

  frag.appendChild(banner);
  frag.appendChild(note);
  frag.appendChild(renderCard(game.theme, card, { activeStatId: game.pendingStatId }));

  const reveal = document.createElement("button");
  reveal.type = "button";
  reveal.className = "btn btn-primary";
  reveal.textContent = "Reveal round result";
  reveal.addEventListener("click", () => {
    game = revealAndResolve(game);
    if (game.lastRound) {
      if (game.lastRound.winner === "tie") {
        announce("Draw — cards go to the centre pile.");
      } else {
        announce(`${playerLabel(game.lastRound.winner)} wins the trick.`);
      }
    }
    render();
  });

  frag.appendChild(reveal);
  return frag;
}

function renderRoundResult(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";
  if (!game.theme || !game.lastRound) return frag;

  const lr = game.lastRound;
  const title = document.createElement("h1");
  title.textContent = lr.winner === "tie" ? "Draw!" : `${playerLabel(lr.winner as PlayerId)} wins`;

  const sub = document.createElement("p");
  sub.className = "muted";
  sub.textContent = `${lr.statLabel} · ${lr.higherIsBetter ? "Higher wins" : "Lower wins"}`;

  frag.appendChild(title);
  frag.appendChild(sub);

  const grid = document.createElement("div");
  grid.className = "compare-grid two";

  const wrap1 = document.createElement("div");
  const p1l = document.createElement("p");
  p1l.textContent = playerLabel(1);
  p1l.className = "muted";
  wrap1.appendChild(p1l);
  wrap1.appendChild(renderCard(game.theme, lr.p1Card, { activeStatId: lr.statId }));

  const wrap2 = document.createElement("div");
  const p2l = document.createElement("p");
  p2l.textContent = playerLabel(2);
  p2l.className = "muted";
  wrap2.appendChild(p2l);
  wrap2.appendChild(renderCard(game.theme, lr.p2Card, { activeStatId: lr.statId }));

  grid.appendChild(wrap1);
  grid.appendChild(wrap2);
  frag.appendChild(grid);

  const scores = document.createElement("p");
  scores.className = "muted";
  scores.textContent = `Cards held — ${playerLabel(1)}: ${game.p1.length}, ${playerLabel(2)}: ${game.p2.length}${
    game.kitty.length ? ` · Centre: ${game.kitty.length}` : ""
  }`;
  frag.appendChild(scores);

  const matchFinished = game.p1.length === 0 || game.p2.length === 0;

  const next = document.createElement("button");
  next.type = "button";
  next.className = "btn btn-primary";
  next.textContent = matchFinished ? "Finish" : "Next round";
  next.addEventListener("click", () => {
    game = continueAfterRound(game);
    if (game.screen === "game_over") announce(game.winner ? `${playerLabel(game.winner)} wins the match.` : "Game over.");
    else if (game.screen === "pass_device") announce(`Pass to ${playerLabel(game.deviceHolder)}.`);
    render();
  });
  frag.appendChild(next);

  return frag;
}

function renderGameOver(): HTMLElement {
  const frag = document.createElement("div");
  frag.className = "stack";
  const title = document.createElement("h1");
  title.textContent = game.winner ? `${playerLabel(game.winner)} wins the game!` : "Game over";

  const sub = document.createElement("p");
  sub.className = "muted";
  sub.textContent = game.winner
    ? "All cards collected — classic Top Trumps win condition."
    : "No winner — unexpected empty state.";

  frag.appendChild(title);
  frag.appendChild(sub);

  if (game.theme && game.lastRound) {
    const recap = document.createElement("div");
    recap.className = "panel";
    recap.innerHTML = `<p class="muted">Final trick used <strong>${escapeHtml(game.lastRound.statLabel)}</strong>.</p>`;
    frag.appendChild(recap);
  }

  const row = document.createElement("div");
  row.className = "row";
  const again = document.createElement("button");
  again.type = "button";
  again.className = "btn btn-primary";
  again.textContent = "Rematch (same deck)";
  again.addEventListener("click", () => {
    const id = game.theme?.id;
    const deck = id ? getDeckById(id) : undefined;
    if (deck) {
      const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
      game = newGame(deck, seed);
      announce("New match.");
    }
    render();
  });
  const menu = document.createElement("button");
  menu.type = "button";
  menu.className = "btn btn-ghost";
  menu.textContent = "Deck menu";
  menu.addEventListener("click", () => {
    game = { ...abandonToHome(), screen: "theme_pick" };
    render();
  });
  const home = document.createElement("button");
  home.type = "button";
  home.className = "btn btn-ghost";
  home.textContent = "Home";
  home.addEventListener("click", () => {
    game = abandonToHome();
    render();
  });
  row.appendChild(again);
  row.appendChild(menu);
  row.appendChild(home);
  frag.appendChild(row);

  return frag;
}

function sanityCheckDecks(): void {
  for (const d of DECKS) {
    const errs = validateDeck(d);
    if (errs.length) console.error(`Deck ${d.id}:`, errs);
  }
}

sanityCheckDecks();
render();
