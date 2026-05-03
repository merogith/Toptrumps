# Local Top Trumps (2 players)

Pass-and-play Top Trumps for two people on one device: **Galactic legends**, **Foundation & empire**, and **Warriors of the age** (30 cards each, six stats). Card images use `public/card-placeholder.svg` until you add artwork.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build to `dist/` (root URL, e.g. `localhost` or your own host)
- `npm run build:gh` — build for **GitHub Project Pages** when the site lives at `https://<user>.github.io/Toptrumps/` (sets Vite `--base /Toptrumps/`)
- `npm test` — game engine unit tests

## Troubleshooting

- **Blank page on GitHub Pages** — use `npm run build:gh` (not plain `npm run build`) so JS/CSS paths include `/Toptrumps/`. Publish the `dist/` output to your Pages branch or `gh-pages`.
- **Errors** — if something throws, the app shows a red error panel with the message and stack (and logs to the browser console).

## Rules

Gameplay follows common Top Trumps rules: deal the full deck, compare one chosen category each round (highest wins unless a stat is marked lower-is-better), winner takes the trick to the bottom of their pile, winner leads next round, ties add to a centre pile for the next winner.
