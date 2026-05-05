# Local Top Trumps (2 players)

Pass-and-play Top Trumps for two people on one device: **Galactic legends**, **Foundation & empire**, and **Warriors of the age** (30 cards each, six stats). Card images use `public/card-placeholder.svg` until you add artwork.

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

1. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions** (not “Deploy from a branch” unless you manually upload `dist`).
2. Merge or push the workflow in `.github/workflows/deploy-pages.yml`. On each push to `main`, Actions builds with **`npm run build:gh`** (correct **`/Toptrumps/`** base path) and publishes **`dist/`**.
3. Wait for the green workflow run, then open **https://\<your-username\>.github.io/Toptrumps/**.

Do **not** use plain `npm run build` for GitHub Pages for this repo name — asset URLs would be wrong unless you change `--base` to match your actual repo name.

## Scripts

- `npm run dev` — dev server (`--host 0.0.0.0`). Default port **5173**; if busy, Vite uses **5174**, etc. — use the URL printed in the terminal.
- `npm run build` — production build to `dist/` for root hosting (e.g. local preview).
- `npm run build:gh` — production build with **`/Toptrumps/`** base for GitHub Project Pages (also used by CI).
- `npm test` — game engine and data tests
- `npm run ci` — runs **tests + `build` + `build:gh`** (same checks as local “ready to ship”)

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

- **Blank page on GitHub** — In the repo: **Settings → Pages → Source: GitHub Actions**. Wait for the workflow to finish; the site is **`https://<username>.github.io/Toptrumps/`**. Do not deploy a plain `npm run build` to Pages manually unless you change `--base` to match the repo path.
- **Blank locally** — Run `npm install`, then `npm run dev`, open the exact URL from the terminal. Check **Console** (F12); errors may also appear as a red panel on the page.

## Rules

Gameplay follows common Top Trumps rules: deal the full deck, compare one chosen category each round (highest wins unless a stat is marked lower-is-better), winner takes the trick to the bottom of their pile, winner leads next round, ties add to a centre pile for the next winner.
