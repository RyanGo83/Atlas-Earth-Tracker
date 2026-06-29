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
import { parseLocalDate } from './utils';

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
  rankConflict?: boolean;    // true when another player shares this exact recorded rank
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
    const eTime = parseLocalDate(e.date).getTime();
    const exTime = parseLocalDate(existing.date).getTime();
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
    parseLocalDate(reported.date).getTime() > parseLocalDate(identifiedRollup.lastSeen).getTime()
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
 * Sort the merged leaderboard in two phases:
 *
 *   1. Lay out every player WITHOUT a confirmed rank in parcel order (descending).
 *      This is our best guess at where they sit when we have no harder data.
 *   2. Walk through that lineup slot by slot (slot 1, 2, 3...). Any player who has
 *      a confirmed rank gets "moved" into the lineup once the slot counter reaches
 *      their rank number — bumping the parcel-guess players after that point down
 *      by one row each. If two players share the exact same recorded rank, they're
 *      placed together at that slot and flagged (`rankConflict`) so it's visible
 *      something needs a second look. If a confirmed rank is higher than we have
 *      slots for (we run out of parcel-guess players first), it just lands at the
 *      end, in rank order among any other such overflow entries.
 *
 * The display label for a confirmed-rank player is always their literal recorded
 * rank — never a computed row number. Parcel-guess players display their computed
 * row number (see `_pos` in LeaderboardsTracker.tsx), which naturally develops gaps
 * around inserted ranked players.
 */
export const sortMerged = (entries: MergedPlayerEntry[]): MergedPlayerEntry[] => {
  // Group ranked entries by rank value so duplicate/conflicting ranks stay together.
  const rankGroups = new Map<number, MergedPlayerEntry[]>();
  const unranked: MergedPlayerEntry[] = [];
  for (const e of entries) {
    if (typeof e.rank === 'number') {
      const group = rankGroups.get(e.rank) || [];
      group.push(e);
      rankGroups.set(e.rank, group);
    } else {
      unranked.push(e);
    }
  }

  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
  unranked.sort((a, b) => {
    if (b.parcels !== a.parcels) return b.parcels - a.parcels;
    return parseLocalDate(b.lastSeen).getTime() - parseLocalDate(a.lastSeen).getTime();
  });

  const result: MergedPlayerEntry[] = [];
  let rIdx = 0;
  let uIdx = 0;
  let slot = 1;

  while (rIdx < sortedRanks.length || uIdx < unranked.length) {
    const nextRank = rIdx < sortedRanks.length ? sortedRanks[rIdx] : null;
    // A confirmed rank is "due" once the slot counter reaches it — or immediately
    // if we've run out of parcel-guess players to keep filling slots with.
    const rankIsDue = nextRank !== null && (uIdx >= unranked.length || nextRank <= slot);

    if (rankIsDue) {
      const group = rankGroups.get(nextRank!)!;
      if (group.length > 1) group.forEach(e => { e.rankConflict = true; });
      result.push(...group);
      rIdx++;
    } else {
      result.push(unranked[uIdx]);
      uIdx++;
    }
    slot++;
  }

  return result;
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
/**
 * For World scope: build a per-player "reported" map by summing each player's
 * latest reported total across ALL countries they appear in.
 * Used as a fallback when the Earth tracker has no direct World leaderboard data.
 */
const buildWorldReportedFromCountries = (
  countryData: ReportedDataMap | null
): Record<string, ReportedEntry> => {
  const out: Record<string, ReportedEntry> = {};
  if (!countryData) return out;

  Object.values(countryData).forEach(countryStore => {
    const latest = latestPerPlayer(countryStore.entries || []);
    Object.entries(latest).forEach(([name, entry]) => {
      if (!out[name]) {
        // First country we've seen this player in
        out[name] = { name, parcels: entry.parcels, date: entry.date };
      } else {
        // Player appears in multiple countries — sum the parcels,
        // keep the most recent date, drop rank (a summed total has no single rank)
        out[name] = {
          name,
          parcels: out[name].parcels + entry.parcels,
          date: parseLocalDate(entry.date) > parseLocalDate(out[name].date) ? entry.date : out[name].date
        };
      }
    });
  });
  return out;
};

/**
 * Build the merged leaderboard for a given scope.
 *
 * @param townsData    The current Town tracker data (for rollup math)
 * @param reportedData The legacy State/Country/Earth tracker's entries map for this scope
 *                     (e.g., stateData.states for STATE scope). Pass null if no reported data.
 * @param scope        'STATE' | 'COUNTRY' | 'WORLD'
 * @param scopeValue   For STATE/COUNTRY: the location name (e.g., "Florida"). Omit for WORLD.
 * @param countryDataForWorld  WORLD scope only: the country tracker's data map, used as a
 *                     fallback reported source when the Earth tracker is empty.
 */
export const getMergedLeaderboard = (
  townsData: AllTownsDataLite | null,
  reportedData: ReportedDataMap | null,
  scope: Scope,
  scopeValue?: string,
  countryDataForWorld?: ReportedDataMap | null
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

  if (scope === 'WORLD') {
    // Priority 1: a real World leaderboard from the Earth tracker, if it has data
    if (reportedData) {
      const candidates = ['World', 'Earth', 'Global', 'world', 'earth'];
      const lookupKey = candidates.find(k => reportedData[k] && (reportedData[k].entries || []).length > 0)
                        || Object.keys(reportedData).find(k => (reportedData[k].entries || []).length > 0);
      if (lookupKey && reportedData[lookupKey]) {
        reportedMap = latestPerPlayer(reportedData[lookupKey].entries || []);
      }
    }
    // Priority 2: fall back to summed country totals (per-player across all countries)
    if (Object.keys(reportedMap).length === 0) {
      reportedMap = buildWorldReportedFromCountries(countryDataForWorld || null);
    }
  } else {
    // STATE / COUNTRY: direct lookup by scopeValue
    if (reportedData && scopeValue && reportedData[scopeValue]) {
      reportedMap = latestPerPlayer(reportedData[scopeValue].entries || []);
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
