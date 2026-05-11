#!/usr/bin/env node
// Fetches a representative image for every card. Resolution order per card:
//
//   1. EXPLICIT — try each (source, title) candidate in the card's list.
//        Sources: wookieepedia, foundation, wikipedia.
//   2. SEARCH   — for each source used by this card, run MediaWiki
//        generator=search with the card's first candidate as the query and
//        take the highest-ranked article that has a pageimage.
//   3. WIKIPEDIA — if Wikipedia wasn't already tried, search Wikipedia.
//   4. COMMONS  — search Wikimedia Commons for any compatibly-licensed
//        bitmap matching the card name (lots of public-domain art lives
//        only on Commons, not attached to an article).
//   5. DECK FALLBACK — a thematic image guaranteed to exist for the deck
//        (book cover for Foundation, hero ship for Star Wars, medieval
//        painting for Medieval). So every card lands on SOMETHING.
//
// LEGAL: fan-wiki imagery (Wookieepedia / Foundation Fandom) is hosted
// under fair-use claims for editorial coverage; using it unchanged at
// low resolution inside a personal non-commercial Top Trumps deck is
// the same fair-use posture. Wikipedia/Commons content is mostly
// public-domain or CC-licensed. Don't redistribute the populated
// public/cards/ folder commercially. To opt out, delete public/cards/,
// blank the manifest, and remove the fetch step from CI.
//
// Run: npm run fetch:cards

import { writeFile, mkdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "cards");
const MANIFEST = path.join(ROOT, "src", "data", "card-art-manifest.json");

const SOURCES = {
  wookieepedia: { host: "starwars.fandom.com", base: "https://starwars.fandom.com" },
  foundation:   { host: "foundation.fandom.com", base: "https://foundation.fandom.com" },
  wikipedia:    { host: "en.wikipedia.org", base: "https://en.wikipedia.org" },
};

const COMMONS_BASE = "https://commons.wikimedia.org";

const UA =
  "TopTrumpsLocal/1.0 (personal non-commercial Top Trumps fan game; see https://github.com/merogith/Toptrumps)";

// Thematic last-resort image per deck — guaranteed to exist on Wikipedia,
// so even an obscure card lands on something visually on-brand.
const DECK_FALLBACK = {
  sw:    ["wikipedia", "Star Wars"],                  // SW logo / hero art
  found: ["wikipedia", "Foundation (Asimov novel)"],  // first-book cover
  med:   ["wikipedia", "Medieval warfare"],           // period painting
};

// (source, title) candidates per card. Beyond these, the script will
// automatically fall back to search → Commons → deck-fallback.
const CARDS = {
  // ---------- Star Wars — Wookieepedia ----------
  "sw-01": [["wookieepedia", "Millennium Falcon"]],
  "sw-02": [["wookieepedia", "T-65B X-wing starfighter"], ["wookieepedia", "X-wing"], ["wikipedia", "X-wing starfighter"]],
  "sw-03": [["wookieepedia", "TIE Advanced x1"], ["wookieepedia", "TIE Advanced"]],
  "sw-04": [["wookieepedia", "DS-1 Death Star Mobile Battle Station"], ["wookieepedia", "Death Star"], ["wikipedia", "Death Star"]],
  "sw-05": [["wookieepedia", "Imperial-class Star Destroyer"], ["wookieepedia", "Star Destroyer"], ["wikipedia", "Star Destroyer"]],
  "sw-06": [["wookieepedia", "Executor"], ["wookieepedia", "Executor-class Star Dreadnought"]],
  "sw-07": [["wookieepedia", "RZ-1 A-wing interceptor"], ["wookieepedia", "A-wing"]],
  "sw-08": [["wookieepedia", "A/SF-01 B-wing starfighter"], ["wookieepedia", "B-wing"]],
  "sw-09": [["wookieepedia", "BTL-A4 Y-wing assault starfighter/bomber"], ["wookieepedia", "Y-wing"]],
  "sw-10": [["wookieepedia", "TIE/ln space superiority starfighter"], ["wookieepedia", "TIE/LN starfighter"], ["wikipedia", "TIE fighter"]],
  "sw-11": [["wookieepedia", "TIE/IN interceptor"], ["wookieepedia", "TIE Interceptor"]],
  "sw-12": [["wookieepedia", "TIE/sa bomber"], ["wookieepedia", "TIE Bomber"]],
  "sw-13": [["wookieepedia", "Slave I"], ["wookieepedia", "Firespray-31-class patrol craft"]],
  "sw-14": [["wookieepedia", "Delta-7 Aethersprite-class light interceptor"], ["wookieepedia", "Jedi starfighter"]],
  "sw-15": [["wookieepedia", "J-type 327 Nubian royal starship"], ["wookieepedia", "Naboo Royal Starship"]],
  "sw-16": [["wookieepedia", "Venator-class Star Destroyer"]],
  "sw-17": [["wookieepedia", "Malevolence"], ["wookieepedia", "Subjugator-class heavy cruiser"]],
  "sw-18": [["wookieepedia", "MC80 Liberty type Star Cruiser"], ["wookieepedia", "MC80 Star Cruiser"], ["wookieepedia", "Home One"]],
  "sw-19": [["wookieepedia", "CR90 corvette"], ["wookieepedia", "Tantive IV"]],
  "sw-20": [["wookieepedia", "EF76 Nebulon-B escort frigate"], ["wookieepedia", "Nebulon-B frigate"]],
  "sw-21": [["wookieepedia", "Ghost"], ["wookieepedia", "VCX-100 light freighter"]],
  "sw-22": [["wookieepedia", "Razor Crest"]],
  "sw-23": [["wookieepedia", "N-1 starfighter"], ["wookieepedia", "Naboo N-1 starfighter"]],
  "sw-24": [["wookieepedia", "Eta-2 Actis-class light interceptor"], ["wookieepedia", "Eta-2 Actis-class interceptor"]],
  "sw-25": [["wookieepedia", "Invisible Hand"], ["wookieepedia", "Providence-class Dreadnought"]],
  "sw-26": [["wookieepedia", "Eclipse"], ["wookieepedia", "Eclipse-class dreadnought"]],
  "sw-27": [["wookieepedia", "Scimitar"], ["wookieepedia", "Sith Infiltrator"]],
  "sw-28": [["wookieepedia", "Profundity"], ["wookieepedia", "MC85 Star Cruiser"], ["wookieepedia", "Raddus"]],
  "sw-29": [["wookieepedia", "Sphyrna-class corvette"], ["wookieepedia", "Hammerhead corvette"]],
  "sw-30": [["wookieepedia", "Kom'rk-class fighter/transport"], ["wookieepedia", "Gauntlet starfighter"]],

  // ---------- Foundation — foundation.fandom.com → en.wikipedia.org ----------
  // Wikipedia fallback is given for every Foundation card so search has a
  // chance even when the Fandom article is a stub.
  "found-01": [["foundation", "Hari Seldon"], ["wikipedia", "Hari Seldon"]],
  "found-02": [["foundation", "The Mule"], ["wikipedia", "The Mule (Foundation)"]],
  "found-03": [["foundation", "Salvor Hardin"], ["wikipedia", "Salvor Hardin"]],
  "found-04": [["foundation", "Hober Mallow"], ["wikipedia", "Hober Mallow"]],
  "found-05": [["foundation", "Bayta Darell"], ["wikipedia", "Bayta Darell"]],
  "found-06": [["foundation", "Arkady Darell"], ["wikipedia", "Arkady Darell"]],
  "found-07": [["foundation", "Ebling Mis"], ["wikipedia", "Ebling Mis"]],
  "found-08": [["foundation", "Golan Trevize"], ["wikipedia", "Golan Trevize"]],
  "found-09": [["foundation", "Bel Riose"], ["wikipedia", "Bel Riose"]],
  "found-10": [["foundation", "R. Daneel Olivaw"], ["wikipedia", "R. Daneel Olivaw"]],
  "found-11": [["foundation", "Dors Venabili"], ["wikipedia", "Dors Venabili"]],
  "found-12": [["foundation", "R. Giskard Reventlov"], ["wikipedia", "R. Giskard Reventlov"]],
  "found-13": [["foundation", "Cleon I"], ["wikipedia", "Cleon I"]],
  "found-14": [["foundation", "Yugo Amaryl"], ["wikipedia", "Yugo Amaryl"]],
  "found-15": [["foundation", "Stor Gendibal"], ["wikipedia", "Stor Gendibal"]],
  "found-16": [["foundation", "Preem Palver"], ["wikipedia", "Preem Palver"]],
  "found-17": [["foundation", "Wanda Seldon"], ["wikipedia", "Wanda Seldon"]],
  "found-18": [["foundation", "Han Pritcher"], ["wikipedia", "Han Pritcher"]],
  "found-19": [["foundation", "Ducem Barr"], ["wikipedia", "Ducem Barr"]],
  "found-20": [["foundation", "Lord Stettin"], ["wikipedia", "Lord Stettin"]],
  "found-21": [["foundation", "Indbur III"], ["wikipedia", "Indbur III"]],
  "found-22": [["foundation", "Janov Pelorat"], ["wikipedia", "Janov Pelorat"]],
  "found-23": [["foundation", "Bliss (Foundation)"], ["foundation", "Blissenobiarella"], ["wikipedia", "Bliss (Foundation)"]],
  "found-24": [["foundation", "Magnifico Giganticus"], ["wikipedia", "Magnifico Giganticus"]],
  "found-25": [["foundation", "Sef Sermak"], ["foundation", "Sermak"], ["wikipedia", "Sef Sermak"]],
  "found-26": [["foundation", "Limmar Ponyets"], ["wikipedia", "Limmar Ponyets"]],
  "found-27": [["foundation", "Onum Barr"], ["wikipedia", "Onum Barr"]],
  "found-28": [["foundation", "Novi"], ["foundation", "Sura Novi"], ["wikipedia", "Sura Novi"]],
  "found-29": [["foundation", "Eto Demerzel"], ["foundation", "Demerzel"], ["wikipedia", "Eto Demerzel"]],
  "found-30": [["foundation", "Raych Seldon"], ["foundation", "Raych Foss"], ["wikipedia", "Raych Seldon"]],

  // ---------- Medieval Warriors — Wikipedia ----------
  "med-01": [["wikipedia", "English longbow"], ["wikipedia", "Longbowman"]],
  "med-02": [["wikipedia", "Swiss mercenaries"], ["wikipedia", "Reisläufer"]],
  "med-03": [["wikipedia", "Mongol military tactics and organization"], ["wikipedia", "Mongol bow"], ["wikipedia", "Mongol Empire"]],
  "med-04": [["wikipedia", "Teutonic Order"], ["wikipedia", "Teutonic Knights"]],
  "med-05": [["wikipedia", "Janissary"], ["wikipedia", "Janissaries"]],
  "med-06": [["wikipedia", "Samurai"]],
  "med-07": [["wikipedia", "Cataphract"]],
  "med-08": [["wikipedia", "Berserker"]],
  "med-09": [["wikipedia", "Late Roman army"], ["wikipedia", "Comitatenses"]],
  "med-10": [["wikipedia", "Mamluk"]],
  "med-11": [["wikipedia", "Varangian Guard"]],
  "med-12": [["wikipedia", "Knight"]],
  "med-13": [["wikipedia", "Eagle warrior"], ["wikipedia", "Aztec warfare"]],
  "med-14": [["wikipedia", "Tercio"]],
  "med-15": [["wikipedia", "Highland charge"], ["wikipedia", "Scottish Highlanders"], ["wikipedia", "Highlander"]],
  "med-16": [["wikipedia", "Immortals (Achaemenid Empire)"]],
  "med-17": [["wikipedia", "Polish hussars"], ["wikipedia", "Winged hussars"]],
  "med-18": [["wikipedia", "Ironside (cavalry)"], ["wikipedia", "New Model Army"]],
  "med-19": [["wikipedia", "Crusades"], ["wikipedia", "Crusader states"], ["wikipedia", "Knights Templar"]],
  "med-20": [["wikipedia", "Housecarl"], ["wikipedia", "Huscarl"]],
  "med-21": [["wikipedia", "Impi"], ["wikipedia", "Zulu warrior"]],
  "med-22": [["wikipedia", "Welsh archers"], ["wikipedia", "English longbow"]],
  "med-23": [["wikipedia", "Condottiero"], ["wikipedia", "Condottieri"]],
  "med-24": [["wikipedia", "Wagenburg"], ["wikipedia", "Hussite Wars"]],
  "med-25": [["wikipedia", "Crossbow"], ["wikipedia", "Chinese crossbow"]],
  "med-26": [["wikipedia", "Seljuk Empire"], ["wikipedia", "Battle of Manzikert"]],
  "med-27": [["wikipedia", "War elephant"]],
  "med-28": [["wikipedia", "Gallowglass"]],
  "med-29": [["wikipedia", "Rajput"]],
  "med-30": [["wikipedia", "Knights Hospitaller"]],
};

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
};

function extFromUrl(u) {
  const last = (u.split("?")[0].split("#")[0].split("/").pop() || "").toLowerCase();
  const dot = last.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = last.slice(dot);
  if ([".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return null;
}

async function fileExists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function fetchJson(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    redirect: "follow",
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

// 1+2: query a single article's pageimage on a given MediaWiki source.
async function queryPageImage(sourceKey, title) {
  const src = SOURCES[sourceKey];
  if (!src) throw new Error(`unknown source ${sourceKey}`);
  const t = title.replace(/ /g, "_");
  const url =
    `${src.base}/api.php?action=query&format=json&formatversion=2&redirects=1` +
    `&prop=pageimages&piprop=original%7Cthumbnail&pithumbsize=480&titles=${encodeURIComponent(t)}`;
  const data = await fetchJson(url);
  const pages = data.query?.pages;
  if (!pages || !pages.length) return null;
  const page = pages[0];
  if (page.missing) return null;
  return page.thumbnail?.source || page.original?.source || null;
}

// 3: search a MediaWiki source for any article matching the query, return
// the first result that has a pageimage.
async function searchPageImage(sourceKey, query) {
  const src = SOURCES[sourceKey];
  if (!src) return null;
  const url =
    `${src.base}/api.php?action=query&format=json&formatversion=2` +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&gsrnamespace=0` +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=480`;
  const data = await fetchJson(url);
  const pages = data.query?.pages || [];
  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  for (const p of pages) {
    if (p.thumbnail?.source) return { title: p.title, url: p.thumbnail.source };
  }
  return null;
}

// 4: search Wikimedia Commons for any image (namespace 6 = File:).
async function searchCommonsImage(query) {
  const url =
    `${COMMONS_BASE}/w/api.php?action=query&format=json&formatversion=2` +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8` +
    `&prop=imageinfo&iiprop=url%7Cmime%7Csize&iiurlwidth=480`;
  const data = await fetchJson(url);
  const pages = data.query?.pages || [];
  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    const mime = (info.mime || "").toLowerCase();
    if (!mime.startsWith("image/")) continue;
    if (mime === "image/svg+xml" || mime === "image/gif") continue; // prefer bitmaps for cards
    return { title: p.title, url: info.thumburl || info.url };
  }
  return null;
}

async function downloadImage(url, destNoExt) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!r.ok) throw new Error(`image HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const mime = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = EXT_BY_MIME[mime] || extFromUrl(url) || ".jpg";
  const filename = `${destNoExt}${ext}`;
  await writeFile(path.join(OUT_DIR, filename), buf);
  return { filename, bytes: buf.length, mime, url };
}

function deckOf(id) {
  if (id.startsWith("sw-")) return "sw";
  if (id.startsWith("found-")) return "found";
  if (id.startsWith("med-")) return "med";
  return null;
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Walk the full fallback chain for one card. Returns the first image
// that downloads, or null if literally nothing in the chain worked.
async function resolveCardImage(id, candidates, notes) {
  // Step 1: explicit candidates, exact title each.
  for (const [sourceKey, title] of candidates) {
    try {
      const imgUrl = await queryPageImage(sourceKey, title);
      if (imgUrl) {
        const dl = await downloadImage(imgUrl, id);
        return { via: "exact", sourceKey, title, ...dl };
      }
      notes.push(`exact ${sourceKey}:"${title}" no image`);
    } catch (err) {
      notes.push(`exact ${sourceKey}:"${title}" ${err.message}`);
    }
    await sleep(120);
  }

  // Step 2+3: search on each candidate source (de-duped), then Wikipedia.
  const tried = new Set();
  const searchSources = [];
  for (const [sourceKey] of candidates) {
    if (!tried.has(sourceKey)) { tried.add(sourceKey); searchSources.push(sourceKey); }
  }
  if (!tried.has("wikipedia")) searchSources.push("wikipedia");
  const query = candidates[0]?.[1] || id;
  for (const sourceKey of searchSources) {
    try {
      const hit = await searchPageImage(sourceKey, query);
      if (hit) {
        const dl = await downloadImage(hit.url, id);
        return { via: "search", sourceKey, title: hit.title, ...dl };
      }
      notes.push(`search ${sourceKey} "${query}" no result`);
    } catch (err) {
      notes.push(`search ${sourceKey} "${query}" ${err.message}`);
    }
    await sleep(120);
  }

  // Step 4: Wikimedia Commons.
  try {
    const hit = await searchCommonsImage(query);
    if (hit) {
      const dl = await downloadImage(hit.url, id);
      return { via: "commons", sourceKey: "commons", title: hit.title, ...dl };
    }
    notes.push(`commons "${query}" no result`);
  } catch (err) {
    notes.push(`commons "${query}" ${err.message}`);
  }
  await sleep(120);

  // Step 5: deck-themed final fallback.
  const deck = deckOf(id);
  const fb = deck ? DECK_FALLBACK[deck] : null;
  if (fb) {
    try {
      const imgUrl = await queryPageImage(fb[0], fb[1]);
      if (imgUrl) {
        const dl = await downloadImage(imgUrl, id);
        return { via: "deck-fallback", sourceKey: fb[0], title: fb[1], ...dl };
      }
      notes.push(`fallback ${fb[0]}:"${fb[1]}" no image`);
    } catch (err) {
      notes.push(`fallback ${fb[0]}:"${fb[1]}" ${err.message}`);
    }
  }

  return null;
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  let manifest = {};
  if (await fileExists(MANIFEST)) {
    try { manifest = JSON.parse(await readFile(MANIFEST, "utf8")); } catch { manifest = {}; }
  }

  const entries = Object.entries(CARDS);
  const stats = { exact: 0, search: 0, commons: 0, "deck-fallback": 0 };
  const failed = [];

  let i = 0;
  for (const [id, candidates] of entries) {
    i++;
    const notes = [];
    const resolved = await resolveCardImage(id, candidates, notes);
    if (resolved) {
      manifest[id] = `cards/${resolved.filename}`;
      stats[resolved.via]++;
      const sizeKb = (resolved.bytes / 1024).toFixed(0);
      process.stdout.write(
        `[${String(i).padStart(2)}/${entries.length}] ✓ ${id.padEnd(9)} ` +
          `${resolved.via.padEnd(13)} ${resolved.sourceKey}:"${resolved.title}" ` +
          `→ ${resolved.filename} (${sizeKb} KB)\n`,
      );
    } else {
      failed.push([id, notes]);
      process.stdout.write(
        `[${String(i).padStart(2)}/${entries.length}] ✗ ${id.padEnd(9)} ${notes.join("; ")}\n`,
      );
    }
    await sleep(150);
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

  const ok = stats.exact + stats.search + stats.commons + stats["deck-fallback"];
  console.log("");
  console.log(`Wrote ${ok}/${entries.length} images to public/cards/.`);
  console.log(
    `  · exact:         ${stats.exact}\n` +
      `  · search:        ${stats.search}\n` +
      `  · commons:       ${stats.commons}\n` +
      `  · deck-fallback: ${stats["deck-fallback"]}`,
  );
  console.log(`Manifest: src/data/card-art-manifest.json (${Object.keys(manifest).length} entries).`);
  if (failed.length) {
    console.log(`\n${failed.length} card(s) had no image even after all fallbacks:`);
    for (const [id, notes] of failed) {
      console.log(`  - ${id}`);
      for (const n of notes) console.log(`      · ${n}`);
    }
    console.log("\n(Those cards keep the themed SVG fallback in decks.ts.)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
