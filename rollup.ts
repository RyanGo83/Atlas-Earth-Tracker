// --- ROLLUP MATH ---
// Computes aggregations of town-level parcel data up to state, country, and world scopes.
// 
// Vocabulary:
//   "Identified" = parcels we can see from your town observations (a lower bound).
//                  This is never the full picture — a rival may have parcels in towns
//                  you haven't observed. Always treat these numbers as a minimum.
//
// Untagged towns (missing state or country) are skipped in scoped rollups but
// DO count in world totals — because a parcel in an unknown town is still a parcel
// on Earth.

// --- TYPES ---
// These mirror TownTracker's internal shapes but are redeclared here to keep
// rollup.ts dependency-free and easy to reuse from other components.

export interface TownEntryLite {
  id: number | string;
  name: string;
  parcels: number;
  date: string;
}

export interface TownDataLite {
  entries: TownEntryLite[];
  lastUpdated: string;
  state?: string;
  country?: string;
}

export interface AllTownsDataLite {
  towns: Record<string, TownDataLite>;
  currentTown: string | null;
}

// A rollup: map of player name -> { parcels, townCount, lastSeen }
export interface PlayerRollupEntry {
  parcels: number;         // Sum of latest parcel counts across towns in this scope
  townCount: number;       // How many towns in this scope contain this player
  lastSeen: string;        // Most recent observation date across those towns (YYYY-MM-DD)
  townBreakdown: Array<{   // Per-town contribution so we can show "where are they?"
    town: string;
    parcels: number;
    date: string;
  }>;
}

export type PlayerRollup = Record<string, PlayerRollupEntry>;

// --- INTERNAL HELPERS ---

/**
 * For a single town's entries, return a map of player -> latest entry.
 * "Latest" = most recent date; ties broken by higher parcel count (monotonic property).
 */
const getLatestEntryPerPlayer = (entries: TownEntryLite[]): Record<string, TownEntryLite> => {
  const latest: Record<string, TownEntryLite> = {};
  for (const e of entries) {
    const cleanName = e.name.trim();
    if (!cleanName) continue;
    const existing = latest[cleanName];
    if (!existing) {
      latest[cleanName] = e;
      continue;
    }
    const eTime = new Date(e.date).getTime();
    const exTime = new Date(existing.date).getTime();
    if (eTime > exTime || (eTime === exTime && e.parcels > existing.parcels)) {
      latest[cleanName] = e;
    }
  }
  return latest;
};

/**
 * Given a player rollup and one town's contribution, merge the town's data in.
 */
const mergeTownIntoRollup = (
  rollup: PlayerRollup,
  townName: string,
  townEntries: TownEntryLite[]
): void => {
  const latestPerPlayer = getLatestEntryPerPlayer(townEntries);
  for (const [player, entry] of Object.entries(latestPerPlayer)) {
    if (!rollup[player]) {
      rollup[player] = {
        parcels: 0,
        townCount: 0,
        lastSeen: entry.date,
        townBreakdown: []
      };
    }
    const r = rollup[player];
    r.parcels += entry.parcels;
    r.townCount += 1;
    r.townBreakdown.push({
      town: townName,
      parcels: entry.parcels,
      date: entry.date
    });
    // Track the most recent observation date across all towns
    if (new Date(entry.date).getTime() > new Date(r.lastSeen).getTime()) {
      r.lastSeen = entry.date;
    }
  }
};

// --- PUBLIC API ---

/**
 * Roll up all towns in a given state into a per-player map.
 * Towns without `state` tag or with a different state are skipped.
 * Country is optional match — if provided, also requires matching country.
 */
export const rollupPlayersByState = (
  data: AllTownsDataLite,
  stateName: string,
  country?: string
): PlayerRollup => {
  const rollup: PlayerRollup = {};
  for (const [townName, town] of Object.entries(data.towns)) {
    if (!town.state) continue;
    if (town.state !== stateName) continue;
    if (country && town.country && town.country !== country) continue;
    mergeTownIntoRollup(rollup, townName, town.entries);
  }
  return rollup;
};

/**
 * Roll up all towns in a given country into a per-player map.
 * Towns without `country` tag are skipped.
 */
export const rollupPlayersByCountry = (
  data: AllTownsDataLite,
  countryName: string
): PlayerRollup => {
  const rollup: PlayerRollup = {};
  for (const [townName, town] of Object.entries(data.towns)) {
    if (!town.country) continue;
    if (town.country !== countryName) continue;
    mergeTownIntoRollup(rollup, townName, town.entries);
  }
  return rollup;
};

/**
 * Roll up every town into a single world-level per-player map.
 * Unlike state/country rollups, this INCLUDES untagged towns — a parcel on
 * Earth is a parcel on Earth regardless of whether we know which state it's in.
 */
export const rollupWorld = (data: AllTownsDataLite): PlayerRollup => {
  const rollup: PlayerRollup = {};
  for (const [townName, town] of Object.entries(data.towns)) {
    mergeTownIntoRollup(rollup, townName, town.entries);
  }
  return rollup;
};

// --- SCOPE HELPERS ---

export type Scope = 'TOWN' | 'STATE' | 'COUNTRY' | 'WORLD';

/**
 * Return an array of town names that match the given scope filter.
 * Examples:
 *   getTownsInScope(data, 'STATE', 'Florida') -> ['Tampa', 'Orlando', ...]
 *   getTownsInScope(data, 'COUNTRY', 'USA')   -> all US-tagged towns
 *   getTownsInScope(data, 'WORLD')            -> every town
 */
export const getTownsInScope = (
  data: AllTownsDataLite,
  scope: Scope,
  scopeValue?: string
): string[] => {
  if (scope === 'WORLD') return Object.keys(data.towns);
  if (scope === 'TOWN') return scopeValue ? [scopeValue] : [];
  
  const towns: string[] = [];
  for (const [townName, town] of Object.entries(data.towns)) {
    if (scope === 'STATE' && town.state === scopeValue) towns.push(townName);
    if (scope === 'COUNTRY' && town.country === scopeValue) towns.push(townName);
  }
  return towns;
};

/**
 * List every unique state found in the towns data (for scope pickers).
 */
export const listStates = (data: AllTownsDataLite): string[] => {
  const states = new Set<string>();
  Object.values(data.towns).forEach(t => {
    if (t.state) states.add(t.state);
  });
  return Array.from(states).sort();
};

/**
 * List every unique country found in the towns data (for scope pickers).
 */
export const listCountries = (data: AllTownsDataLite): string[] => {
  const countries = new Set<string>();
  Object.values(data.towns).forEach(t => {
    if (t.country) countries.add(t.country);
  });
  return Array.from(countries).sort();
};

/**
 * Convert a rollup into a sorted leaderboard array (highest parcels first).
 * Ties broken by most-recent `lastSeen`.
 */
export const sortRollupToLeaderboard = (rollup: PlayerRollup): Array<{ name: string } & PlayerRollupEntry> => {
  return Object.entries(rollup)
    .map(([name, entry]) => ({ name, ...entry }))
    .sort((a, b) => {
      if (b.parcels !== a.parcels) return b.parcels - a.parcels;
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });
};