#!/usr/bin/env node
// Fetches a representative image for every card. Resolution order per card:
//
//   1. EXPLICIT — try each (source, title) candidate in the card's list.
//        Sources: wookieepedia, foundation, bulbapedia, spongebob, wikipedia.
//        Special source "url" → the "title" is a direct image URL; downloads
//        as-is (used for PokeAPI official artwork where MediaWiki returns
//        no usable thumbnail).
//   2. SEARCH   — for each source used by this card, run MediaWiki
//        generator=search with the card's first candidate as the query.
//        STRICT TITLE MATCH: only accept a result whose title contains every
//        ≥3-letter token of the query. This rejects "Pikachu (Pokémon)" →
//        "Pokémon Pikachu" (the toy) and similar fictional-name fuzz hits.
//   3. WIKIPEDIA — if Wikipedia wasn't already tried, search Wikipedia
//        (same strict-title-match rule).
//   4. COMMONS  — search Wikimedia Commons for any compatibly-licensed
//        bitmap matching the card name (same strict-title-match rule on the
//        File: title so we don't accept random photos containing one word).
//   5. DECK FALLBACK — a thematic image guaranteed to exist for the deck
//        (book cover for Foundation, hero ship for Star Wars, medieval
//        painting for Medieval, franchise logo for Pokémon/SpongeBob).
//        So every card lands on SOMETHING on-theme.
//
// LEGAL: fan-wiki imagery (Wookieepedia / Foundation Fandom / Bulbapedia /
// SpongeBob Wiki) is hosted under fair-use claims for editorial coverage;
// using it unchanged at low resolution inside a personal non-commercial
// Top Trumps deck is the same fair-use posture. PokeAPI official artwork is
// reused widely under fan-game fair-use as well. Wikipedia/Commons content
// is mostly public-domain or CC-licensed. Don't redistribute the populated
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
  wookieepedia: { host: "starwars.fandom.com",        base: "https://starwars.fandom.com" },
  foundation:   { host: "foundation.fandom.com",      base: "https://foundation.fandom.com" },
  bulbapedia:   { host: "bulbapedia.bulbagarden.net", base: "https://bulbapedia.bulbagarden.net" },
  spongebob:    { host: "spongebob.fandom.com",       base: "https://spongebob.fandom.com" },
  behzatc:      { host: "behzatc.fandom.com",         base: "https://behzatc.fandom.com" },
  trwiki:       { host: "tr.wikipedia.org",           base: "https://tr.wikipedia.org" },
  wikipedia:    { host: "en.wikipedia.org",           base: "https://en.wikipedia.org" },
};

const COMMONS_BASE = "https://commons.wikimedia.org";

const UA =
  "TopTrumpsLocal/1.0 (personal non-commercial Top Trumps fan game; see https://github.com/merogith/Toptrumps)";

// Thematic last-resort image per deck — guaranteed to exist on Wikipedia,
// so even an obscure card lands on something visually on-brand.
const DECK_FALLBACK = {
  sw:    ["wikipedia", "Star Wars"],                       // SW logo / hero art
  found: ["wikipedia", "Foundation (Asimov novel)"],       // first-book cover
  med:   ["wikipedia", "Medieval warfare"],                // period painting
  poke:  ["wikipedia", "Pokémon"],                         // franchise logo
  sb:    ["wikipedia", "SpongeBob SquarePants"],           // show logo
  bz:    ["trwiki",    "Behzat Ç. Bir Ankara Polisiyesi"], // show poster
};

// PokeAPI hosts official Game Freak artwork at a stable URL pattern keyed by
// National Dex number. Used because Bulbapedia returns no pageimage and
// Wikipedia search for "Pikachu (Pokémon)" hits the Pikachu virtual-pet toy
// article, JAL's Pokémon-themed jumbo jet article, etc. — not the character.
const POKEAPI_ART = (dex) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;

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

  // ---------- Pokémon Gen 1 — PokeAPI official artwork ----------
  // PokeAPI hosts the official Game Freak artwork at a stable URL keyed by
  // National Dex number. Tried first because Bulbapedia returns no
  // pageimage and Wikipedia search misfires (Pikachu → toy, Mewtwo → JAL
  // jumbo jet, Alakazam → cinema lobby).
  "poke-01": [["url", POKEAPI_ART(1)]],
  "poke-02": [["url", POKEAPI_ART(2)]],
  "poke-03": [["url", POKEAPI_ART(3)]],
  "poke-04": [["url", POKEAPI_ART(4)]],
  "poke-05": [["url", POKEAPI_ART(5)]],
  "poke-06": [["url", POKEAPI_ART(6)]],
  "poke-07": [["url", POKEAPI_ART(7)]],
  "poke-08": [["url", POKEAPI_ART(8)]],
  "poke-09": [["url", POKEAPI_ART(9)]],
  "poke-10": [["url", POKEAPI_ART(25)]],   // Pikachu
  "poke-11": [["url", POKEAPI_ART(26)]],   // Raichu
  "poke-12": [["url", POKEAPI_ART(150)]],  // Mewtwo
  "poke-13": [["url", POKEAPI_ART(151)]],  // Mew
  "poke-14": [["url", POKEAPI_ART(143)]],  // Snorlax
  "poke-15": [["url", POKEAPI_ART(130)]],  // Gyarados
  "poke-16": [["url", POKEAPI_ART(131)]],  // Lapras
  "poke-17": [["url", POKEAPI_ART(149)]],  // Dragonite
  "poke-18": [["url", POKEAPI_ART(133)]],  // Eevee
  "poke-19": [["url", POKEAPI_ART(134)]],  // Vaporeon
  "poke-20": [["url", POKEAPI_ART(135)]],  // Jolteon
  "poke-21": [["url", POKEAPI_ART(136)]],  // Flareon
  "poke-22": [["url", POKEAPI_ART(144)]],  // Articuno
  "poke-23": [["url", POKEAPI_ART(145)]],  // Zapdos
  "poke-24": [["url", POKEAPI_ART(146)]],  // Moltres
  "poke-25": [["url", POKEAPI_ART(65)]],   // Alakazam
  "poke-26": [["url", POKEAPI_ART(94)]],   // Gengar
  "poke-27": [["url", POKEAPI_ART(68)]],   // Machamp
  "poke-28": [["url", POKEAPI_ART(95)]],   // Onix
  "poke-29": [["url", POKEAPI_ART(132)]],  // Ditto
  "poke-30": [["url", POKEAPI_ART(59)]],   // Arcanine

  // ---------- SpongeBob — spongebob.fandom.com → Wikipedia ----------
  "sb-01": [["spongebob", "SpongeBob SquarePants (character)"], ["spongebob", "SpongeBob SquarePants"], ["wikipedia", "SpongeBob SquarePants (character)"]],
  "sb-02": [["spongebob", "Patrick Star"],            ["wikipedia", "Patrick Star"]],
  "sb-03": [["spongebob", "Squidward Tentacles"],     ["wikipedia", "Squidward Tentacles"]],
  "sb-04": [["spongebob", "Eugene H. Krabs"],         ["spongebob", "Mr. Krabs"], ["wikipedia", "Mr. Krabs"]],
  "sb-05": [["spongebob", "Sandy Cheeks"],            ["wikipedia", "Sandy Cheeks"]],
  "sb-06": [["spongebob", "Sheldon J. Plankton"],     ["spongebob", "Plankton"], ["wikipedia", "Sheldon J. Plankton"]],
  "sb-07": [["spongebob", "Gary the Snail"],          ["wikipedia", "Gary the Snail"]],
  "sb-08": [["spongebob", "Pearl Krabs"],             ["wikipedia", "Pearl Krabs"]],
  "sb-09": [["spongebob", "Mrs. Puff"],               ["wikipedia", "Mrs. Puff"]],
  "sb-10": [["spongebob", "Karen Plankton"],          ["spongebob", "Karen"], ["wikipedia", "Karen Plankton"]],
  "sb-11": [["spongebob", "Mermaid Man"],             ["wikipedia", "Mermaid Man and Barnacle Boy"]],
  "sb-12": [["spongebob", "Barnacle Boy"],            ["wikipedia", "Mermaid Man and Barnacle Boy"]],
  "sb-13": [["spongebob", "Squilliam Fancyson"]],
  "sb-14": [["spongebob", "Larry the Lobster"]],
  "sb-15": [["spongebob", "Bubble Bass"]],
  "sb-16": [["spongebob", "Patchy the Pirate"]],
  "sb-17": [["spongebob", "Flying Dutchman"], ["spongebob", "The Flying Dutchman"]],
  "sb-18": [["spongebob", "King Neptune"]],
  "sb-19": [["spongebob", "Princess Mindy"], ["spongebob", "Mindy"]],
  "sb-20": [["spongebob", "DoodleBob"]],
  "sb-21": [["spongebob", "Man Ray"]],
  "sb-22": [["spongebob", "The Dirty Bubble"], ["spongebob", "Dirty Bubble"]],
  "sb-23": [["spongebob", "Old Man Jenkins"]],
  "sb-24": [["spongebob", "Bubble Buddy"]],
  "sb-25": [["spongebob", "Hash-Slinging Slasher"], ["spongebob", "The Hash-Slinging Slasher"]],
  "sb-26": [["spongebob", "Painty the Pirate"]],
  "sb-27": [["spongebob", "Realistic Fish Head"]],
  "sb-28": [["spongebob", "Atomic Flounder"], ["spongebob", "The Atomic Flounder"]],
  "sb-29": [["spongebob", "Flats the Flounder"]],
  "sb-30": [["spongebob", "Tom (fish)"], ["spongebob", "Tom"]],

  // ---------- Behzat Ç. — behzatc.fandom.com → tr.wikipedia.org ----------
  // Era variants of the same character point to different per-season /
  // per-film articles so the squad lineup shows visual variety. The
  // strict-title-match guard from PR #7 keeps Wikipedia/Commons search
  // from grabbing unrelated photos for Turkish-name lookups.
  /* Behzat — 6 era variants */
  "bz-01": [["behzatc", "Behzat Çakırbey"],                       ["trwiki", "Behzat Ç. (karakter)"]],
  "bz-02": [["behzatc", "Behzat Ç. Bir Ankara Polisiyesi"],       ["trwiki", "Behzat Ç. Bir Ankara Polisiyesi"]],
  "bz-03": [["behzatc", "Behzat Ç. Seni Kalbime Gömdüm"],         ["trwiki", "Behzat Ç. Seni Kalbime Gömdüm"]],
  "bz-04": [["behzatc", "Behzat Ç. Ankara Yanıyor"],              ["trwiki", "Behzat Ç. Ankara Yanıyor"]],
  "bz-05": [["behzatc", "Behzat Ç. Bir Ankara Polisiyesi (4. sezon)"], ["trwiki", "Behzat Ç. Bir Ankara Polisiyesi (4. sezon)"]],
  "bz-06": [["behzatc", "Çekiç ve Gül: Bir Behzat Ç. Hikayesi"],  ["trwiki", "Çekiç ve Gül: Bir Behzat Ç. Hikayesi"]],
  /* Harun — 4 era variants */
  "bz-07": [["behzatc", "Harun Sinanoğlu"],                       ["trwiki", "Fatih Artman"]],
  "bz-08": [["behzatc", "Harun Sinanoğlu"],                       ["trwiki", "Fatih Artman"]],
  "bz-09": [["behzatc", "Harun Sinanoğlu"],                       ["trwiki", "Fatih Artman"]],
  "bz-10": [["behzatc", "Harun Sinanoğlu"],                       ["trwiki", "Fatih Artman"]],
  /* Hayalet — 3 era variants */
  "bz-11": [["behzatc", "Sabri Özay"],                            ["behzatc", "Hayalet"], ["trwiki", "İnanç Konukçu"]],
  "bz-12": [["behzatc", "Sabri Özay"],                            ["behzatc", "Hayalet"], ["trwiki", "İnanç Konukçu"]],
  "bz-13": [["behzatc", "Sabri Özay"],                            ["behzatc", "Hayalet"], ["trwiki", "İnanç Konukçu"]],
  /* Akbaba — 3 era variants */
  "bz-14": [["behzatc", "İsmet Arif Karasu"],                     ["behzatc", "Akbaba"], ["trwiki", "Berkan Şal"]],
  "bz-15": [["behzatc", "İsmet Arif Karasu"],                     ["behzatc", "Akbaba"], ["trwiki", "Berkan Şal"]],
  "bz-16": [["behzatc", "İsmet Arif Karasu"],                     ["behzatc", "Akbaba"], ["trwiki", "Berkan Şal"]],
  /* Eda — 2 era variants */
  "bz-17": [["behzatc", "Eda Akkaya"],                            ["trwiki", "Seda Bakan"]],
  "bz-18": [["behzatc", "Eda Akkaya"],                            ["trwiki", "Seda Bakan"]],
  /* Esra — 3 era variants */
  "bz-19": [["behzatc", "Esra Bulut"],                            ["trwiki", "Canan Ergüder"]],
  "bz-20": [["behzatc", "Esra Bulut"],                            ["trwiki", "Canan Ergüder"]],
  "bz-21": [["behzatc", "Esra Bulut"],                            ["trwiki", "Canan Ergüder"]],
  /* Supporting + villains */
  "bz-22": [["behzatc", "Şevket Çakırbey"],                       ["trwiki", "Ege Aydan"]],
  "bz-23": [["behzatc", "Cevdet"]],
  "bz-24": [["behzatc", "Selim"],                                  ["behzatc", "Çabuk Selim"]],
  "bz-25": [["behzatc", "Tahsin Yılmaz"],                         ["trwiki", "Eray Eserol"]],
  "bz-26": [["behzatc", "Ercüment Çözer"]],
  "bz-27": [["behzatc", "Memduh Başgan"]],
  "bz-28": [["behzatc", "Şule"]],
  "bz-29": [["behzatc", "Berna Çakırbey"]],
  "bz-30": [["behzatc", "Mürsel"],                                 ["behzatc", "Mürsel Ateş"], ["behzatc", "Ateş"]],
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

// Strict-title-match guard for search fallbacks. The query is the card's
// first explicit-candidate title, e.g. "Onum Barr" or "Pikachu (Pokémon)".
// We tokenise the query (strip parens, split on spaces / dashes / slashes,
// drop tokens ≤ 2 chars) and only accept a result whose title contains
// every remaining token (case-insensitive substring). Without this guard,
// MediaWiki search happily returns articles that share one token —
// "Onum Barr" → Rwandan township article, "Pikachu (Pokémon)" → the
// virtual-pet toy, "Lord Stettin" → Victorian noble photo from Stettin
// (the German city). With it, those mismatches fail strictly and the card
// drops to deck-fallback (book cover / franchise logo / etc.).
function tokenise(s) {
  return s
    .toLowerCase()
    .replace(/[()'"]/g, "")
    .split(/[\s/\-_,.:]+/)
    .filter((t) => t.length > 2);
}

function titleMatchesQuery(title, query) {
  const t = title.toLowerCase().replace(/[()'"]/g, "");
  const tokens = tokenise(query);
  if (!tokens.length) return false;
  return tokens.every((tok) => t.includes(tok));
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
// the first result that has a pageimage AND whose title matches the query
// strictly (every ≥3-letter query token appears in the title).
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
    if (!p.thumbnail?.source) continue;
    if (!titleMatchesQuery(p.title, query)) continue;
    return { title: p.title, url: p.thumbnail.source };
  }
  return null;
}

// 4: search Wikimedia Commons for any image (namespace 6 = File:). Strict
// title-match guard applied to the File: title so a photo whose filename
// happens to share one query word isn't accepted.
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
    // Strip "File:" prefix and the extension before matching tokens.
    const nameForMatch = (p.title || "").replace(/^File:/i, "").replace(/\.[a-z0-9]+$/i, "");
    if (!titleMatchesQuery(nameForMatch, query)) continue;
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
  if (id.startsWith("poke-")) return "poke";
  if (id.startsWith("sb-")) return "sb";
  if (id.startsWith("bz-")) return "bz";
  return null;
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Walk the full fallback chain for one card. Returns the first image
// that downloads, or null if literally nothing in the chain worked.
async function resolveCardImage(id, candidates, notes) {
  // Step 1: explicit candidates. "url" source means title is a direct image
  // URL (PokeAPI etc.); everything else is a MediaWiki article lookup.
  for (const [sourceKey, title] of candidates) {
    try {
      if (sourceKey === "url") {
        const dl = await downloadImage(title, id);
        return { via: "exact", sourceKey: "url", title, ...dl };
      }
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

  // Step 2+3+4: search MediaWiki sources, Wikipedia, then Commons —
  // but only if the card has at least one searchable (non-"url") candidate
  // to build a query from. Cards using direct PokeAPI URLs intentionally
  // skip text-search fallback (no useful query exists) and drop straight
  // to the deck-themed fallback if the URL fetch failed.
  const mwCandidate = candidates.find(([k]) => k !== "url");
  if (mwCandidate) {
    const tried = new Set();
    const searchSources = [];
    for (const [sourceKey] of candidates) {
      if (sourceKey === "url") continue;
      if (!tried.has(sourceKey)) { tried.add(sourceKey); searchSources.push(sourceKey); }
    }
    if (!tried.has("wikipedia")) searchSources.push("wikipedia");
    const query = mwCandidate[1];
    for (const sourceKey of searchSources) {
      try {
        const hit = await searchPageImage(sourceKey, query);
        if (hit) {
          const dl = await downloadImage(hit.url, id);
          return { via: "search", sourceKey, title: hit.title, ...dl };
        }
        notes.push(`search ${sourceKey} "${query}" no qualified result`);
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
      notes.push(`commons "${query}" no qualified result`);
    } catch (err) {
      notes.push(`commons "${query}" ${err.message}`);
    }
    await sleep(120);
  }

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
