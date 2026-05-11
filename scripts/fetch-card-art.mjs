#!/usr/bin/env node
// Downloads a lead image for each card from the English Wikipedia REST summary
// API and writes it to public/cards/<id>.<ext>. Cards without a Wikipedia
// article (or whose article has no lead image) keep the themed SVG generated
// in src/data/decks.ts.
//
// Run: npm run fetch:cards

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "cards");
const MANIFEST = path.join(ROOT, "src", "data", "card-art-manifest.json");

// Wikipedia article titles per card. `null` means "no good Wikipedia source —
// keep the themed SVG". Use a string that matches the canonical en.wikipedia
// article title (spaces are fine; the script URL-encodes them). Edit freely.
const TITLES = {
  // ---------- Star Wars (sw-01 … sw-30) ----------
  "sw-01": "Millennium Falcon",
  "sw-02": "X-wing Starfighter",
  "sw-03": "TIE fighter",
  "sw-04": "Death Star",
  "sw-05": "Star Destroyer",
  "sw-06": null,
  "sw-07": "A-wing",
  "sw-08": "B-wing",
  "sw-09": "Y-wing",
  "sw-10": "TIE fighter",
  "sw-11": "TIE fighter",
  "sw-12": "TIE fighter",
  "sw-13": "Slave I",
  "sw-14": null,
  "sw-15": null,
  "sw-16": "Star Destroyer",
  "sw-17": null,
  "sw-18": null,
  "sw-19": null,
  "sw-20": null,
  "sw-21": null,
  "sw-22": null,
  "sw-23": null,
  "sw-24": null,
  "sw-25": null,
  "sw-26": null,
  "sw-27": null,
  "sw-28": null,
  "sw-29": null,
  "sw-30": null,

  // ---------- Foundation (found-01 … found-30) ----------
  "found-01": "Hari Seldon",
  "found-02": "The Mule (Foundation)",
  "found-03": "Salvor Hardin",
  "found-04": "Hober Mallow",
  "found-05": "Bayta Darell",
  "found-06": "Arkady Darell",
  "found-07": "Ebling Mis",
  "found-08": "Golan Trevize",
  "found-09": "Bel Riose",
  "found-10": "R. Daneel Olivaw",
  "found-11": "Dors Venabili",
  "found-12": "R. Giskard Reventlov",
  "found-13": "Cleon I",
  "found-14": "Yugo Amaryl",
  "found-15": "Stor Gendibal",
  "found-16": "Preem Palver",
  "found-17": "Wanda Seldon",
  "found-18": null,
  "found-19": null,
  "found-20": null,
  "found-21": "Indbur III",
  "found-22": "Janov Pelorat",
  "found-23": "Bliss (Foundation)",
  "found-24": "Magnifico Giganticus",
  "found-25": null,
  "found-26": null,
  "found-27": null,
  "found-28": null,
  "found-29": "Eto Demerzel",
  "found-30": "Raych Seldon",

  // ---------- Medieval Warriors (med-01 … med-30) ----------
  "med-01": "English longbow",
  "med-02": "Swiss mercenaries",
  "med-03": "Mongol military tactics and organization",
  "med-04": "Teutonic Order",
  "med-05": "Janissary",
  "med-06": "Samurai",
  "med-07": "Cataphract",
  "med-08": "Berserker",
  "med-09": "Late Roman army",
  "med-10": "Mamluk",
  "med-11": "Varangian Guard",
  "med-12": "Knight",
  "med-13": "Eagle warrior",
  "med-14": "Tercio",
  "med-15": "Highland charge",
  "med-16": "Immortals (Achaemenid Empire)",
  "med-17": "Polish hussars",
  "med-18": "Ironside (cavalry)",
  "med-19": "Crusades",
  "med-20": "Housecarl",
  "med-21": "Impi",
  "med-22": "Welsh archers",
  "med-23": "Condottiero",
  "med-24": "Wagenburg",
  "med-25": "Crossbow",
  "med-26": "Seljuk Empire",
  "med-27": "War elephant",
  "med-28": "Gallowglass",
  "med-29": "Rajput",
  "med-30": "Knights Hospitaller",
};

const UA =
  "TopTrumpsLocal/1.0 (https://github.com/merogith/toptrumps; non-commercial educational use; contact: see repository)";

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

async function fetchSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}?redirect=true`;
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    redirect: "follow",
  });
  if (!r.ok) throw new Error(`summary HTTP ${r.status}`);
  return r.json();
}

async function downloadImage(url, destNoExt) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!r.ok) throw new Error(`image HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const mime = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = EXT_BY_MIME[mime] || extFromUrl(url) || ".jpg";
  const filename = `${destNoExt}${ext}`;
  await writeFile(path.join(OUT_DIR, filename), buf);
  return { filename, bytes: buf.length };
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  const manifest = {};
  const skipped = [];
  const failed = [];

  const entries = Object.entries(TITLES);
  let i = 0;
  for (const [id, title] of entries) {
    i++;
    if (!title) {
      skipped.push([id, "no Wikipedia title configured"]);
      continue;
    }
    try {
      const data = await fetchSummary(title);
      const thumb = data.thumbnail?.source;
      if (!thumb) {
        skipped.push([id, `"${title}" — article has no lead image`]);
        continue;
      }
      const { filename, bytes } = await downloadImage(thumb, id);
      manifest[id] = `cards/${filename}`;
      const sizeKb = (bytes / 1024).toFixed(0);
      process.stdout.write(
        `[${i.toString().padStart(2)}/${entries.length}] ✓ ${id.padEnd(9)} ${title}  →  ${filename} (${sizeKb} KB)\n`,
      );
    } catch (err) {
      failed.push([id, title, err.message]);
      process.stdout.write(
        `[${i.toString().padStart(2)}/${entries.length}] ✗ ${id.padEnd(9)} ${title}  →  ${err.message}\n`,
      );
    }
    // Be polite to Wikimedia: ~5 req/s.
    await sleep(200);
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

  console.log("");
  console.log(`Wrote ${Object.keys(manifest).length} images to public/cards/.`);
  console.log(`Manifest: src/data/card-art-manifest.json (${Object.keys(manifest).length} entries).`);
  if (skipped.length) {
    console.log(`\n${skipped.length} card(s) skipped (no real image, kept SVG placeholder):`);
    for (const [id, why] of skipped) console.log(`  - ${id}: ${why}`);
  }
  if (failed.length) {
    console.log(`\n${failed.length} card(s) failed to fetch:`);
    for (const [id, title, why] of failed) console.log(`  - ${id} (${title}): ${why}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
