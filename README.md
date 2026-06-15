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

Cards render the real subject's image — Star Wars ships from Wookieepedia, Foundation characters from the Foundation Fandom wiki, medieval warriors from Wikipedia — when those have been populated into `public/cards/`. If a card file is missing, `src/data/decks.ts` falls back to a themed SVG (halo + corner brackets + accent nameplate) and the `<img onerror>` in `src/main.ts` is a second safety net.

### Populate the images

```bash
npm run fetch:cards
```

`scripts/fetch-card-art.mjs` (Node ≥18, no dependencies):

- Reads a `cardId → [(source, article-title), …]` map at the top of the file. Sources are:
  - `wookieepedia` → `starwars.fandom.com`
  - `foundation` → `foundation.fandom.com`
  - `wikipedia` → `en.wikipedia.org`
- Calls each source's MediaWiki `api.php` (`prop=pageimages`, `pithumbsize=480`, `redirects=1`) until one returns a thumbnail.
- Downloads to `public/cards/<cardId>.<ext>` and merges the relative path into `src/data/card-art-manifest.json` (existing entries are kept, so a partial run is safe).
- Cards that strike out on every candidate keep the themed SVG fallback.

CI does this automatically — see `.github/workflows/deploy-pages.yml`, which runs `npm run fetch:cards` before `npm run build:docs` on every push to `main` and commits both `docs/` and the freshly populated `public/cards/` back to the branch.

### Fair-use notice — please read

The Star Wars and _Foundation_ article thumbnails on the Fandom wikis are uploaded there for editorial commentary under fair-use claims (low-resolution stills used in articles _about_ the depicted subject). Using those same low-resolution thumbnails inside a personal, non-commercial Top Trumps deck is the same legal posture: educational / fan-game fair use. You should:

- Keep this repository non-commercial (no ads, no paid distribution, no merchandise).
- Not redistribute the populated `public/cards/` folder as a standalone image set.
- Treat the deployed GitHub Pages site as a personal hobby project (Disney/Lucasfilm own Star Wars; Apple TV+ and the Asimov estate own _Foundation_).

The medieval cards pull from English Wikipedia, where lead images are usually public-domain paintings, engravings, and woodcuts that can be reused freely.

If you'd rather not host any third-party imagery, delete `public/cards/`, set `src/data/card-art-manifest.json` to `{}`, and remove the `fetch:cards` step from `.github/workflows/deploy-pages.yml`. The app will fall back to the themed SVG illustrations for every card.

## Rules

Gameplay follows common Top Trumps rules: deal the full deck, compare one chosen category each round (highest wins unless a stat is marked lower-is-better), winner takes the trick to the bottom of their pile, winner leads next round, ties add to a centre pile for the next winner.
