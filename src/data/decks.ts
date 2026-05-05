import type { Card, DeckTheme } from "../types";

/** Resolves with Vite `base` (GitHub Pages subpath /Toptrumps/). */
const PLACEHOLDER_IMG = `${import.meta.env.BASE_URL}card-placeholder.svg`;

function galacticNames(): { name: string; subtitle: string }[] {
  return [
    { name: "Nebula Runner", subtitle: "Light freighter" },
    { name: "Void Talon", subtitle: "Strike fighter" },
    { name: "Solar Spear", subtitle: "Capital escort" },
    { name: "Dust Devil", subtitle: "Sand skiff" },
    { name: "Ion Mantis", subtitle: "Interceptor" },
    { name: "Crimson Comet", subtitle: "Racing yacht" },
    { name: "Echo Wing", subtitle: "Bomber group" },
    { name: "Ghost Line", subtitle: "Stealth corvette" },
    { name: "Storm Lancer", subtitle: "Assault dropship" },
    { name: "Polar Star", subtitle: "Medical frigate" },
    { name: "Razor Halo", subtitle: "Gunship" },
    { name: "Obsidian Crown", subtitle: "Dreadnought" },
    { name: "Silver Serpent", subtitle: "Blockade runner" },
    { name: "Twin Suns", subtitle: "Shuttle" },
    { name: "Ash Phoenix", subtitle: "Salvage rig" },
    { name: "Quantum Shade", subtitle: "Scout drone" },
    { name: "Iron Orbit", subtitle: "Mining hauler" },
    { name: "Sable Horizon", subtitle: "Patrol cutter" },
    { name: "Volt Viper", subtitle: "Speeder squad" },
    { name: "Mirage Core", subtitle: "Holo decoy ship" },
    { name: "Titan Wake", subtitle: "Troop carrier" },
    { name: "Frostbite", subtitle: "Ice planet crawler" },
    { name: "Ember Guard", subtitle: "Flame tank" },
    { name: "Atlas Drift", subtitle: "Explorer" },
    { name: "Cipher Nine", subtitle: "Spy vessel" },
    { name: "Helix Dawn", subtitle: "Research lab ship" },
    { name: "Onyx Shield", subtitle: "Shield projector" },
    { name: "Pulse Reaper", subtitle: "Ion cannon platform" },
    { name: "Zenith Blade", subtitle: "Honor guard cruiser" },
    { name: "Eclipse Veil", subtitle: "Carrier" },
  ];
}

function foundationNames(): { name: string; subtitle: string }[] {
  return [
    { name: "Terminus Prime", subtitle: "Encyclopedia hub" },
    { name: "Anacreon Forge", subtitle: "Industrial belt" },
    { name: "Siwenna Archive", subtitle: "Historian world" },
    { name: "Trantor Spire", subtitle: "Urban megastructure" },
    { name: "Kalgan Freeport", subtitle: "Privateer haven" },
    { name: "Radole Accord", subtitle: "Diplomatic node" },
    { name: "Smyrno Expanse", subtitle: "Merchant fleet" },
    { name: "Askone Enclave", subtitle: "Isolationists" },
    { name: "Wencory Relay", subtitle: "Signal station" },
    { name: "Rhodia Lattice", subtitle: "Logic core" },
    { name: "Lingebar Watch", subtitle: "Border sentinel" },
    { name: "Daribow Ring", subtitle: "Agri world" },
    { name: "Rossem Outpost", subtitle: "Quiet frontier" },
    { name: "Neotrantor Vault", subtitle: "Successor state" },
    { name: "Haven Fragment", subtitle: "Refuge fleet" },
    { name: "Bliss Asteroid", subtitle: "Hidden dock" },
    { name: "Streeling Institute", subtitle: "Psycho-history lab" },
    { name: "Mule's Chorus", subtitle: "Emotive relay" },
    { name: "Solaria Estate", subtitle: "Robot estate" },
    { name: "Comporellon Run", subtitle: "Cold trade route" },
    { name: "Sayshell Shell", subtitle: "Academic shell" },
    { name: "Gaia Sphere", subtitle: "Living world-mind" },
    { name: "Eos Relay", subtitle: "Second foundation" },
    { name: "Helicon Observatory", subtitle: "Magnetic research" },
    { name: "Aurora Nexus", subtitle: "Spacer union" },
    { name: "Melpomenian Depths", subtitle: "Ruin divers" },
    { name: "Issus Corridor", subtitle: "Hyperspace lane" },
    { name: "Vintara Codex", subtitle: "Lost library" },
    { name: "Korellian Yard", subtitle: "Warship foundry" },
    { name: "Gendibal Prism", subtitle: "Mentalic probe" },
  ];
}

function medievalNames(): { name: string; subtitle: string }[] {
  return [
    { name: "Varangian Guard", subtitle: "Byzantine elite" },
    { name: "Housecarl Shield", subtitle: "Anglo-Danish retinue" },
    { name: "Mamluk Lancers", subtitle: "Egyptian cavalry" },
    { name: "Janissary Corps", subtitle: "Ottoman infantry" },
    { name: "Teutonic Knight", subtitle: "Northern crusade" },
    { name: "Samurai Retainer", subtitle: "Feudal Japan" },
    { name: "Longbow Yeoman", subtitle: "English archer" },
    { name: "Swiss Pike Square", subtitle: "Alpine mercenaries" },
    { name: "Gallowglass", subtitle: "Irish heavy infantry" },
    { name: "Cataphract Line", subtitle: "Persian heavy horse" },
    { name: "Huscarl Axe Band", subtitle: "Viking shock" },
    { name: "Condotta Company", subtitle: "Italian mercenaries" },
    { name: "Templar Sergeant", subtitle: "Crusader order" },
    { name: "Mongol Horse Archer", subtitle: "Steppe riders" },
    { name: "Zulu Impi", subtitle: "Southern spear" },
    { name: "Aztec Jaguar", subtitle: "Mesoamerican order" },
    { name: "Rajput Cavalry", subtitle: "Indian nobility" },
    { name: "Ashigaru Spear", subtitle: "Sengoku levy" },
    { name: "Ghazi Raiders", subtitle: "Frontier horsemen" },
    { name: "Schiltron Ring", subtitle: "Scottish pike" },
    { name: "Hussite Wagon", subtitle: "Wagenburg tactics" },
    { name: "Spanish Tercio", subtitle: "Pike and shot" },
    { name: "Winged Hussar", subtitle: "Polish charge" },
    { name: "Bedouin Camel Corps", subtitle: "Desert mobility" },
    { name: "Frankish Paladin", subtitle: "Carolingian heavy" },
    { name: "Byzantine Kataphraktoi", subtitle: "Eastern lancers" },
    { name: "Saxon Fyrd", subtitle: "Shield wall" },
    { name: "Welsh Kern", subtitle: "Skirmishers" },
    { name: "Berber Camel Archers", subtitle: "Maghreb raiders" },
    { name: "Knights Hospitaller", subtitle: "Rhodes garrison" },
  ];
}

/** Deterministic pseudo-random in [min, max] for card stat variety. */
function statValue(seed: number, i: number, min: number, max: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233 + 19.19) * 43758.5453;
  const f = x - Math.floor(x);
  return Math.round(min + f * (max - min));
}

function buildGalacticDeck(): DeckTheme {
  const stats = [
    { id: "firepower", label: "Firepower", shortLabel: "FP", higherIsBetter: true },
    { id: "shields", label: "Shields", shortLabel: "SH", higherIsBetter: true },
    { id: "speed", label: "Hyperdrive rating", shortLabel: "HY", higherIsBetter: true },
    { id: "crew", label: "Crew capacity", shortLabel: "CR", higherIsBetter: true },
    { id: "hull", label: "Hull integrity", shortLabel: "HU", higherIsBetter: true },
    { id: "stealth", label: "Stealth index", shortLabel: "ST", higherIsBetter: true },
  ];
  const names = galacticNames();
  const cards: Card[] = names.map((n, idx) => ({
    id: `gal-${idx + 1}`,
    name: n.name,
    subtitle: n.subtitle,
    stats: {
      firepower: statValue(101 + idx, 1, 45, 99),
      shields: statValue(101 + idx, 2, 40, 98),
      speed: statValue(101 + idx, 3, 35, 97),
      crew: statValue(101 + idx, 4, 30, 95),
      hull: statValue(101 + idx, 5, 42, 99),
      stealth: statValue(101 + idx, 6, 25, 92),
    },
  }));
  return {
    id: "galactic",
    title: "Galactic legends",
    tagline: "Starships and skirmishers — Star Wars–style space opera deck",
    description:
      "Inspired by classic space-opera Top Trumps: compare firepower, shields, and more. Image placeholders only.",
    accent: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.15)",
    stats,
    cards,
  };
}

function buildFoundationDeck(): DeckTheme {
  const stats = [
    { id: "intellect", label: "Intellect", shortLabel: "IN", higherIsBetter: true },
    { id: "influence", label: "Political influence", shortLabel: "PI", higherIsBetter: true },
    { id: "tech", label: "Technology", shortLabel: "TE", higherIsBetter: true },
    { id: "stability", label: "Civil stability", shortLabel: "CS", higherIsBetter: true },
    { id: "trade", label: "Trade power", shortLabel: "TR", higherIsBetter: true },
    { id: "vision", label: "Long-term vision", shortLabel: "VI", higherIsBetter: true },
  ];
  const names = foundationNames();
  const cards: Card[] = names.map((n, idx) => ({
    id: `found-${idx + 1}`,
    name: n.name,
    subtitle: n.subtitle,
    stats: {
      intellect: statValue(202 + idx, 1, 48, 99),
      influence: statValue(202 + idx, 2, 40, 96),
      tech: statValue(202 + idx, 3, 38, 98),
      stability: statValue(202 + idx, 4, 35, 94),
      trade: statValue(202 + idx, 5, 42, 97),
      vision: statValue(202 + idx, 6, 45, 99),
    },
  }));
  return {
    id: "foundation",
    title: "Foundation & empire",
    tagline: "Asimov-inspired worlds — psychohistory, trade, and crisis",
    description:
      "A deck themed on empire, science, and long arcs. Fictional place names; placeholder artwork.",
    accent: "#c084fc",
    accentSoft: "rgba(192, 132, 252, 0.15)",
    stats,
    cards,
  };
}

function buildMedievalDeck(): DeckTheme {
  const stats = [
    { id: "attack", label: "Attack", shortLabel: "AT", higherIsBetter: true },
    { id: "defense", label: "Defense", shortLabel: "DE", higherIsBetter: true },
    { id: "morale", label: "Morale", shortLabel: "MO", higherIsBetter: true },
    { id: "mobility", label: "Mobility", shortLabel: "MB", higherIsBetter: true },
    { id: "armor", label: "Armor", shortLabel: "AR", higherIsBetter: true },
    { id: "prestige", label: "Prestige", shortLabel: "PR", higherIsBetter: true },
  ];
  const names = medievalNames();
  const cards: Card[] = names.map((n, idx) => ({
    id: `med-${idx + 1}`,
    name: n.name,
    subtitle: n.subtitle,
    stats: {
      attack: statValue(303 + idx, 1, 44, 99),
      defense: statValue(303 + idx, 2, 40, 98),
      morale: statValue(303 + idx, 3, 38, 97),
      mobility: statValue(303 + idx, 4, 32, 95),
      armor: statValue(303 + idx, 5, 36, 98),
      prestige: statValue(303 + idx, 6, 35, 96),
    },
  }));
  return {
    id: "medieval",
    title: "Warriors of the age",
    tagline: "Medieval and early-modern soldiers across cultures",
    description:
      "Classic Top Trumps feel: six combat and campaign stats. Replace placeholder art with open-licensed illustrations later.",
    accent: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, 0.15)",
    stats,
    cards,
  };
}

export const DECKS: DeckTheme[] = [buildGalacticDeck(), buildFoundationDeck(), buildMedievalDeck()];

export function getDeckById(id: string): DeckTheme | undefined {
  return DECKS.find((d) => d.id === id);
}

export function cardImageUrl(_deckId: string, _cardId: string): string {
  return PLACEHOLDER_IMG;
}
