import type { Card, DeckTheme } from "../types";
import artManifest from "./card-art-manifest.json";

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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient><pattern id="gr" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="${pc}" stroke-width="0.5"/></pattern></defs><rect width="320" height="200" fill="url(#bg)"/><rect width="320" height="200" fill="url(#gr)"/><circle cx="160" cy="85" r="52" fill="${accent}" opacity="0.12"/><text x="160" y="92" text-anchor="middle" dominant-baseline="middle" font-size="50" font-family="system-ui,sans-serif">${icon}</text><text x="160" y="150" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="${accent}">${esc(name)}</text><text x="160" y="169" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" fill="${pc}" letter-spacing="1">${esc(subtitle.toUpperCase())}</text></svg>`;
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

export const DECKS: DeckTheme[] = [
  buildStarWarsDeck(),
  buildFoundationDeck(),
  buildMedievalDeck(),
];

export function getDeckById(id: string): DeckTheme | undefined {
  return DECKS.find((d) => d.id === id);
}

export function cardImageUrl(_deckId: string, _cardId: string): string {
  return PLACEHOLDER_IMG;
}
