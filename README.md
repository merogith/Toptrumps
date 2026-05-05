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

- `npm run dev` — dev server (`--host 0.0.0.0`, port **5173** by default)
- `npm run build` — production build for root hosting (`dist/`)
- `npm run build:gh` — production build for **`…/Toptrumps/`** on GitHub Pages
- `npm test` — game engine unit tests

## Rules

Gameplay follows common Top Trumps rules: deal the full deck, compare one chosen category each round (highest wins unless a stat is marked lower-is-better), winner takes the trick to the bottom of their pile, winner leads next round, ties add to a centre pile for the next winner.
