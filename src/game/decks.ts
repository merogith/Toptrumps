import type { Card, DeckTheme } from "../types";
import artManifest from "../data/card-art-manifest.json";

const PLACEHOLDER_IMG = `${import.meta.env.BASE_URL}card-placeholder.svg`;

const ART: Record<string, string> = artManifest as Record<string, string>;

function artFor(id: string): string | undefined {
  const rel = ART[id];
  return rel ? `${import.meta.env.BASE_URL}${rel}` : undefined;
}

function makeSvg(
  icon: string,
  name: string,
  subtitle: string,
  accent: string,
  bg1: string,
  bg2: string,
  pc: string,
): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Wrap long names onto two centred lines so the placeholder doesn't clip.
  const NAME_BREAK = 22;
  let line1 = esc(name);
  let line2 = "";
  if (name.length > NAME_BREAK) {
    const cut = name.lastIndexOf(" ", NAME_BREAK);
    const at = cut > 8 ? cut : NAME_BREAK;
    line1 = esc(name.slice(0, at));
    line2 = esc(name.slice(at).trim());
  }
  const sub = esc(subtitle.length > 38 ? subtitle.slice(0, 35).trimEnd() + "…" : subtitle).toUpperCase();
  const iconSafe = esc(icon);
  const emojiFam = "system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
  const uiFam = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">` +
    `<defs>` +
      `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">` +
        `<stop offset="0%" stop-color="${bg1}"/>` +
        `<stop offset="100%" stop-color="${bg2}"/>` +
      `</linearGradient>` +
      `<radialGradient id="halo" cx="50%" cy="38%" r="55%">` +
        `<stop offset="0%" stop-color="${accent}" stop-opacity="0.32"/>` +
        `<stop offset="55%" stop-color="${accent}" stop-opacity="0.06"/>` +
        `<stop offset="100%" stop-color="${bg1}" stop-opacity="0"/>` +
      `</radialGradient>` +
      `<pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">` +
        `<circle cx="7" cy="7" r="0.7" fill="${pc}" opacity="0.55"/>` +
      `</pattern>` +
    `</defs>` +
    `<rect width="320" height="200" fill="url(#bg)"/>` +
    `<rect width="320" height="200" fill="url(#dots)"/>` +
    `<rect width="320" height="200" fill="url(#halo)"/>` +
    // Decorative corner brackets
    `<g stroke="${accent}" stroke-width="1.5" fill="none" opacity="0.55">` +
      `<path d="M 10 24 L 10 10 L 24 10"/>` +
      `<path d="M 310 24 L 310 10 L 296 10"/>` +
      `<path d="M 10 176 L 10 190 L 24 190"/>` +
      `<path d="M 310 176 L 310 190 L 296 190"/>` +
    `</g>` +
    // Icon halos
    `<circle cx="160" cy="78" r="60" fill="${accent}" opacity="0.10"/>` +
    `<circle cx="160" cy="78" r="44" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.50"/>` +
    // Big icon
    `<text x="160" y="92" text-anchor="middle" dominant-baseline="middle" font-size="58" font-family="${emojiFam}">${iconSafe}</text>` +
    // Accent underline
    `<rect x="40" y="146" width="240" height="1" fill="${accent}" opacity="0.55"/>` +
    // Name (1 or 2 lines)
    (line2
      ? `<text x="160" y="163" text-anchor="middle" font-family="${uiFam}" font-size="12.5" font-weight="800" fill="${accent}">${line1}</text>` +
        `<text x="160" y="178" text-anchor="middle" font-family="${uiFam}" font-size="12.5" font-weight="800" fill="${accent}">${line2}</text>` +
        `<text x="160" y="192" text-anchor="middle" font-family="${uiFam}" font-size="8" letter-spacing="1.2" fill="${pc}">${sub}</text>`
      : `<text x="160" y="167" text-anchor="middle" font-family="${uiFam}" font-size="14" font-weight="800" fill="${accent}">${line1}</text>` +
        `<text x="160" y="184" text-anchor="middle" font-family="${uiFam}" font-size="8.5" letter-spacing="1.2" fill="${pc}">${sub}</text>`) +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* ============================================================
   STAR WARS DECK — 30 iconic ships & vehicles
   Stats: firepower · shields · hyperdrive · crew · length · speed
   ============================================================ */

interface SwRaw {
  n: string; s: string; ic: string;
  fp: number; sh: number; hy: number; cr: number; ln: number; sp: number;
}

const SW_CARDS: SwRaw[] = [
  { n:"Millennium Falcon",       s:"Modified YT-1300f freighter",     ic:"🚀", fp:65, sh:68, hy:99, cr:30, ln:27, sp:88 },
  { n:"X-Wing Starfighter",      s:"T-65B multi-role fighter",        ic:"✈️", fp:58, sh:55, hy:82, cr: 6, ln:22, sp:82 },
  { n:"TIE Advanced x1",         s:"Darth Vader's personal fighter",  ic:"🔶", fp:72, sh:62, hy:85, cr: 3, ln:20, sp:95 },
  { n:"Death Star",              s:"DS-1 Orbital Battle Station",     ic:"⚫", fp:99, sh:88, hy:30, cr:99, ln:99, sp:18 },
  { n:"Imperial Star Destroyer", s:"ISD Mk.I warship",                ic:"🏔️", fp:88, sh:85, hy:55, cr:92, ln:88, sp:40 },
  { n:"Executor",                s:"Executor-class Super Star Destroyer", ic:"🌑", fp:99, sh:95, hy:45, cr:99, ln:99, sp:28 },
  { n:"A-Wing Interceptor",      s:"RZ-1 rebel starfighter",          ic:"⚡", fp:45, sh:38, hy:88, cr: 4, ln:10, sp:99 },
  { n:"B-Wing Heavy Assault",    s:"A/SF-01 bomber fighter",          ic:"🦅", fp:75, sh:65, hy:62, cr: 8, ln:17, sp:60 },
  { n:"Y-Wing Bomber",           s:"BTL-A4 attack starfighter",       ic:"💛", fp:62, sh:48, hy:65, cr:10, ln:16, sp:55 },
  { n:"TIE/ln Fighter",          s:"Twin Ion Engine starfighter",     ic:"🔸", fp:42, sh: 5, hy: 1, cr: 1, ln: 8, sp:80 },
  { n:"TIE/in Interceptor",      s:"Sienar elite interceptor",        ic:"💠", fp:50, sh: 5, hy: 1, cr: 1, ln: 9, sp:92 },
  { n:"TIE/sa Bomber",           s:"Sienar assault bomber",           ic:"💣", fp:68, sh:12, hy: 1, cr: 2, ln:10, sp:52 },
  { n:"Slave I",                 s:"Firespray-31 patrol craft",       ic:"🪲", fp:68, sh:60, hy:78, cr: 8, ln:24, sp:72 },
  { n:"Delta-7 Aethersprite",    s:"Jedi starfighter",                ic:"⚔️", fp:50, sh:42, hy:75, cr: 2, ln: 8, sp:88 },
  { n:"Naboo Royal Starship",    s:"J-type 327 diplomatic barge",     ic:"👑", fp:20, sh:50, hy:88, cr:20, ln:30, sp:78 },
  { n:"Venator Star Destroyer",  s:"Republic-class warship",          ic:"⚓", fp:82, sh:78, hy:60, cr:95, ln:85, sp:45 },
  { n:"Malevolence",             s:"Subjugator-class heavy cruiser",  ic:"☠️", fp:90, sh:72, hy:50, cr:95, ln:90, sp:32 },
  { n:"Mon Cal MC80 Cruiser",    s:"Liberty Star Cruiser",            ic:"🐟", fp:85, sh:88, hy:58, cr:90, ln:84, sp:40 },
  { n:"Corellian Corvette CR90", s:"Blockade runner",                 ic:"🕊️", fp:48, sh:52, hy:75, cr:35, ln:42, sp:62 },
  { n:"Nebulon-B Frigate",       s:"EF76 escort frigate",             ic:"🏥", fp:55, sh:58, hy:65, cr:50, ln:38, sp:52 },
  { n:"The Ghost",               s:"VCX-100 light freighter",         ic:"👻", fp:55, sh:58, hy:80, cr:15, ln:25, sp:72 },
  { n:"Razor Crest",             s:"ST-70 Assault Ship",              ic:"🌙", fp:48, sh:42, hy:65, cr: 6, ln:18, sp:68 },
  { n:"Naboo N-1 Starfighter",   s:"Royal Naboo starfighter",         ic:"⭐", fp:45, sh:40, hy:80, cr: 1, ln:12, sp:90 },
  { n:"Eta-2 Actis Interceptor", s:"Jedi interceptor",                ic:"🔯", fp:48, sh:35, hy:72, cr: 2, ln: 8, sp:90 },
  { n:"Invisible Hand",          s:"Providence-class carrier",        ic:"✊", fp:80, sh:72, hy:55, cr:88, ln:82, sp:38 },
  { n:"Eclipse",                 s:"Eclipse-class Super Star Destroyer", ic:"🌚", fp:99, sh:98, hy:42, cr:99, ln:99, sp:22 },
  { n:"Sith Infiltrator",        s:"Scimitar — Maul's vessel",        ic:"🗡️", fp:58, sh:52, hy:82, cr: 4, ln:16, sp:82 },
  { n:"Profundity",              s:"MC85 Star Cruiser",               ic:"🌌", fp:88, sh:90, hy:55, cr:95, ln:90, sp:38 },
  { n:"Hammerhead Corvette",     s:"Sphyrna-class corvette",          ic:"🔨", fp:52, sh:55, hy:70, cr:40, ln:35, sp:58 },
  { n:"Gauntlet StarFighter",    s:"Mandalorian warship",             ic:"🛡️", fp:60, sh:55, hy:72, cr:12, ln:20, sp:78 },
];

function buildStarWarsDeck(): DeckTheme {
  const stats = [
    { id:"firepower",  label:"Firepower",       shortLabel:"FP", higherIsBetter:true },
    { id:"shields",    label:"Shields",          shortLabel:"SH", higherIsBetter:true },
    { id:"hyperdrive", label:"Hyperdrive class", shortLabel:"HY", higherIsBetter:true },
    { id:"crew",       label:"Crew size",        shortLabel:"CR", higherIsBetter:true },
    { id:"length",     label:"Length index",     shortLabel:"LN", higherIsBetter:true },
    { id:"speed",      label:"Speed (MGLT)",     shortLabel:"SP", higherIsBetter:true },
  ];
  const cards: Card[] = SW_CARDS.map((c, i) => {
    const id = `sw-${String(i + 1).padStart(2, "0")}`;
    return {
      id,
      name: c.n,
      subtitle: c.s,
      image: artFor(id) ?? makeSvg(c.ic, c.n, c.s, "#38bdf8", "#070d1a", "#0c1525", "#1a2a40"),
      stats: { firepower:c.fp, shields:c.sh, hyperdrive:c.hy, crew:c.cr, length:c.ln, speed:c.sp },
    };
  });
  return {
    id: "starwars",
    title: "Star Wars",
    tagline: "30 iconic ships — from TIE Fighters to the Executor",
    description: "Compare firepower, shields, hyperdrive speed and more across the galaxy far, far away.",
    accent: "#38bdf8",
    accentSoft: "rgba(56,189,248,0.15)",
    stats,
    cards,
  };
}

/* ============================================================
   FOUNDATION DECK — 30 characters from Asimov's universe
   Stats: intellect · influence · foresight · resilience · resources · legacy
   ============================================================ */

interface FnRaw {
  n: string; s: string; ic: string;
  in: number; pi: number; fs: number; re: number; rs: number; lg: number;
}

const FN_CARDS: FnRaw[] = [
  { n:"Hari Seldon",         s:"Creator of Psychohistory",              ic:"🧠", in:99, pi:72, fs:99, re:65, rs:55, lg:99 },
  { n:"The Mule",            s:"Mutant conqueror of the Foundation",    ic:"🎭", in:88, pi:98, fs:62, re:90, rs:92, lg:88 },
  { n:"Salvor Hardin",       s:"First Mayor of Terminus",               ic:"🏛️", in:82, pi:95, fs:88, re:88, rs:75, lg:90 },
  { n:"Hober Mallow",        s:"Master Trader, Merchant Prince",        ic:"💰", in:78, pi:85, fs:80, re:82, rs:88, lg:82 },
  { n:"Bayta Darell",        s:"Stopped the Mule at a crucial moment",  ic:"🌸", in:75, pi:60, fs:88, re:90, rs:45, lg:85 },
  { n:"Arkady Darell",       s:"Teenage spy, author, patriot",          ic:"📻", in:80, pi:55, fs:75, re:72, rs:50, lg:72 },
  { n:"Ebling Mis",          s:"Psychologist who almost found all",     ic:"🧪", in:92, pi:45, fs:65, re:55, rs:40, lg:65 },
  { n:"Golan Trevize",       s:"Exiled councilman, Galaxia's judge",    ic:"🔮", in:72, pi:68, fs:85, re:78, rs:52, lg:75 },
  { n:"Bel Riose",           s:"Imperial general, Last of the greats",  ic:"⚔️", in:70, pi:78, fs:55, re:88, rs:82, lg:62 },
  { n:"R. Daneel Olivaw",    s:"Humaniform robot, guardian of humanity",ic:"🤖", in:95, pi:65, fs:98, re:99, rs:60, lg:99 },
  { n:"Dors Venabili",       s:"Robot protector of Hari Seldon",        ic:"🛡️", in:88, pi:52, fs:75, re:95, rs:42, lg:68 },
  { n:"R. Giskard Reventlov",s:"First mentalic robot",                  ic:"⚙️", in:92, pi:48, fs:95, re:98, rs:38, lg:85 },
  { n:"Cleon I",             s:"Last great Emperor of the Empire",      ic:"👑", in:60, pi:95, fs:42, re:65, rs:99, lg:58 },
  { n:"Yugo Amaryl",         s:"Psychohistorian, Seldon's disciple",    ic:"📊", in:90, pi:40, fs:85, re:60, rs:38, lg:70 },
  { n:"Stor Gendibal",       s:"Second Foundation Speaker",             ic:"👁️", in:85, pi:65, fs:88, re:72, rs:60, lg:62 },
  { n:"Preem Palver",        s:"First Speaker, farmer disguise",        ic:"🌾", in:82, pi:80, fs:90, re:75, rs:65, lg:78 },
  { n:"Wanda Seldon",        s:"Mentalic granddaughter of Hari",        ic:"✨", in:85, pi:55, fs:92, re:70, rs:45, lg:80 },
  { n:"Han Pritchard",       s:"Foundation political operative",        ic:"🗳️", in:68, pi:78, fs:62, re:75, rs:70, lg:52 },
  { n:"Ducem Barr",          s:"Scholar of Siwenna",                    ic:"📜", in:78, pi:55, fs:72, re:68, rs:42, lg:55 },
  { n:"Lord Stettin",        s:"Military dictator of Kalgan",           ic:"🪖", in:55, pi:88, fs:35, re:72, rs:85, lg:42 },
  { n:"Indbur III",          s:"Bureaucratic Mayor before the Mule",    ic:"📋", in:52, pi:82, fs:30, re:55, rs:88, lg:38 },
  { n:"Janov Pelorat",       s:"Mythology professor, seeker of Earth",  ic:"🔭", in:75, pi:40, fs:60, re:65, rs:42, lg:58 },
  { n:"Bliss",               s:"Part of Gaia — the living world-mind",  ic:"🌐", in:82, pi:65, fs:80, re:90, rs:58, lg:65 },
  { n:"Magnifico Giganticus", s:"The Mule's court jester alter ego",    ic:"🎪", in:78, pi:42, fs:38, re:72, rs:30, lg:70 },
  { n:"Sermak",              s:"Hardin's political rival on Terminus",  ic:"📣", in:65, pi:72, fs:50, re:70, rs:60, lg:45 },
  { n:"Limmar Ponyets",      s:"Trader to the Askonian Republic",       ic:"💼", in:72, pi:70, fs:68, re:75, rs:68, lg:50 },
  { n:"Onum Barr",           s:"Siwennan patrician, father of Ducem",   ic:"🏡", in:65, pi:42, fs:58, re:60, rs:35, lg:42 },
  { n:"Quoriana Novi",       s:"Second Foundation plant",               ic:"🌿", in:70, pi:60, fs:75, re:72, rs:50, lg:60 },
  { n:"Demerzel",            s:"Cleon's First Minister — R. Daneel",    ic:"🔵", in:95, pi:88, fs:95, re:99, rs:75, lg:90 },
  { n:"Raych Seldon",        s:"Hari's foster son, Foundation agent",   ic:"🗡️", in:72, pi:65, fs:68, re:88, rs:48, lg:62 },
];

function buildFoundationDeck(): DeckTheme {
  const stats = [
    { id:"intellect",  label:"Intellect",          shortLabel:"IN", higherIsBetter:true },
    { id:"influence",  label:"Political influence", shortLabel:"PI", higherIsBetter:true },
    { id:"foresight",  label:"Foresight",           shortLabel:"FS", higherIsBetter:true },
    { id:"resilience", label:"Resilience",          shortLabel:"RE", higherIsBetter:true },
    { id:"resources",  label:"Resources",           shortLabel:"RS", higherIsBetter:true },
    { id:"legacy",     label:"Legacy",              shortLabel:"LG", higherIsBetter:true },
  ];
  const cards: Card[] = FN_CARDS.map((c, i) => {
    const id = `found-${String(i + 1).padStart(2, "0")}`;
    return {
      id,
      name: c.n,
      subtitle: c.s,
      image: artFor(id) ?? makeSvg(c.ic, c.n, c.s, "#c084fc", "#0d0a1a", "#130d22", "#1e1535"),
      stats: { intellect:c.in, influence:c.pi, foresight:c.fs, resilience:c.re, resources:c.rs, legacy:c.lg },
    };
  });
  return {
    id: "foundation",
    title: "Foundation",
    tagline: "30 characters from Asimov's galaxy-spanning saga",
    description: "Pit psychohistorians, emperors, robots and traders against each other across intellect, influence and legacy.",
    accent: "#c084fc",
    accentSoft: "rgba(192,132,252,0.15)",
    stats,
    cards,
  };
}

/* ============================================================
   MEDIEVAL WARRIORS DECK — 30 historical elite forces
   Stats: attack · defense · discipline · mobility · equipment · legacy
   ============================================================ */

interface MedRaw {
  n: string; s: string; ic: string;
  at: number; de: number; di: number; mb: number; eq: number; lg: number;
}

const MED_CARDS: MedRaw[] = [
  { n:"English Longbowman",   s:"Hundred Years' War, Agincourt 1415",  ic:"🏹", at:82, de:40, di:75, mb:55, eq:65, lg:88 },
  { n:"Swiss Pikeman",        s:"Alpine mercenaries, Burgundian Wars",  ic:"🔱", at:78, de:72, di:88, mb:50, eq:70, lg:80 },
  { n:"Mongol Horse Archer",  s:"Genghis Khan's steppe cavalry",        ic:"🐎", at:75, de:55, di:82, mb:99, eq:68, lg:95 },
  { n:"Teutonic Knight",      s:"Baltic Crusades, Northern Europe",     ic:"✝️", at:82, de:88, di:85, mb:45, eq:92, lg:75 },
  { n:"Ottoman Janissary",    s:"Elite slave soldiers with firearms",   ic:"⚔️", at:78, de:72, di:92, mb:65, eq:82, lg:85 },
  { n:"Japanese Samurai",     s:"Bushido code, Sengoku period",         ic:"⛩️", at:85, de:82, di:90, mb:62, eq:95, lg:90 },
  { n:"Byzantine Cataphract", s:"Armoured shock cavalry, East Rome",    ic:"🛡️", at:80, de:88, di:85, mb:70, eq:90, lg:72 },
  { n:"Viking Berserker",     s:"Frenzied Norse shock warriors",        ic:"🪓", at:95, de:52, di:58, mb:68, eq:72, lg:80 },
  { n:"Late Roman Legionary", s:"Backbone of the Roman war machine",    ic:"🦅", at:75, de:85, di:95, mb:60, eq:85, lg:90 },
  { n:"Mamluk Cavalry",       s:"Stopped the Mongols at Ain Jalut",     ic:"🌙", at:85, de:75, di:88, mb:82, eq:85, lg:78 },
  { n:"Varangian Guard",      s:"Viking elite of the Byzantine court",  ic:"🪚", at:88, de:82, di:85, mb:55, eq:88, lg:72 },
  { n:"Frankish Knight",      s:"Heavy cavalry of the Crusades",        ic:"⚜️", at:80, de:85, di:72, mb:58, eq:88, lg:75 },
  { n:"Aztec Eagle Warrior",  s:"Sacred order of Huitzilopochtli",      ic:"🦅", at:78, de:62, di:80, mb:72, eq:65, lg:72 },
  { n:"Spanish Tercio",       s:"Pike-and-shot, 16th century Spain",    ic:"💣", at:80, de:75, di:90, mb:55, eq:80, lg:85 },
  { n:"Scottish Highlander",  s:"Highland charge, claymore and fury",   ic:"🏔️", at:85, de:58, di:65, mb:72, eq:62, lg:70 },
  { n:"Persian Immortal",     s:"Xerxes's elite 10,000-strong corps",   ic:"👁️", at:75, de:80, di:92, mb:65, eq:82, lg:80 },
  { n:"Polish Winged Hussar", s:"Undefeated heavy cavalry charge",      ic:"🪶", at:90, de:72, di:85, mb:88, eq:92, lg:88 },
  { n:"Cromwell's Ironsides", s:"Parliamentary cavalry, English Civil War", ic:"⚔️", at:75, de:68, di:95, mb:78, eq:78, lg:72 },
  { n:"Crusader Knight",      s:"Full plate, holy lance, First Crusade", ic:"✝️", at:82, de:88, di:78, mb:55, eq:90, lg:80 },
  { n:"Norse Housecarl",      s:"Professional Danish axe-warriors",     ic:"🪖", at:85, de:80, di:78, mb:58, eq:82, lg:68 },
  { n:"Zulu Impi",            s:"Chest-and-horns, iron discipline",     ic:"🌿", at:80, de:60, di:88, mb:80, eq:55, lg:75 },
  { n:"Welsh Longbowman",     s:"Gwent bows, Edward I's campaigns",     ic:"🏹", at:78, de:38, di:70, mb:60, eq:62, lg:70 },
  { n:"Italian Condottiere",  s:"Mercenary captains of the communes",   ic:"💰", at:72, de:70, di:65, mb:68, eq:80, lg:60 },
  { n:"Hussite Wagenburg",    s:"Wagon fortress + crossbows + guns",    ic:"🚂", at:70, de:85, di:85, mb:35, eq:72, lg:68 },
  { n:"Song Crossbowman",     s:"Mass crossbow volleys, Song Dynasty",  ic:"🎯", at:75, de:55, di:85, mb:50, eq:78, lg:70 },
  { n:"Seljuk Horse Archer",  s:"Manzikert 1071, nomadic mastery",      ic:"🐴", at:72, de:52, di:78, mb:92, eq:65, lg:65 },
  { n:"War Elephant Corps",   s:"Terror weapon of ancient armies",      ic:"🐘", at:90, de:75, di:65, mb:45, eq:78, lg:80 },
  { n:"Gallowglass",          s:"Irish-Norse heavy infantry mercenaries", ic:"🗡️", at:82, de:75, di:72, mb:50, eq:80, lg:62 },
  { n:"Rajput Cavalry",       s:"Hindu warrior aristocracy of India",   ic:"🏇", at:80, de:72, di:78, mb:78, eq:82, lg:68 },
  { n:"Knights Hospitaller",  s:"Military monks, Rhodes & Malta",       ic:"🔴", at:82, de:90, di:90, mb:58, eq:92, lg:80 },
];

function buildMedievalDeck(): DeckTheme {
  const stats = [
    { id:"attack",     label:"Attack",     shortLabel:"AT", higherIsBetter:true },
    { id:"defense",    label:"Defense",    shortLabel:"DE", higherIsBetter:true },
    { id:"discipline", label:"Discipline", shortLabel:"DI", higherIsBetter:true },
    { id:"mobility",   label:"Mobility",   shortLabel:"MB", higherIsBetter:true },
    { id:"equipment",  label:"Equipment",  shortLabel:"EQ", higherIsBetter:true },
    { id:"legacy",     label:"Legacy",     shortLabel:"LG", higherIsBetter:true },
  ];
  const cards: Card[] = MED_CARDS.map((c, i) => {
    const id = `med-${String(i + 1).padStart(2, "0")}`;
    return {
      id,
      name: c.n,
      subtitle: c.s,
      image: artFor(id) ?? makeSvg(c.ic, c.n, c.s, "#f59e0b", "#1a1006", "#120c04", "#2a1e08"),
      stats: { attack:c.at, defense:c.de, discipline:c.di, mobility:c.mb, equipment:c.eq, legacy:c.lg },
    };
  });
  return {
    id: "medieval",
    title: "Warriors of the Ages",
    tagline: "30 elite forces across cultures and centuries",
    description: "Compare attack, discipline, mobility and equipment of history's deadliest warriors.",
    accent: "#f59e0b",
    accentSoft: "rgba(245,158,11,0.15)",
    stats,
    cards,
  };
}

/* ============================================================
   POKÉMON GEN 1 DECK — 30 iconic Pokémon
   Stats: HP · Attack · Defense · Sp. Atk · Sp. Def · Speed
   Base stats use modern (post-split) values, identical to Bulbapedia.
   ============================================================ */

interface PokeRaw {
  n: string; s: string; ic: string;
  hp: number; at: number; df: number; sa: number; sd: number; sp: number;
}

const POKE_CARDS: PokeRaw[] = [
  { n:"Bulbasaur",  s:"Seed Pokémon · Grass/Poison",       ic:"🌱", hp:45,  at:49,  df:49,  sa:65,  sd:65,  sp:45  },
  { n:"Ivysaur",    s:"Seed Pokémon · Grass/Poison",       ic:"🌿", hp:60,  at:62,  df:63,  sa:80,  sd:80,  sp:60  },
  { n:"Venusaur",   s:"Seed Pokémon · Grass/Poison",       ic:"🌺", hp:80,  at:82,  df:83,  sa:100, sd:100, sp:80  },
  { n:"Charmander", s:"Lizard Pokémon · Fire",             ic:"🦎", hp:39,  at:52,  df:43,  sa:60,  sd:50,  sp:65  },
  { n:"Charmeleon", s:"Flame Pokémon · Fire",              ic:"🔥", hp:58,  at:64,  df:58,  sa:80,  sd:65,  sp:80  },
  { n:"Charizard",  s:"Flame Pokémon · Fire/Flying",       ic:"🐉", hp:78,  at:84,  df:78,  sa:109, sd:85,  sp:100 },
  { n:"Squirtle",   s:"Tiny Turtle Pokémon · Water",       ic:"🐢", hp:44,  at:48,  df:65,  sa:50,  sd:64,  sp:43  },
  { n:"Wartortle",  s:"Turtle Pokémon · Water",            ic:"💧", hp:59,  at:63,  df:80,  sa:65,  sd:80,  sp:58  },
  { n:"Blastoise",  s:"Shellfish Pokémon · Water",         ic:"🌊", hp:79,  at:83,  df:100, sa:85,  sd:105, sp:78  },
  { n:"Pikachu",    s:"Mouse Pokémon · Electric",          ic:"⚡", hp:35,  at:55,  df:40,  sa:50,  sd:50,  sp:90  },
  { n:"Raichu",     s:"Mouse Pokémon · Electric",          ic:"🌩️", hp:60,  at:90,  df:55,  sa:90,  sd:80,  sp:110 },
  { n:"Mewtwo",     s:"Genetic Pokémon · Psychic",         ic:"🧬", hp:106, at:110, df:90,  sa:154, sd:90,  sp:130 },
  { n:"Mew",        s:"New Species Pokémon · Psychic",     ic:"✨", hp:100, at:100, df:100, sa:100, sd:100, sp:100 },
  { n:"Snorlax",    s:"Sleeping Pokémon · Normal",         ic:"😴", hp:160, at:110, df:65,  sa:65,  sd:110, sp:30  },
  { n:"Gyarados",   s:"Atrocious Pokémon · Water/Flying",  ic:"🐲", hp:95,  at:125, df:79,  sa:60,  sd:100, sp:81  },
  { n:"Lapras",     s:"Transport Pokémon · Water/Ice",     ic:"🦕", hp:130, at:85,  df:80,  sa:85,  sd:95,  sp:60  },
  { n:"Dragonite",  s:"Dragon Pokémon · Dragon/Flying",    ic:"🐉", hp:91,  at:134, df:95,  sa:100, sd:100, sp:80  },
  { n:"Eevee",      s:"Evolution Pokémon · Normal",        ic:"🐾", hp:55,  at:55,  df:50,  sa:45,  sd:65,  sp:55  },
  { n:"Vaporeon",   s:"Bubble Jet Pokémon · Water",        ic:"💦", hp:130, at:65,  df:60,  sa:110, sd:95,  sp:65  },
  { n:"Jolteon",    s:"Lightning Pokémon · Electric",      ic:"⚡", hp:65,  at:65,  df:60,  sa:110, sd:95,  sp:130 },
  { n:"Flareon",    s:"Flame Pokémon · Fire",              ic:"🔥", hp:65,  at:130, df:60,  sa:95,  sd:110, sp:65  },
  { n:"Articuno",   s:"Freeze Pokémon · Ice/Flying",       ic:"❄️", hp:90,  at:85,  df:100, sa:95,  sd:125, sp:85  },
  { n:"Zapdos",     s:"Electric Pokémon · Electric/Flying",ic:"⚡", hp:90,  at:90,  df:85,  sa:125, sd:90,  sp:100 },
  { n:"Moltres",    s:"Flame Pokémon · Fire/Flying",       ic:"🔥", hp:90,  at:100, df:90,  sa:125, sd:85,  sp:90  },
  { n:"Alakazam",   s:"Psi Pokémon · Psychic",             ic:"🥄", hp:55,  at:50,  df:45,  sa:135, sd:95,  sp:120 },
  { n:"Gengar",     s:"Shadow Pokémon · Ghost/Poison",     ic:"👻", hp:60,  at:65,  df:60,  sa:130, sd:75,  sp:110 },
  { n:"Machamp",    s:"Superpower Pokémon · Fighting",     ic:"💪", hp:90,  at:130, df:80,  sa:65,  sd:85,  sp:55  },
  { n:"Onix",       s:"Rock Snake Pokémon · Rock/Ground",  ic:"🪨", hp:35,  at:45,  df:160, sa:30,  sd:45,  sp:70  },
  { n:"Ditto",      s:"Transform Pokémon · Normal",        ic:"🟪", hp:48,  at:48,  df:48,  sa:48,  sd:48,  sp:48  },
  { n:"Arcanine",   s:"Legendary Pokémon · Fire",          ic:"🐕", hp:90,  at:110, df:80,  sa:100, sd:80,  sp:95  },
];

function buildPokemonDeck(): DeckTheme {
  const stats = [
    { id:"hp",      label:"HP",          shortLabel:"HP",  higherIsBetter:true },
    { id:"attack",  label:"Attack",      shortLabel:"ATK", higherIsBetter:true },
    { id:"defense", label:"Defense",     shortLabel:"DEF", higherIsBetter:true },
    { id:"spatk",   label:"Sp. Attack",  shortLabel:"SPA", higherIsBetter:true },
    { id:"spdef",   label:"Sp. Defense", shortLabel:"SPD", higherIsBetter:true },
    { id:"speed",   label:"Speed",       shortLabel:"SPE", higherIsBetter:true },
  ];
  const cards: Card[] = POKE_CARDS.map((c, i) => {
    const id = `poke-${String(i + 1).padStart(2, "0")}`;
    return {
      id,
      name: c.n,
      subtitle: c.s,
      image: artFor(id) ?? makeSvg(c.ic, c.n, c.s, "#facc15", "#1a1505", "#231c08", "#322710"),
      stats: { hp:c.hp, attack:c.at, defense:c.df, spatk:c.sa, spdef:c.sd, speed:c.sp },
    };
  });
  return {
    id: "pokemon",
    title: "Pokémon Gen 1",
    tagline: "30 iconic Kanto Pokémon — base stats from the Pokédex",
    description: "Compare HP, Attack, Defense, Sp. Atk, Sp. Def and Speed of the original 151.",
    accent: "#facc15",
    accentSoft: "rgba(250,204,21,0.15)",
    stats,
    cards,
  };
}

/* ============================================================
   SPONGEBOB DECK — 30 characters from Bikini Bottom and beyond
   Stats: wackiness · strength · smarts · karma · fame · spirit
   ============================================================ */

interface SbRaw {
  n: string; s: string; ic: string;
  wk: number; st: number; sm: number; ka: number; fm: number; sr: number;
}

const SB_CARDS: SbRaw[] = [
  { n:"SpongeBob SquarePants", s:"Fry cook, eternal optimist",            ic:"🧽", wk:95, st:35, sm:45, ka:92, fm:99, sr:99 },
  { n:"Patrick Star",          s:"Pink starfish, Bikini Bottom philosopher", ic:"⭐", wk:99, st:70, sm: 8, ka:85, fm:95, sr:90 },
  { n:"Squidward Tentacles",   s:"Reluctant cashier, clarinetist",         ic:"🦑", wk:30, st:30, sm:80, ka:35, fm:90, sr:60 },
  { n:"Eugene H. Krabs",       s:"Owner of the Krusty Krab, money lover", ic:"🦀", wk:60, st:60, sm:75, ka:35, fm:85, sr:80 },
  { n:"Sandy Cheeks",          s:"Texan squirrel scientist in a dome",     ic:"🐿️", wk:70, st:88, sm:95, ka:90, fm:78, sr:92 },
  { n:"Sheldon J. Plankton",   s:"Chum Bucket owner, evil mastermind",     ic:"🦠", wk:80, st: 5, sm:99, ka:15, fm:75, sr:88 },
  { n:"Gary the Snail",        s:"SpongeBob's pet, secretly very wise",    ic:"🐌", wk:40, st:25, sm:70, ka:88, fm:70, sr:75 },
  { n:"Pearl Krabs",           s:"Teenage whale daughter of Mr. Krabs",    ic:"🐋", wk:60, st:80, sm:50, ka:65, fm:60, sr:70 },
  { n:"Mrs. Puff",             s:"Long-suffering boating school teacher",  ic:"🐡", wk:40, st:30, sm:60, ka:75, fm:55, sr:65 },
  { n:"Karen Plankton",        s:"Plankton's computer wife",               ic:"💻", wk:30, st:25, sm:99, ka:60, fm:65, sr:70 },
  { n:"Mermaid Man",           s:"Retired superhero, lives in Shady Shoals", ic:"🦸", wk:70, st:60, sm:30, ka:90, fm:75, sr:85 },
  { n:"Barnacle Boy",          s:"Mermaid Man's loyal sidekick",           ic:"🧒", wk:55, st:40, sm:50, ka:75, fm:60, sr:75 },
  { n:"Squilliam Fancyson",    s:"Squidward's rich rival",                 ic:"🎩", wk:50, st:35, sm:70, ka:20, fm:60, sr:50 },
  { n:"Larry the Lobster",     s:"Goofy Goober beach lifeguard",           ic:"🦞", wk:35, st:95, sm:50, ka:70, fm:55, sr:80 },
  { n:"Bubble Bass",           s:"Sandwich-hiding internet villain",       ic:"🐟", wk:90, st:55, sm:60, ka:10, fm:50, sr:35 },
  { n:"Patchy the Pirate",     s:"President of the SpongeBob Fan Club",    ic:"🏴‍☠️", wk:85, st:40, sm:30, ka:75, fm:55, sr:90 },
  { n:"The Flying Dutchman",   s:"Ghostly pirate of the Seven Seas",       ic:"👻", wk:88, st:88, sm:70, ka:15, fm:75, sr:85 },
  { n:"King Neptune",          s:"Ruler of the seas, trident in hand",     ic:"🔱", wk:65, st:95, sm:70, ka:60, fm:88, sr:80 },
  { n:"Princess Mindy",        s:"Neptune's daughter, kind-hearted",       ic:"👸", wk:50, st:60, sm:75, ka:88, fm:50, sr:78 },
  { n:"DoodleBob",             s:"Sketched menace from the magic pencil",  ic:"✏️", wk:95, st:70, sm:30, ka:10, fm:55, sr:50 },
  { n:"Man Ray",               s:"Arch-enemy of Mermaid Man",              ic:"🦹", wk:60, st:85, sm:80, ka:20, fm:60, sr:70 },
  { n:"The Dirty Bubble",      s:"Filthy floating supervillain",           ic:"🫧", wk:70, st:60, sm:40, ka: 5, fm:50, sr:55 },
  { n:"Old Man Jenkins",       s:"Confused elder of Bikini Bottom",        ic:"👴", wk:80, st:25, sm:30, ka:70, fm:45, sr:60 },
  { n:"Bubble Buddy",          s:"Imaginary friend made of soap",          ic:"🫧", wk:80, st: 5, sm:40, ka:90, fm:40, sr:60 },
  { n:"Hash-Slinging Slasher", s:"Ghost story fry cook, legend of the Krab", ic:"🔪", wk:88, st:75, sm:35, ka: 5, fm:45, sr:65 },
  { n:"Painty the Pirate",     s:"Singer of the opening theme",            ic:"🎤", wk:70, st:30, sm:40, ka:85, fm:60, sr:95 },
  { n:"Realistic Fish Head",   s:"Bikini Bottom News anchor",              ic:"📺", wk:35, st:20, sm:60, ka:75, fm:70, sr:60 },
  { n:"Atomic Flounder",       s:"Mermaid Man villain, glowing fins",      ic:"☢️", wk:65, st:75, sm:50, ka:15, fm:40, sr:55 },
  { n:"Flats the Flounder",    s:"Boating school bully",                   ic:"🐟", wk:45, st:80, sm:25, ka:10, fm:35, sr:60 },
  { n:"Tom",                   s:"Long-suffering background fish",         ic:"🐠", wk:50, st:30, sm:30, ka:70, fm:30, sr:65 },
];

function buildSpongebobDeck(): DeckTheme {
  const stats = [
    { id:"wackiness", label:"Wackiness", shortLabel:"WK", higherIsBetter:true },
    { id:"strength",  label:"Strength",  shortLabel:"ST", higherIsBetter:true },
    { id:"smarts",    label:"Smarts",    shortLabel:"SM", higherIsBetter:true },
    { id:"karma",     label:"Karma",     shortLabel:"KA", higherIsBetter:true },
    { id:"fame",      label:"Fame",      shortLabel:"FM", higherIsBetter:true },
    { id:"spirit",    label:"Spirit",    shortLabel:"SR", higherIsBetter:true },
  ];
  const cards: Card[] = SB_CARDS.map((c, i) => {
    const id = `sb-${String(i + 1).padStart(2, "0")}`;
    return {
      id,
      name: c.n,
      subtitle: c.s,
      image: artFor(id) ?? makeSvg(c.ic, c.n, c.s, "#22d3ee", "#04141a", "#061b22", "#0a2731"),
      stats: { wackiness:c.wk, strength:c.st, smarts:c.sm, karma:c.ka, fame:c.fm, spirit:c.sr },
    };
  });
  return {
    id: "spongebob",
    title: "SpongeBob SquarePants",
    tagline: "30 characters from Bikini Bottom — wackiness, strength, smarts and heart",
    description: "Pit fry cooks, supervillains, pirates and snails against each other in the absorbant chaos of Bikini Bottom.",
    accent: "#22d3ee",
    accentSoft: "rgba(34,211,238,0.15)",
    stats,
    cards,
  };
}

/* ============================================================
   BEHZAT Ç. DECK — 30 characters across the show's eras
   Series timeline:
     S1 (2010-11), S2-3 (2011-13), Seni Kalbime Gömdüm film (2011),
     Ankara Yanıyor film (2013), S4 BluTV (2019), Çekiç ve Gül (2022-25).
   Stats: Cesaret · Sertlik · Sezgi · İçki · Karizma · Sadakat
   ============================================================ */

interface BzRaw {
  n: string; s: string; ic: string;
  cs: number; st: number; sz: number; ik: number; kr: number; sd: number;
}

const BZ_CARDS: BzRaw[] = [
  /* Behzat Çakırbey — 6 era variants */
  { n:"Yas Tutan Behzat",       s:"Berna sonrası öfke ve raki — Sezon 1",                  ic:"🥃", cs:92, st:95, sz:78, ik:99, kr:88, sd:88 },
  { n:"Komiser Behzat",         s:"Zirvedeki Cinayet Büro Amiri — Sezon 2-3",              ic:"🚓", cs:95, st:92, sz:92, ik:95, kr:95, sd:95 },
  { n:"Sinemaskop Behzat",      s:"Sinema versiyonu — Seni Kalbime Gömdüm",                ic:"🎬", cs:92, st:90, sz:88, ik:95, kr:92, sd:92 },
  { n:"Ankara Yanıyor Behzat",  s:"Tahsin'in çağrısıyla dönüş — 2013 film",                ic:"🔥", cs:94, st:92, sz:90, ik:90, kr:90, sd:90 },
  { n:"Sürgün Behzat",          s:"6 yıl köyde, Esra halüsinasyonu — Sezon 4",             ic:"🌾", cs:80, st:75, sz:92, ik:92, kr:78, sd:88 },
  { n:"Yaşlı Çakırbey",         s:"Daha bilge, daha karanlık — Çekiç ve Gül",              ic:"🌑", cs:78, st:70, sz:96, ik:88, kr:90, sd:95 },
  /* Harun Sinanoğlu — 4 era variants */
  { n:"Acemi Harun",            s:"\"Seviyorum merkez!\" — Sezon 1",                       ic:"📻", cs:65, st:50, sz:60, ik:75, kr:88, sd:90 },
  { n:"Aşık Harun",              s:"Eda ile aşk, ekibin kalbi — Sezon 2-3",                 ic:"💘", cs:82, st:65, sz:78, ik:85, kr:92, sd:95 },
  { n:"Ankara Yanıyor Harun",   s:"Behzat'sız direnen komiser — 2013 film",                ic:"🛡️", cs:85, st:70, sz:80, ik:80, kr:88, sd:95 },
  { n:"Olgun Harun",            s:"Evli, sakin, deneyimli — Sezon 4",                       ic:"💍", cs:80, st:68, sz:82, ik:75, kr:85, sd:96 },
  /* Hayalet — 3 era variants */
  { n:"Yeni Hayalet",           s:"Sessiz gözlemci dedektif — Sezon 1",                    ic:"👻", cs:72, st:78, sz:85, ik:75, kr:55, sd:85 },
  { n:"Hayalet Komiser",        s:"Kara mizah ustası, Akbaba'nın çiftliği — Sezon 2-3",   ic:"🌫️", cs:82, st:82, sz:95, ik:82, kr:65, sd:90 },
  { n:"Yaşlı Hayalet",          s:"Yıllar olgunlaştırdı — Çekiç ve Gül",                   ic:"🪦", cs:78, st:78, sz:96, ik:78, kr:70, sd:92 },
  /* Akbaba — 3 era variants */
  { n:"Akbaba (S1)",            s:"Yaşlı dedektif, ilk işaretler — Sezon 1",               ic:"🦅", cs:65, st:70, sz:85, ik:92, kr:65, sd:85 },
  { n:"Bilge Akbaba",           s:"Meyhane filozofu, sezginin atası — Sezon 2-3",         ic:"🍶", cs:72, st:78, sz:95, ik:95, kr:75, sd:92 },
  { n:"Son Tüfek Akbaba",       s:"Yıllar geçirmiş ekibin kayası — Sezon 4",               ic:"🗿", cs:70, st:75, sz:96, ik:92, kr:78, sd:95 },
  /* Eda Akkaya — 2 era variants */
  { n:"Memur Eda",              s:"Yeni gelen kadın polis — Sezon 1",                      ic:"🌷", cs:78, st:65, sz:72, ik:55, kr:80, sd:88 },
  { n:"Komiser Eda",            s:"Sert, zeki, ekibin tek kadını — Sezon 2-3",            ic:"🌹", cs:92, st:82, sz:85, ik:70, kr:88, sd:95 },
  /* Savcı Esra — 3 era variants */
  { n:"Savcı Esra",             s:"Soğuk mesafeli Cumhuriyet Savcısı — Sezon 1",          ic:"⚖️", cs:78, st:60, sz:88, ik:60, kr:82, sd:85 },
  { n:"Aşık Esra",              s:"Behzat ile aşk, savcılık gerilimi — Sezon 2-3",        ic:"💔", cs:88, st:65, sz:92, ik:75, kr:95, sd:90 },
  { n:"Hayalet Esra",           s:"Behzat'ın hallüsinasyonunda dönen sevgili — Sezon 4",  ic:"🌙", cs:70, st:50, sz:99, ik:30, kr:92, sd:95 },
  /* Family, squad supporting cast, antagonists */
  { n:"Şevket Çakırbey",        s:"Sigara dumanlı bilge baba — tüm seri",                  ic:"🚬", cs:60, st:50, sz:90, ik:82, kr:78, sd:96 },
  { n:"Memur Cevdet",           s:"Sessiz, güvenilir genç ekip üyesi — Sezon 1-3",        ic:"🗒️", cs:65, st:55, sz:65, ik:50, kr:60, sd:88 },
  { n:"Çabuk Selim",            s:"Junior polis — Sezon 1-3",                              ic:"🏃", cs:72, st:60, sz:68, ik:60, kr:65, sd:85 },
  { n:"Tahsin Yılmaz",          s:"Bürokratik kayıkçı, kritik yardımcı — tüm seri",       ic:"📞", cs:65, st:60, sz:75, ik:78, kr:70, sd:82 },
  { n:"Ercüment Çözer",         s:"Saygı takıntılı psikopat iş adamı — Sezon 2-3",        ic:"💼", cs:82, st:72, sz:92, ik:60, kr:96, sd:28 },
  { n:"Memduh Başgan",          s:"Küfürbaz derin devlet polis amiri — Sezon 2-3",        ic:"🕴️", cs:78, st:88, sz:80, ik:88, kr:70, sd:22 },
  { n:"Şule",                   s:"Behzat'ın biyolojik kızı, Berna'nın katili",            ic:"🎭", cs:88, st:72, sz:92, ik:72, kr:95, sd:22 },
  { n:"Berna Çakırbey",         s:"Behzat'ın öldürülen kızı — Sezon 1 motivasyonu",       ic:"🌸", cs:70, st:35, sz:65, ik:30, kr:82, sd:95 },
  { n:"Mürsel \"Ateş\"",         s:"Çekiç ve Gül'ün seri katili antagonisti",              ic:"🔥", cs:85, st:88, sz:90, ik:50, kr:78, sd:18 },
];

function buildBehzatDeck(): DeckTheme {
  const stats = [
    { id:"cesaret",  label:"Cesaret",  shortLabel:"CS", higherIsBetter:true },
    { id:"sertlik",  label:"Sertlik",  shortLabel:"ST", higherIsBetter:true },
    { id:"sezgi",    label:"Sezgi",    shortLabel:"SZ", higherIsBetter:true },
    { id:"icki",     label:"İçki",     shortLabel:"İÇ", higherIsBetter:true },
    { id:"karizma",  label:"Karizma",  shortLabel:"KZ", higherIsBetter:true },
    { id:"sadakat",  label:"Sadakat",  shortLabel:"SD", higherIsBetter:true },
  ];
  const cards: Card[] = BZ_CARDS.map((c, i) => {
    const id = `bz-${String(i + 1).padStart(2, "0")}`;
    return {
      id,
      name: c.n,
      subtitle: c.s,
      image: artFor(id) ?? makeSvg(c.ic, c.n, c.s, "#dc2626", "#1a0606", "#220808", "#3a0e0e"),
      stats: { cesaret:c.cs, sertlik:c.st, sezgi:c.sz, icki:c.ik, karizma:c.kr, sadakat:c.sd },
    };
  });
  return {
    id: "behzat",
    title: "Behzat Ç.",
    tagline: "30 karakter, beş dönem — Ankara'nın efsane Cinayet Büro Amirliği",
    description: "Behzat ve ekibinin yas, dostluk, raki ve sokak adaleti dönemlerini karşılaştırın.",
    accent: "#dc2626",
    accentSoft: "rgba(220,38,38,0.15)",
    stats,
    cards,
  };
}

export const DECKS: DeckTheme[] = [
  buildStarWarsDeck(),
  buildFoundationDeck(),
  buildMedievalDeck(),
  buildPokemonDeck(),
  buildSpongebobDeck(),
  buildBehzatDeck(),
];

export function getDeckById(id: string): DeckTheme | undefined {
  return DECKS.find((d) => d.id === id);
}

export function cardImageUrl(_deckId: string, _cardId: string): string {
  return PLACEHOLDER_IMG;
}
