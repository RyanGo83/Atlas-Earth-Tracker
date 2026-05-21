// --- LEADERBOARD MERGE ---
// Combines two sources of player data at the State/Country/World scope:
//   1. REPORTED — manually entered into the legacy State/Country/Earth trackers
//                 (what the game's leaderboard at that scope directly showed).
//   2. IDENTIFIED — rolled up from town observations (sum of parcels per player
//                 across all towns in the scope; this is a lower bound).
//
// For each player, we show the HIGHER of the two, with a source badge.
// Rank is only displayed when it comes from a Reported entry (the game told us).
// Sort order: players with manual rank first (in rank order), then everyone
// else by parcel count descending.

import {
  rollupPlayersByState,
  rollupPlayersByCountry,
  rollupWorld,
  type AllTownsDataLite,
  type PlayerRollup
} from './rollup';

// --- TYPES ---

// Shape of one entry in the legacy State/Country/Earth trackers
export interface ReportedEntry {
  id?: number | string;
  name: string;
  parcels: number;
  rank?: number | null;
  date: string;
}

// Shape of the legacy tracker storage: { [locationName]: { entries: [...], lastUpdated } }
export interface ReportedLocationStore {
  entries: ReportedEntry[];
  lastUpdated?: string;
}

// Wrapper that handles the slightly different top-level keys (states / countries / regions)
export interface ReportedDataMap {
  [locationName: string]: ReportedLocationStore;
}

// What the UI will render for each player at a given scope
export interface MergedPlayerEntry {
  name: string;
  parcels: number;           // the value used for display + sort (higher of the two)
  source: 'reported' | 'identified';
  reportedParcels?: number;  // raw values kept for tooltip / debugging
  identifiedParcels?: number;
  rank?: number;             // only present when source === 'reported' AND user entered one
  lastSeen: string;          // most recent observation date (across both sources)
  townBreakdown?: Array<{    // present when identified data exists
    town: string;
    parcels: number;
    date: string;
  }>;
}

export type Scope = 'STATE' | 'COUNTRY' | 'WORLD';

// --- HELPERS ---

/**
 * For a single location's entries, return a map of player -> latest entry.
 * "Latest" = most recent date; ties broken by higher parcel count (parcels only go up).
 */
const latestPerPlayer = (entries: ReportedEntry[]): Record<string, ReportedEntry> => {
  const out: Record<string, ReportedEntry> = {};
  for (const e of entries || []) {
    const name = (e.name || '').trim();
    if (!name) continue;
    const existing = out[name];
    if (!existing) {
      out[name] = e;
      continue;
    }
    const eTime = new Date(e.date).getTime();
    const exTime = new Date(existing.date).getTime();
    if (eTime > exTime || (eTime === exTime && e.parcels > existing.parcels)) {
      out[name] = e;
    }
  }
  return out;
};

/**
 * Merge one player's reported + identified data into a single entry.
 */
const mergePlayer = (
  name: string,
  reported: ReportedEntry | null,
  identifiedRollup: PlayerRollup[string] | null
): MergedPlayerEntry | null => {
  if (!reported && !identifiedRollup) return null;

  // Reported-only
  if (!identifiedRollup) {
    return {
      name,
      parcels: reported!.parcels,
      source: 'reported',
      reportedParcels: reported!.parcels,
      rank: (typeof reported!.rank === 'number') ? reported!.rank : undefined,
      lastSeen: reported!.date
    };
  }

  // Identified-only
  if (!reported) {
    return {
      name,
      parcels: identifiedRollup.parcels,
      source: 'identified',
      identifiedParcels: identifiedRollup.parcels,
      lastSeen: identifiedRollup.lastSeen,
      townBreakdown: identifiedRollup.townBreakdown
    };
  }

  // Both exist — use the higher value as the "source of truth" for display
  const lastSeen =
    new Date(reported.date).getTime() > new Date(identifiedRollup.lastSeen).getTime()
      ? reported.date
      : identifiedRollup.lastSeen;

  if (identifiedRollup.parcels > reported.parcels) {
    // Identified is higher — means town rollup found more than the game-leaderboard snapshot
    // (probably because the snapshot is older than the town observations). Drop the
    // stale rank since it doesn't match the newer parcel count.
    return {
      name,
      parcels: identifiedRollup.parcels,
      source: 'identified',
      reportedParcels: reported.parcels,
      identifiedParcels: identifiedRollup.parcels,
      lastSeen,
      townBreakdown: identifiedRollup.townBreakdown
    };
  }

  // Reported is higher (or equal) — the game-level leaderboard saw more parcels than
  // we've identified across towns (means parcels in towns we don't track).
  return {
    name,
    parcels: reported.parcels,
    source: 'reported',
    reportedParcels: reported.parcels,
    identifiedParcels: identifiedRollup.parcels,
    rank: (typeof reported.rank === 'number') ? reported.rank : undefined,
    lastSeen,
    townBreakdown: identifiedRollup.townBreakdown
  };
};

/**
 * Sort the merged leaderboard:
 *   1. Players with a manual rank first, in rank order ascending
 *   2. Then players without a rank, sorted by parcels descending
 *   3. Ties on parcels broken by most recent observation
 */
const sortMerged = (entries: MergedPlayerEntry[]): MergedPlayerEntry[] => {
  return entries.sort((a, b) => {
    const aHas = typeof a.rank === 'number';
    const bHas = typeof b.rank === 'number';
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    if (aHas && bHas) return (a.rank! - b.rank!);
    if (b.parcels !== a.parcels) return b.parcels - a.parcels;
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });
};

// --- PUBLIC API ---

/**
 * Build the merged leaderboard for a given scope.
 *
 * @param townsData    The current Town tracker data (for rollup math)
 * @param reportedData The legacy State/Country/Earth tracker's entries map for this scope
 *                     (e.g., stateData.states for STATE scope). Pass null if no reported data.
 * @param scope        'STATE' | 'COUNTRY' | 'WORLD'
 * @param scopeValue   For STATE/COUNTRY: the location name (e.g., "Florida"). Omit for WORLD.
 */
export const getMergedLeaderboard = (
  townsData: AllTownsDataLite | null,
  reportedData: ReportedDataMap | null,
  scope: Scope,
  scopeValue?: string
): MergedPlayerEntry[] => {
  // --- Step 1: Get identified rollup for this scope ---
  let identified: PlayerRollup = {};
  if (townsData) {
    if (scope === 'WORLD') {
      identified = rollupWorld(townsData);
    } else if (scope === 'STATE' && scopeValue) {
      identified = rollupPlayersByState(townsData, scopeValue);
    } else if (scope === 'COUNTRY' && scopeValue) {
      identified = rollupPlayersByCountry(townsData, scopeValue);
    }
  }

  // --- Step 2: Get reported entries for this scope ---
  let reportedMap: Record<string, ReportedEntry> = {};
  if (reportedData) {
    // For WORLD scope, the user might have stored under various keys ("World", "Earth", "Global").
    // Try a few common ones; fall back to the first key if the store has only one location.
    let lookupKey = scopeValue;
    if (scope === 'WORLD') {
      const candidates = ['World', 'Earth', 'Global', 'world', 'earth'];
      lookupKey = candidates.find(k => reportedData[k]) ||
                  Object.keys(reportedData)[0];
    }
    if (lookupKey && reportedData[lookupKey]) {
      reportedMap = latestPerPlayer(reportedData[lookupKey].entries || []);
    }
  }

  // --- Step 3: Merge per-player ---
  const allPlayers = new Set<string>([
    ...Object.keys(identified),
    ...Object.keys(reportedMap)
  ]);

  const merged: MergedPlayerEntry[] = [];
  allPlayers.forEach(name => {
    const r = reportedMap[name] || null;
    const i = identified[name] || null;
    const entry = mergePlayer(name, r, i);
    if (entry) merged.push(entry);
  });

  // --- Step 4: Sort and return ---
  return sortMerged(merged);
};

// --- CONVENIENCE: scope discovery ---

/**
 * Return the list of all scope values (e.g., all states or all countries) that have
 * either reported data, identified data, or both. Useful for populating the scope picker.
 */
export const listScopeValues = (
  townsData: AllTownsDataLite | null,
  reportedData: ReportedDataMap | null,
  scope: Scope
): string[] => {
  const out = new Set<string>();
  if (scope === 'WORLD') {
    out.add('World'); // single value
    return Array.from(out);
  }

  // From reported data
  if (reportedData) {
    Object.keys(reportedData).forEach(k => out.add(k));
  }

  // From identified data (towns tagged with state/country)
  if (townsData) {
    Object.values(townsData.towns).forEach(t => {
      if (scope === 'STATE' && t.state) out.add(t.state);
      if (scope === 'COUNTRY' && t.country) out.add(t.country);
    });
  }

  return Array.from(out).sort();
};
