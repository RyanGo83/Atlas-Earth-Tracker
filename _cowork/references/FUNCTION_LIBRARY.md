# Atlas Earth Tracker — Function Library

> A full inventory of every function in the codebase: what it does, and where it's used. Built June 27, 2026 as a learning/audit exercise — this is sometimes called a "function inventory" or "code catalog" in software work. Programmers do this when getting oriented in an unfamiliar codebase or auditing for dead code/duplication before a refactor. Not over-engineering — it's exactly what this is for.

---

## A. Shared Library Files

These four files contain the only *truly* shared, reusable functions in the app — no UI, just math and data logic. Everything else below is component-local (lives inside one screen, called by that screen's buttons/effects).

### `utils.ts`
| Function | What it does | Used in |
|---|---|---|
| `parseLocalDate(dateStr)` | Converts a `"YYYY-MM-DD"` string into a Date at **local** midnight instead of UTC midnight. Without this, date comparisons can be off by a day depending on your timezone. | Nearly everywhere dates are compared: `rollup.ts`, `earnings.ts`, `leaderboardMerge.ts`, `LeaderboardsTracker.tsx`, `RentTracker.tsx` |
| `getTimeRangeCutoff(range)` | Given `'WTD' \| 'MTD' \| 'YTD' \| 'ALL'`, returns the cutoff Date to filter from (or `null` for ALL). | `filterByTimeRange` (below); legacy trackers (Rival, Town, State, Country, Earth) |
| `filterByTimeRange(items, dateField, range)` | Filters a list of records down to ones within the given time range. | Rival, Town, State, Country, Earth trackers |

### `earnings.ts`
The math engine behind the Performance tab — turns your saved balance snapshots into "how much did I earn this week/month/etc."
| Function | What it does | Used in |
|---|---|---|
| `startOfDay/Week/Month/Year(d?)` | Returns the start instant of the given period. | Internal to `computeAllPeriods` |
| `daysAgo(n)` | Returns the Date `n` days before today. | Internal to `computeAllPeriods` |
| `tomorrowMidnight()` *(private)* | Returns midnight tomorrow — used as the "end" boundary so today's entries are included. | Internal to `computeAllPeriods` |
| `findSnapshotAtOrBefore` / `findSnapshotAtOrAfter` *(private)* | Find the closest balance snapshot before/after a given date. | Internal to `earningsForPeriod` |
| `earningsForPeriod(history, start, end, label)` | Computes earnings for an arbitrary date range from snapshot deltas, with a confidence flag (`exact`/`estimate`/`partial`) depending on how good the surrounding data is. | `computeAllPeriods`; `ROITracker.tsx` |
| `sinceLastSnapshot(history)` | Earnings between your two most recent entries — always "exact" since both points are real. | `ROITracker.tsx` ("Since Last" card) |
| `computeAllPeriods(history)` | Runs `earningsForPeriod` for every standard window (today, this week, this month, last 30 days, etc.) in one call. | `ROITracker.tsx` |
| `getBadgeMultiplier(count)` *(private)* | Badge-count → rent multiplier tier (1.00× up to 1.25×). | `projectionFromRentData` |
| `getAdBoostMultiplier(parcels)` *(private)* | Parcel count → ad-boost multiplier (more parcels = smaller per-parcel boost). | `projectionFromRentData` |
| `projectionFromRentData(data)` | Given your current parcels/badges/boost hours, projects daily/monthly/yearly rent income. | `ROITracker.tsx` (Performance tab projections) |
| `projectedForDays(projection, days)` | Scales a projection's daily rate to an arbitrary number of days, for side-by-side "projected vs actual" comparisons. | `ROITracker.tsx` |

> ⚠️ See **Redundancy Review** below — `getBadgeMultiplier`/`getAdBoostMultiplier` have a near-identical twin in `RentTracker.tsx`.

### `rollup.ts`
Sums town-level parcel data up to state/country/world totals per player — the basis for "Identified" leaderboard numbers.
| Function | What it does | Used in |
|---|---|---|
| `getLatestEntryPerPlayer(entries)` *(private)* | For one town, picks each player's most recent entry. | Internal to `mergeTownIntoRollup` |
| `mergeTownIntoRollup(rollup, townName, entries)` *(private)* | Adds one town's latest-per-player data into a running rollup total. | Internal to the three `rollupPlayersBy*` functions |
| `rollupPlayersByState(data, stateName, country?)` | Sums parcels per player across all towns tagged with a given state. | `leaderboardMerge.ts` (State scope) |
| `rollupPlayersByCountry(data, countryName)` | Same, for country-tagged towns. | `leaderboardMerge.ts` (Country scope) |
| `rollupWorld(data)` | Sums every town, including untagged ones (a parcel on Earth counts even if we don't know which state). | `leaderboardMerge.ts` (World scope) |
| `getTownsInScope(data, scope, scopeValue?)` | Returns the list of town names belonging to a given scope/value. | `LeaderboardsTracker.tsx` |
| `listStates(data)` / `listCountries(data)` | Lists every unique state/country found in town tags. | `LeaderboardsTracker.tsx` (scope picker) |
| `sortRollupToLeaderboard(rollup)` | Converts a rollup object into a sorted array (highest parcels first, ties by most recent). | `LeaderboardsTracker.tsx` |

### `leaderboardMerge.ts`
Combines "Reported" (manually entered) and "Identified" (rollup-computed) player data into the single leaderboard you see in the Leaderboards tab.
| Function | What it does | Used in |
|---|---|---|
| `latestPerPlayer(entries)` *(private)* | Same idea as rollup.ts's version, but for the Reported (legacy tracker) data shape. | Internal |
| `mergePlayer(name, reported, identified)` *(private)* | Combines one player's Reported and Identified numbers, picking the higher value and the right source badge. | Internal to `getMergedLeaderboard` |
| `sortMerged(entries)` *(private)* | Sorts: manual-rank players first (in rank order), then everyone else by parcels descending. | Internal to `getMergedLeaderboard` |
| `buildWorldReportedFromCountries(countryData)` *(private)* | Fallback for World scope: sums each player's reported total across all countries when there's no direct World leaderboard data. | Internal to `getMergedLeaderboard` |
| `getMergedLeaderboard(townsData, reportedData, scope, scopeValue?, countryDataForWorld?)` | The main entry point — builds the full merged, sorted leaderboard for a scope. | `LeaderboardsTracker.tsx` |
| `listScopeValues(townsData, reportedData, scope)` | Lists every state/country/etc. that has any data at all, for the scope dropdown. | `LeaderboardsTracker.tsx` |

---

## B. `App.tsx` — App Shell

Not a tracker — this is the outer shell: navigation, profile, and backup/restore.
| Function | What it does |
|---|---|
| `saveProfile()` | Writes username + home town to localStorage, closes the Profile panel. |
| `buildBackupObject()` | Reads every localStorage key into one JSON object for export. |
| `processBackupContent(content, sourceName)` | Parses pasted/uploaded backup JSON and writes it back into localStorage. Handles both full-backup and raw single-section formats. |
| `restore(key, data)` *(local to processBackupContent)* | Writes one section back to localStorage, used in a loop. |
| `handleExport()` | Downloads the backup object as a `.json` file. |
| `handleImport(e)` | Reads an uploaded `.json` file and runs it through `processBackupContent`. |
| `handleCopyToClipboard()` | Copies the backup JSON to the clipboard. |
| `handlePasteRestore()` | Runs pasted clipboard text through `processBackupContent`. |
| `handleReadClipboard()` | Auto-fills the paste textarea from the clipboard (mobile convenience). |
| `renderContent()` | Picks which tracker component to render based on the active tab. |

---

## C. Active Feature Components

### `RentTracker.tsx` ("My Stats")
| Function | What it does |
|---|---|
| `InputCard` | Small reusable input box component (label + number field) used for each wallet/parcel field. |
| `getBadgeMultiplier(count)` | Same badge-tier math as `earnings.ts` — kept as a local copy (see Redundancy Review). |
| `getAdBoostMultiplier(parcels)` | Same ad-boost math as `earnings.ts` — local copy. |
| `calculateAll()` *(inline, ~line 171)* | Runs the full rent projection using the two functions above, for this screen's own display. |
| `updateField(field, value)` | Updates one wallet/parcel field and appends a history snapshot for the day. |
| `getRangeCutoff(range)` | Local copy of the ALL/YTD/MTD/30d/7d cutoff logic (ties to Parking Lot item #8 — Leaderboards has the same local function). |

### `RivalTracker.tsx`
| Function | What it does |
|---|---|
| `getPassportBoost(count)` | Badge-count → multiplier, used for showing a rival's effective rent boost. |
| `GroupCard` | Reusable card component for grouping rival stats. |
| `loadData()` | Loads rival + town/state data from localStorage. |
| `extractLeaders(rawData, map)` | Pulls rank-1 players out of town/state data, for the "Known Mayor/Governor Of" sections. |
| `toggleImportSelection` / `executeImport` / `openImportModal` / `getOrInitFound` | Support the "import known leaders as rivals" workflow. |
| `addRival()` / `deleteCurrentRival()` / `saveRename()` | Manage the rival list itself. |
| `startEditing(entry)` / `cancelEditing()` / `handleSaveEntry()` / `deleteEntry(id)` | Standard add/edit/delete for one rival's entries (snapshot or town sighting). |
| `toggleExpand(key)` | Expands/collapses a grouped section. |
| `syncFromSource(sourceData, type, collectionKey)` | Pulls fresh numbers from town/state tracker data to auto-update synced rival entries. |
| `calcGrowthForList(list)` | Computes growth rate between a rival's entries, for trend display. |

### `LeaderboardsTracker.tsx`
| Function | What it does |
|---|---|
| `sortEntries(entries)` | Sorts merged leaderboard entries (rank-first, then parcels). |
| `loadAllData()` / `safeLoad(key)` | Loads all the location data stores plus profile (username, home town) needed across scopes. |
| `fmt(n)` | Number formatter (adds thousands separators). |
| `addReported(entries)` | Folds a location's reported entries into the working data set during load. |
| `getRangeCutoff(range)` | Local ALL/YTD/MTD/30d/7d cutoff — same logic as RentTracker's copy. |
| `togglePlayer(name)` | Adds/removes a player from the chart's selected-players chip list. |
| `getStoreInfo(locOverride?)` | Figures out which localStorage key/top-level field/location name to read or write for the current scope. |
| `writeLocationEntries(key, topKey, loc, entries)` | Shared write helper — saves entries back to the right store while preserving any other fields already on that location (state/country tags, etc.). |
| `handleSaveEntry()` | Add/edit form submit — builds an entry and calls `writeLocationEntries`. |
| `handleDeleteEntry(entryId)` | Removes one entry from the current location's data. |
| `startEdit(rawEntry)` / `cancelEdit()` | Open/close the inline edit form for an existing entry. |
| `handleQuickUpdate(name)` / `cancelQuickEdit()` | The inline "+" quick-update added this session — logs a new parcel count for a player directly from the leaderboard row. |

### `MiniGameTracker.tsx`
| Function | What it does |
|---|---|
| `addEntry()` | Adds a new mini-game result. |
| `deleteEntry(id)` | Removes one entry. |
| `toggleExpand(gameName)` | Expands/collapses a game's history list. |

### `StrategyTab.tsx`
| Function | What it does |
|---|---|
| `togglePin(townName)` | Pins/unpins a town for quick access (Defend mode). |

### `ROITracker.tsx` (Performance)
| Function | What it does |
|---|---|
| `addPurchase(name, cost, ab, type)` / `updatePurchase(updated)` / `removePurchase(e, id)` / `startEditing(p)` | Manage the list of real-money purchases (ROI tracking). |
| `confidenceMark(c)` / `confidenceTitle(p)` | Turn an earnings confidence flag (`exact`/`estimate`/`partial`) into a display icon/tooltip. |
| `fmt(n, decimals)` | Number formatter for currency display. |
| `pct` *(inline, ~line 211)* | Percent-change calculation for momentum display (this 30 days vs. prior 30 days). |
| `ManualEntryForm` / `handleSubmit` | Sub-component + submit handler for manually logging a purchase. |

---

## D. Legacy Components (Town / State / Country / Earth)

These four files are near-duplicates of each other — same screen, same logic, different scope. Each one has its own copy of:

`addX()` · `deleteCurrentX()` · `handleSaveEntry()` · `startEditing(entry)` · `cancelEditing()` · `deleteSpecificEntry(id)` · `toggleExpandPlayer/toggleSelection(name)` · `openManageModal()` · `executeManage()` · `getRank`/`getIndexRank(list, name)`

— same ~10 functions, copy-pasted four times with only the noun changed (Town→State→Country→Earth). `TownTracker.tsx` additionally has `lookupTownState(townName)` for its seeded town→state autofill, and `StateTracker.tsx` has its own `generateId()` helper that the other three don't bother extracting (they inline the same line instead).

This isn't a new finding — it's *why* these four are already slated for deletion (Parking Lot, Phase D follow-up, item #9) once you've had another week of confidence in Leaderboards. No action needed here beyond following that plan.

---

## E. Redundancy Review

What's actually worth a second look, ranked by how much it matters:

1. **The legacy four-way duplication (Section D) is the big one** — ~40 functions that are really just 10, repeated. Already scheduled for deletion. No fix needed beyond the existing plan.

2. **`getBadgeMultiplier` / `getAdBoostMultiplier` exist in two places** — `earnings.ts` (used by the Performance tab) and `RentTracker.tsx` (used by My Stats' own calculator). The code comment in `earnings.ts` even says it was "extracted... so the Performance tab can compute... without duplicating code" — but `RentTracker.tsx` kept its own copy rather than importing the extracted one. Low risk (the math is simple and stable), but if the badge tiers or ad-boost rates ever change in-game, you'd need to remember to update both files. **Worth fixing**: have `RentTracker.tsx` import these two functions from `earnings.ts` instead of keeping a second copy.

3. **`getRangeCutoff` exists in two places** — `RentTracker.tsx` and `LeaderboardsTracker.tsx` each have their own local ALL/YTD/MTD/30d/7d cutoff function (deliberate, from this session, to avoid touching the shared `utils.ts` type while the legacy trackers still depend on it). Once the legacy trackers are deleted, the shared `TimeRange` type in `utils.ts` can safely be upgraded to the new range set and both local copies retired in favor of one shared function. Already noted in Parking Lot item #8 — just flagging it's the same shape of issue as #2.

4. **`generateId()` is only a named function in `StateTracker.tsx`.** Every other file (and most new code) inlines the same `${Date.now()}-${Math.random()...}` literal per the convention in `CLAUDE.md`. Not a bug, just an inconsistency — not worth fixing on its own, but if `StateTracker.tsx` gets deleted in Phase D, this helper disappears with it.

**Bottom line:** there's no risky or buggy duplication here — the two real candidates (#2 and #3) are small, low-stakes, and partly already on the radar. The big one (#1) is already being handled by the Phase D plan you're already running.
