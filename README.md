# Top Trumps

A polished, dependency-free **Top Trumps** card game for the browser. Play
pass-and-play with a friend on one device, or take on a bot with three
difficulty levels. Seven themed decks, 30 cards each, six stats per card.

**[Play the demo](https://merogith.github.io/Toptrumps/)**

Choose **Play Field Lab vs Easy bot** to start immediately with original inline SVG artwork. Pick a stat (↑ higher wins, ↓ lower wins), compare the values, and collect both cards. The winner leads the next round; tied cards wait in the centre for the next winner. Use **Choose deck** for all seven decks and pass-and-play. Completed matches offer a rematch with the same mode and difficulty. [Round rules](src/game/engine.ts) · [Full-match browser test](e2e/play.spec.ts).

Built with TypeScript and Vite. No framework, no runtime dependencies — the
whole game ships as one small bundle (~20 kB gzipped).

---

## Features

- **Two ways to play** — local 2-player pass-and-play, or single player vs an
  Easy / Medium / Hard bot.
- **A privacy flow that actually works** — pass-and-play uses two confirmation
  gates per round so neither player sees the other's card.
- **Three bot difficulties** — from a beatable amateur to a card-counter that
  tracks every card still in play and picks the stat with the best win rate.
- **Seven decks** — Field Lab (original survey rovers), Star Wars, Foundation, Warriors of the Ages, Pokémon Gen 1,
  SpongeBob SquarePants, and Behzat Ç.
- **Designed for phones** — touch-first layout, sticky action buttons, animated
  count-ups, optional haptics, and full `prefers-reduced-motion` support.
- **Accessible** — keyboard navigable, ARIA live announcements, skip link,
  semantic markup.

## Tech stack

| Concern    | Choice                                            |
| ---------- | ------------------------------------------------- |
| Language   | TypeScript (strict)                               |
| Build/dev  | Vite                                              |
| UI         | Hand-rolled DOM, no framework                     |
| Tests      | Vitest (unit + happy-dom smoke), Playwright (e2e) |
| Quality    | ESLint (flat config) + Prettier + EditorConfig    |
| Deployment | GitHub Pages (`/docs`) via GitHub Actions         |

## Project structure

```
src/
  types.ts                 Shared domain types
  main.ts                  Thin entry point: boot + mount
  style.css                Design tokens + all component styles

  game/                    Pure, framework-free game logic (fully unit-tested)
    engine.ts                State machine: deal, select stat, resolve, win
    bot.ts                   Easy/Medium/Hard stat-selection AI
    rng.ts                   Seedable PRNG + Fisher–Yates shuffle
    decks.ts                 The seven decks + placeholder-art generator

  ui/                      Stateless presentation helpers
    dom.ts                   Element creation + HTML escaping
    labels.ts                Player / card / deck naming
    accent.ts                Per-theme accent colour CSS vars
    announce.ts              ARIA live-region announcements
    feedback.ts              Count-up animation + haptics (reduced-motion aware)
    icons.ts, boot-error.ts

  components/              Reusable view pieces
    card.ts, hud.ts, bot-thinking.ts

  screens/                One module per screen (pure render functions)
    home, how-to-play, theme-pick, mode-pick, pass-device, choose-stat,
    reveal-prompt, opponent-view, round-result, game-over, shared

  app/
    context.ts               The narrow interface screens receive
    controller.ts            Owns state, render dispatch, and the bot scheduler

src/data/card-art-manifest.json  cardId → fetched image path
public/cards/                Card artwork (or fall back to generated SVGs)
e2e/                         Playwright full-match test
```

### Architecture at a glance

- **`game/` is pure.** The engine takes an immutable `GameSnapshot` and returns
  the next one — no DOM, no globals — which is why it's exhaustively testable.
- **`GameController` owns the only mutable state** and the bot timer. It renders
  the active screen and passes screens a narrow `GameContext` (read state,
  request a re-render) so the dependency graph stays one-directional.
- **Screens are pure render functions** of the form `(ctx) => HTMLElement`. They
  never import the controller class, which keeps them isolated and the module
  graph free of cycles.

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173/**).

## Scripts

| Script               | What it does                                           |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Dev server with hot reload                             |
| `npm run build`      | Production build to `dist/`                            |
| `npm run build:docs` | Build to `docs/` with the `/Toptrumps/` base for Pages |
| `npm run typecheck`  | `tsc --noEmit`                                         |
| `npm run lint`       | ESLint                                                 |
| `npm run format`     | Prettier (write)                                       |
| `npm test`           | Vitest unit + smoke tests                              |
| `npm run test:e2e`   | Playwright full-match test in Chromium                 |
| `npm run ci`         | typecheck → lint → format check → tests → e2e → builds |

## Testing

- **Unit** (`src/game/*.test.ts`) — the engine state machine, bot decisions, RNG
  fairness/determinism, and conservation of all 30 unique cards through wins,
  repeated ties, kitty collection and final-tie outcomes. Seeded complete matches
  cover every deck with human choices and all three bot difficulties.
- **Smoke** (`src/app/controller.smoke.test.ts`) — boots the real controller in
  happy-dom and plays complete human and bot matches plus rematches through the actual UI, proving
  every screen renders and wires up without a browser.
- **End-to-end** (`e2e/play.spec.ts`) — Playwright drives Chromium from the menu
  through a full match to game over.

```bash
npm test                          # unit + smoke
npx playwright install chromium   # first time only
npm run test:e2e                  # browser e2e
```

## Match rules and limits

The round winner takes both played cards and any centre pile. If a final tie
exhausts one player’s pile, the remaining player collects the centre. If both
piles run out on the same tie, the match is a draw. No cards are removed from play.
Matches can run long, especially when repeatedly choosing the same category.
There is no round limit or saved-match persistence; **Abandon match** returns
to the menu and a page reload starts fresh.

## Card artwork

Cards show the real subject's image when one has been fetched into
`public/cards/`; otherwise they fall back to a themed SVG (halo, corner
brackets, accent nameplate) generated in `game/decks.ts`. The `<img onerror>`
in `components/card.ts` is a final safety net.

`npm run fetch:cards` (Node ≥18, no dependencies) pulls lead images from
Wikipedia / Fandom MediaWiki APIs and merges the paths into
`src/data/card-art-manifest.json`. CI runs this automatically before deploying.

## Deployment (GitHub Pages)

This repo deploys from **`main` + `/docs`**:

1. **Settings → Pages → Source:** Deploy from a branch → **`main`** → **`/docs`**.
2. On each push to `main`, `.github/workflows/deploy-pages.yml` runs the tests,
   fetches card art, builds `docs/` (with base `/Toptrumps/`), and commits it.
3. The site goes live at **https://merogith.github.io/Toptrumps/**.

## Fair-use notice

Card subjects, names, and fetched thumbnails belong to their respective rights
holders and are used here only for a **non-commercial, educational fan project**.
Keep this repository non-commercial (no ads, paid distribution, or merchandise)
and do not redistribute `public/cards/` as a standalone image set. To run with
zero third-party imagery, empty `src/data/card-art-manifest.json` to `{}` and delete
`public/cards/` — every card then uses the generated SVG.

## License

[MIT](./LICENSE) for the original source code. See the fair-use notice above for
card content.
