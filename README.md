# Local Top Trumps (2 players)

Pass-and-play Top Trumps for two people on one device: **Galactic legends**, **Foundation & empire**, and **Warriors of the age** (30 cards each, six stats). Cards display a themed SVG out of the box; run `npm run fetch:cards` to pull real Wikipedia lead images for the cards that have a matching article (see [Card artwork](#card-artwork)).

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (usually **http://localhost:5173/**). If that port is busy, Vite uses **5174**, **5175**, etc.

If the screen stays blank, open the browser **Developer Tools → Console**. Startup errors also show a red message on the page when possible.

## GitHub Pages

This repo is set up for **Project Pages**: the site URL is:

**https://\<user\>.github.io/Toptrumps/**

Important:

1. **Settings → Pages → Build and deployment → Source:** choose **Deploy from a branch**, **Branch:** `main`, **Folder:** **`/docs`** (not `/ (root)` — the repo root `index.html` is the Vite dev entry and will not run as a static site).
2. On each push to `main`, the workflow in `.github/workflows/deploy-pages.yml` runs tests, runs **`npm run build:docs`** (production bundle with base **`/Toptrumps/`**), writes **`docs/.nojekyll`**, and commits the **`docs/`** folder so Pages serves the compiled app.
3. Wait for the green workflow run, then open **https://\<your-username\>.github.io/Toptrumps/**.

If you previously used the **`gh-pages`** branch or **GitHub Actions** as the Pages source, switch to **main** + **`/docs`** so the live site matches `main`. Do **not** use plain `npm run build` for GitHub Pages for this repo name — asset URLs would be wrong unless you change `--base` to match your actual repo name.

## Scripts

- `npm run dev` — dev server (`--host 0.0.0.0`). Default port **5173**; if busy, Vite uses **5174**, etc. — use the URL printed in the terminal.
- `npm run build` — production build to `dist/` for root hosting (e.g. local preview).
- `npm run build:gh` — production build to `dist/` with **`/Toptrumps/`** base for GitHub Project Pages (preview locally with `preview:gh`).
- `npm run build:docs` — same as **`build:gh`** but outputs to **`docs/`** for branch-based Pages (**main** + **`/docs`**).
- `npm test` — game engine and data tests
- `npm run test:e2e` — Playwright: plays a **full match** in Chromium against the dev server
- `npm run ci` — runs **unit tests + e2e game test + `build` + `build:gh`**

### Automated checks (game playable end-to-end)

```bash
npm install
npx playwright install chromium   # first time only
npm run ci                        # unit tests + browser game test + both builds
```

`npm run test:e2e` opens Chromium, starts the dev server, plays **Choose deck → first theme → full match until game over**.

### Verify before manual testing

```bash
npm install
npm run ci          # must pass
npm run dev         # open the Local URL from the terminal
```

To sanity-check the **GitHub Pages** bundle locally (optional):

```bash
npm run build:gh && npm run preview:gh
```

Then open **http://localhost:4173/Toptrumps/** — app and assets should load under the `/Toptrumps/` prefix.

## Troubleshooting

- **Blank page on GitHub** — In the repo: **Settings → Pages → Source: Deploy from a branch → main → `/docs`**. Wait for the workflow to finish; the site is **`https://<username>.github.io/Toptrumps/`**. Do not deploy the repo root as Pages unless you only serve the built **`docs/`** output.
- **Blank locally** — Run `npm install`, then `npm run dev`, open the exact URL from the terminal. Check **Console** (F12); errors may also appear as a red panel on the page.

## Card artwork

Out of the box every card renders a themed SVG generated inline in `src/data/decks.ts`. To replace those with real photos / paintings from the English Wikipedia:

```bash
npm run fetch:cards
```

The script (`scripts/fetch-card-art.mjs`, Node ≥18, no extra dependencies):

- Reads a `cardId → Wikipedia article title` map embedded at the top of the file. Edit it freely.
- Calls `https://en.wikipedia.org/api/rest_v1/page/summary/<title>` for each card and downloads the article's lead thumbnail.
- Writes the images to `public/cards/<cardId>.<ext>` and updates `src/data/card-art-manifest.json` with the relative paths it produced.
- Commit the resulting `public/cards/*` and `src/data/card-art-manifest.json` — Vite will copy them into `dist/` and `docs/` on the next build, so GitHub Pages serves them too.

Cards whose title is `null` or whose Wikipedia article has no lead image keep the themed SVG. The `<img onerror>` handler in `src/main.ts` also falls back to `public/card-placeholder.svg` if any individual file is missing at runtime, so a partially populated `public/cards/` directory is safe.

**Copyright note:** the Star Wars and *Foundation* decks reference copyrighted franchises. The mapping in `scripts/fetch-card-art.mjs` only points at English Wikipedia article images (typically fair-use thumbnails on Wikipedia, free media for medieval topics). If you redistribute the populated `public/cards/` folder, make sure each individual file's licence permits it — Wikimedia Commons images include licence metadata on their `File:` page. Most ship/character cards are left as `null` because their Wikipedia articles do not contain a free representative image; the themed SVG is shown instead.

## Rules

Gameplay follows common Top Trumps rules: deal the full deck, compare one chosen category each round (highest wins unless a stat is marked lower-is-better), winner takes the trick to the bottom of their pile, winner leads next round, ties add to a centre pile for the next winner.
