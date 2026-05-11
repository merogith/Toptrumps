#!/usr/bin/env node
// Fetches a representative image for every card from a small list of
// MediaWiki-style sources:
//   - "wookieepedia"  → starwars.fandom.com   (Star Wars ships)
//   - "foundation"    → foundation.fandom.com (Foundation books + Apple TV+)
//   - "wikipedia"     → en.wikipedia.org      (medieval warriors,
//                                              public-domain paintings)
//
// Each card lists one or more (source, article-title) pairs; the script
// tries them in order until one returns a thumbnail. Images land in
// public/cards/<cardId>.<ext> and the manifest in
// src/data/card-art-manifest.json is updated.
//
// LEGAL: the Star Wars and Foundation imagery on fan wikis is hosted by
// Fandom under fair-use claims for editorial coverage. Using those images
// inside a personal, non-commercial Top Trumps deck is the same legal
// posture — fan-game / educational fair use. Do not redistribute the
// populated public/cards/ folder commercially. The medieval cards pull
// from Wikipedia, where lead images are typically public-domain artworks
// (paintings, engravings, woodcuts) free of copyright.
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

const UA =
  "TopTrumpsLocal/1.0 (personal non-commercial Top Trumps fan game; see https://github.com/merogith/Toptrumps)";

// One or more (source, title) candidates per card. The script tries them
// in order; the first one that returns a thumbnail wins.
const CARDS = {
  // ---------- Star Wars — Wookieepedia ----------
  "sw-01": [["wookieepedia", "Millennium Falcon"]],
  "sw-02": [["wookieepedia", "T-65B X-wing starfighter"], ["wookieepedia", "X-wing"]],
  "sw-03": [["wookieepedia", "TIE Advanced x1"]],
  "sw-04": [["wookieepedia", "DS-1 Death Star Mobile Battle Station"], ["wookieepedia", "Death Star"]],
  "sw-05": [["wookieepedia", "Imperial-class Star Destroyer"], ["wookieepedia", "Star Destroyer"]],
  "sw-06": [["wookieepedia", "Executor"], ["wookieepedia", "Executor-class Star Dreadnought"]],
  "sw-07": [["wookieepedia", "RZ-1 A-wing interceptor"], ["wookieepedia", "A-wing"]],
  "sw-08": [["wookieepedia", "A/SF-01 B-wing starfighter"], ["wookieepedia", "B-wing"]],
  "sw-09": [["wookieepedia", "BTL-A4 Y-wing assault starfighter/bomber"], ["wookieepedia", "Y-wing"]],
  "sw-10": [["wookieepedia", "TIE/ln space superiority starfighter"], ["wookieepedia", "TIE/LN starfighter"]],
  "sw-11": [["wookieepedia", "TIE/IN interceptor"], ["wookieepedia", "TIE Interceptor"]],
  "sw-12": [["wookieepedia", "TIE/sa bomber"], ["wookieepedia", "TIE Bomber"]],
  "sw-13": [["wookieepedia", "Slave I"], ["wookieepedia", "Firespray-31-class patrol craft"]],
  "sw-14": [["wookieepedia", "Delta-7 Aethersprite-class light interceptor"]],
  "sw-15": [["wookieepedia", "J-type 327 Nubian royal starship"], ["wookieepedia", "Naboo Royal Starship"]],
  "sw-16": [["wookieepedia", "Venator-class Star Destroyer"]],
  "sw-17": [["wookieepedia", "Malevolence"], ["wookieepedia", "Subjugator-class heavy cruiser"]],
  "sw-18": [["wookieepedia", "MC80 Liberty type Star Cruiser"], ["wookieepedia", "MC80 Star Cruiser"]],
  "sw-19": [["wookieepedia", "CR90 corvette"]],
  "sw-20": [["wookieepedia", "EF76 Nebulon-B escort frigate"]],
  "sw-21": [["wookieepedia", "Ghost"], ["wookieepedia", "VCX-100 light freighter"]],
  "sw-22": [["wookieepedia", "Razor Crest"]],
  "sw-23": [["wookieepedia", "N-1 starfighter"], ["wookieepedia", "Naboo N-1 starfighter"]],
  "sw-24": [["wookieepedia", "Eta-2 Actis-class light interceptor"]],
  "sw-25": [["wookieepedia", "Invisible Hand"], ["wookieepedia", "Providence-class Dreadnought"]],
  "sw-26": [["wookieepedia", "Eclipse"], ["wookieepedia", "Eclipse-class dreadnought"]],
  "sw-27": [["wookieepedia", "Scimitar"], ["wookieepedia", "Sith Infiltrator"]],
  "sw-28": [["wookieepedia", "Profundity"], ["wookieepedia", "MC85 Star Cruiser"]],
  "sw-29": [["wookieepedia", "Sphyrna-class corvette"], ["wookieepedia", "Hammerhead corvette"]],
  "sw-30": [["wookieepedia", "Kom'rk-class fighter/transport"], ["wookieepedia", "Gauntlet starfighter"]],

  // ---------- Foundation — foundation.fandom.com → en.wikipedia.org ----------
  "found-01": [["foundation", "Hari Seldon"], ["wikipedia", "Hari Seldon"]],
  "found-02": [["foundation", "The Mule"], ["wikipedia", "The Mule (Foundation)"]],
  "found-03": [["foundation", "Salvor Hardin"], ["wikipedia", "Salvor Hardin"]],
  "found-04": [["foundation", "Hober Mallow"], ["wikipedia", "Hober Mallow"]],
  "found-05": [["foundation", "Bayta Darell"]],
  "found-06": [["foundation", "Arkady Darell"]],
  "found-07": [["foundation", "Ebling Mis"]],
  "found-08": [["foundation", "Golan Trevize"]],
  "found-09": [["foundation", "Bel Riose"]],
  "found-10": [["foundation", "R. Daneel Olivaw"], ["wikipedia", "R. Daneel Olivaw"]],
  "found-11": [["foundation", "Dors Venabili"]],
  "found-12": [["foundation", "R. Giskard Reventlov"], ["wikipedia", "R. Giskard Reventlov"]],
  "found-13": [["foundation", "Cleon I"], ["wikipedia", "Cleon I"]],
  "found-14": [["foundation", "Yugo Amaryl"]],
  "found-15": [["foundation", "Stor Gendibal"]],
  "found-16": [["foundation", "Preem Palver"]],
  "found-17": [["foundation", "Wanda Seldon"]],
  "found-18": [["foundation", "Han Pritcher"], ["foundation", "Han Pritchard"]],
  "found-19": [["foundation", "Ducem Barr"]],
  "found-20": [["foundation", "Lord Stettin"]],
  "found-21": [["foundation", "Indbur III"]],
  "found-22": [["foundation", "Janov Pelorat"]],
  "found-23": [["foundation", "Bliss"]],
  "found-24": [["foundation", "Magnifico Giganticus"]],
  "found-25": [["foundation", "Sef Sermak"], ["foundation", "Sermak"]],
  "found-26": [["foundation", "Limmar Ponyets"]],
  "found-27": [["foundation", "Onum Barr"]],
  "found-28": [["foundation", "Novi"], ["foundation", "Sura Novi"]],
  "found-29": [["foundation", "Eto Demerzel"], ["foundation", "Demerzel"], ["wikipedia", "Eto Demerzel"]],
  "found-30": [["foundation", "Raych Seldon"], ["foundation", "Raych Foss"]],

  // ---------- Medieval Warriors — Wikipedia (mostly PD paintings) ----------
  "med-01": [["wikipedia", "English longbow"]],
  "med-02": [["wikipedia", "Swiss mercenaries"]],
  "med-03": [["wikipedia", "Mongol military tactics and organization"], ["wikipedia", "Mongol bow"]],
  "med-04": [["wikipedia", "Teutonic Order"]],
  "med-05": [["wikipedia", "Janissary"]],
  "med-06": [["wikipedia", "Samurai"]],
  "med-07": [["wikipedia", "Cataphract"]],
  "med-08": [["wikipedia", "Berserker"]],
  "med-09": [["wikipedia", "Late Roman army"]],
  "med-10": [["wikipedia", "Mamluk"]],
  "med-11": [["wikipedia", "Varangian Guard"]],
  "med-12": [["wikipedia", "Knight"]],
  "med-13": [["wikipedia", "Eagle warrior"]],
  "med-14": [["wikipedia", "Tercio"]],
  "med-15": [["wikipedia", "Highland charge"], ["wikipedia", "Scottish Highlanders"]],
  "med-16": [["wikipedia", "Immortals (Achaemenid Empire)"]],
  "med-17": [["wikipedia", "Polish hussars"]],
  "med-18": [["wikipedia", "Ironside (cavalry)"]],
  "med-19": [["wikipedia", "Crusades"], ["wikipedia", "Crusader states"]],
  "med-20": [["wikipedia", "Housecarl"]],
  "med-21": [["wikipedia", "Impi"]],
  "med-22": [["wikipedia", "Welsh archers"], ["wikipedia", "English longbow"]],
  "med-23": [["wikipedia", "Condottiero"]],
  "med-24": [["wikipedia", "Wagenburg"]],
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

async function queryPageImage(sourceKey, title) {
  const src = SOURCES[sourceKey];
  if (!src) throw new Error(`unknown source ${sourceKey}`);
  const t = title.replace(/ /g, "_");
  const url =
    `${src.base}/api.php?action=query&format=json&formatversion=2&redirects=1` +
    `&prop=pageimages&piprop=original%7Cthumbnail&pithumbsize=480&titles=${encodeURIComponent(t)}`;
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    redirect: "follow",
  });
  if (!r.ok) throw new Error(`${sourceKey} HTTP ${r.status}`);
  const data = await r.json();
  const pages = data.query?.pages;
  if (!pages || !pages.length) return null;
  const page = pages[0];
  if (page.missing) return null;
  const thumb = page.thumbnail?.source;
  const orig = page.original?.source;
  return thumb || orig || null;
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

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  // Merge with existing manifest so partial runs don't lose entries.
  let manifest = {};
  if (await fileExists(MANIFEST)) {
    try { manifest = JSON.parse(await readFile(MANIFEST, "utf8")); } catch { manifest = {}; }
  }

  const entries = Object.entries(CARDS);
  let ok = 0;
  const failed = [];

  let i = 0;
  for (const [id, candidates] of entries) {
    i++;
    let resolved = null;
    let triedNotes = [];
    for (const [sourceKey, title] of candidates) {
      try {
        const imgUrl = await queryPageImage(sourceKey, title);
        if (!imgUrl) { triedNotes.push(`${sourceKey}:"${title}" no image`); continue; }
        const dl = await downloadImage(imgUrl, id);
        resolved = { sourceKey, title, ...dl };
        break;
      } catch (err) {
        triedNotes.push(`${sourceKey}:"${title}" ${err.message}`);
      }
      // Light spacing between API calls so we don't hammer the host.
      await sleep(120);
    }
    if (resolved) {
      manifest[id] = `cards/${resolved.filename}`;
      const sizeKb = (resolved.bytes / 1024).toFixed(0);
      process.stdout.write(
        `[${String(i).padStart(2)}/${entries.length}] ✓ ${id.padEnd(9)} ` +
          `${resolved.sourceKey}:"${resolved.title}" → ${resolved.filename} (${sizeKb} KB)\n`,
      );
      ok++;
    } else {
      failed.push([id, triedNotes]);
      process.stdout.write(
        `[${String(i).padStart(2)}/${entries.length}] ✗ ${id.padEnd(9)} ${triedNotes.join("; ")}\n`,
      );
    }
    await sleep(150);
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

  console.log("");
  console.log(`Wrote ${ok}/${entries.length} images to public/cards/.`);
  console.log(`Manifest: src/data/card-art-manifest.json (${Object.keys(manifest).length} entries).`);
  if (failed.length) {
    console.log(`\n${failed.length} card(s) had no image on any candidate source:`);
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
