# Atlas Earth Tracker — Parking Lot

> **For Claude:** This is the running list of open work. When the owner says "park it," add to **Pending**. When something starts, move to **In Progress**. When it ships, move to **Completed** with the date. Keep entries one-liners with enough context to pick them back up cold.

---

## ⏳ In Progress

### Leaderboards feature — Phase D (cutover)
**What:** Remove the legacy Town / State / Country / Earth tabs from `App.tsx` navigation. Keep the component files in the codebase for one release as a safety net.
**Status:** Waiting on owner to live with the new Leaderboards tab for ~1 week before retiring the old ones. Once retired, the legacy files can be deleted after another week of confidence.
**Blocker:** time-based — not a code issue.

---

## 📋 Pending

### High-touch features

1. **Rollup line on rival portfolio chart.** Show identified-parcel rollup alongside the snapshot line. The *gap* between them is intel — parcels in towns not yet tracked. Multi-line chart on the existing rival page.

2. **Known Governor Of section** on the Rival page. Same pattern as Known Mayor Of, but for state-level rank 1. Small, uses existing state data.

3. **Lost-mayorship flag in Defend mode.** Auto-detect when a town previously had the owner as mayor but no longer does, and surface it in a "Recently Lost" sub-section of Strategy → Defend. Manual override available for cases the auto-detect would miss. Useful both for nostalgia and for spotting comeback opportunities.

4. **Math-powered features.** Once `ATLAS_EARTH_MATH.md` is cleaner (see below), build:
   - Boost-aware "true rent power" calculation using rarity breakdowns
   - Buy / Don't-buy advisor for parcels and badges based on math file thresholds
   - ROI break-even projection from current rent rate

5. **Math file revisions.** Clean up `ATLAS_EARTH_MATH.md`:
   - Callout boxes for critical thresholds (the 150-parcel ceiling, first badge at 6.32 units, etc.)
   - Per-day / per-hour columns for rent rates (currently buried in 11-zero scientific notation)
   - Consolidate the duplicate Mayor 10% kickback mentions
   - Add a Super Rent Boost (SRB) section — currently undocumented
   - Add Town Competition math: when is it worth challenging for mayor of a town

### From the June 2026 code scan

16. **No guard against a parcel count going backward.** Manual entry in Leaderboards (and the legacy trackers) accepts any number, including one lower than a prior entry for the same player. The monotonic-parcels assumption (carry-forward chart rays, "latest = highest on tie" sort) depends on parcels never decreasing — a typo wouldn't be caught and could quietly produce a wrong "latest" pick or a confusing dip. Worth at least a soft warning on save.

17. **No top-500 cap or "beyond top 500" indicator in Leaderboards.** Same gap as the already-listed item #11 below — flagging again since Leaderboards is about to become the primary tab.

18. **`scopeHistory` in `LeaderboardsTracker.tsx` has no memoization beyond the outer `useMemo`.** It rebuilds an O(players × towns × dates) history on every leaderboard/town-data change. Not urgent at current data sizes — a watch-item if the rival roster grows a lot.

19. **Duplicated JSDoc block in `leaderboardMerge.ts`.** Lines ~174-184 and ~215-225 are near-identical doc comments for `getMergedLeaderboard`. Harmless, just tidy up.

20. **Stray `console.log` calls in `App.tsx`** (backup/restore flow, ~lines 112 and 132). Useful for debugging but should be gated or removed before calling the app production-hardened.

### New feature requests (June 2026)

21. **Bid Tokens.** New spendable currency that replaced Diamonds as the daily-spin reward (presumably used for bidding/auctions in-game). Diamonds still exist in-game — they're now found randomly on the map instead — so this is an additive wallet field, not a replacement of the existing Diamonds field in `atlas_rent_data_v2` (RentTracker). Only the owner's own balance is visible in-game — no opponent data, so no leaderboard/rival angle, just a new wallet field + history like the other currencies.

22. **Mayorship earnings tracking.** Track earnings from being Mayor of a town (the 10% kickback on certain in-town events) separately from regular rent. Owner only has visibility into their own mayorship earnings, not rivals' — so this is a personal stats addition (likely RentTracker or Performance tab), not a leaderboard feature.

### Polish & small UX

6. **Clipboard backup size guard.** Warn the owner and recommend the file-based Backup when the backup payload is too large for reliable clipboard transfer. This caused a data scare once — the clipboard truncated and only the small `state` section restored.

7. **Recharts zero-size warning.** Occasional `width(-1)/height(-1) of chart should be greater than 0` in the console, usually from charts rendering inside a collapsed/hidden tab. Audit container sizing.

8. **Time range options across the app.** Drop `WTD`, add `7d` and `30d`. Keep `ALL`, `YTD`, `MTD`. Leaderboards and RentTracker ("My Stats") now both use the new set locally (each with its own local range type, not the shared `utils.ts` `TimeRange`). Remaining: Rival, Town/State/Country/Earth (legacy — low priority), and Performance tabs still use `WTD/MTD/YTD/ALL` via the shared type.

9. **Hometown as default landing for Town / State / Country.** Use the Profile's hometown to default the scope dropdown instead of alphabetical-first. Needs Profile to expose the hometown's state and country (currently only the town).

10. **"Stale data" indicator.** When a Reported entry is 60+ days old, show a subtle "stale" marker on the leaderboard row. Surfaces data-freshness without nagging.

11. **"Beyond top 500" indicator.** All in-game leaderboards cap at top 500. A player observed outside the top 500 is ambiguous — they exist but their rank can't be known from the game. Could be a small badge or footnote.

### Future / nice-to-have

12. **Tailwind CDN → proper build.** Console warns "cdn.tailwindcss.com should not be used in production." Switch to PostCSS plugin or Tailwind CLI when this app becomes shareable.

13. **Dead `/index.css` 404.** `index.html` references `/index.css` which doesn't exist. Harmless 404 but worth tidying.

14. **Move project out of Dropbox.** `node_modules` + Dropbox sync = slow and occasionally conflict-prone. GitHub is the source of truth. Move to `C:\Users\ryan.gorman\Projects\` or similar.

15. **Shareability considerations.** If/when the owner wants to share with other Atlas Earth players, decide between (a) shareable but still local-only (each user has their own browser storage), (b) optional Supabase backend for cross-device sync, (c) something between. Backend tradeoffs discussed previously — clipboard fix solved 80% of the daily pain.

---

## ✅ Completed (recent first)

### Leaderboards Phase C — Parts 1, 2, 2.5, 3, 3.5
- ✅ **Part 3.5 (May 2026)** — Edit and delete entries from inside the Leaderboards tab. Expandable Reported player rows with per-entry edit/delete; Identified rows show "computed from towns" note.
- ✅ **Part 2.5 (May 2026)** — Carry-forward rays on the chart: last-known value extended to today as a dashed segment (parcel monotonicity guarantee).
- ✅ **Identified-history reconstruction (May 2026)** — Chart now rebuilds history for Identified players by summing town parcels over time, so the chart works even when the scope's data is pure rollup.
- ✅ **Part 3 (May 2026)** — Add-Entry form built into the Leaderboards tab. Scope-aware: writes to the right localStorage store based on Town/State/Country/World. Allows typing new locations to create them on the spot.
- ✅ **World fallback fix (May 2026)** — When the Earth tracker is empty, World scope falls back to summing player totals across all Country tracker entries. Made the World view meaningful for the common case.
- ✅ **Part 2 (May 2026)** — Parcel Race chart with player picker (chips), per-scope time filter (ALL / YTD / MTD / 30d / 7d), recharts multi-line.
- ✅ **Part 1 (May 2026)** — Leaderboard table and summary stats. Scope selector wired. Source badges (Reported vs Identified). Owner row highlighted.

### Foundation work
- ✅ **`leaderboardMerge.ts`** — merge utility for Reported + Identified per-player data with sort rules.
- ✅ **Leaderboards tab skeleton** — added `Tab.LEADERBOARDS` to enum, wired into nav and content router.
- ✅ **`rollup.ts`** — town-rollup math (state / country / world per-player totals).

### Earlier feature work
- ✅ **"Since Last" + "7-Day Rate" cards** replacing the misleading "Today" earnings card on the Performance tab (better fit for owner's 3–4x/week update cadence).
- ✅ **Performance tab buildout** — Earnings History (Option A layout), Projected vs Actual table (Option C layout, with gap %), Earning Scenarios moved here from Rent tab.
- ✅ **ROI tab renamed → 📊 Performance** in the UI. Internal `Tab.ROI` name kept to preserve the `atlas_roi_data_v2` storage key.
- ✅ **MTD reminder card on Rent tab** linking to Performance.
- ✅ **`earnings.ts`** utility — actual earnings from `totalAccrued` snapshot deltas + projection math extracted from RentTracker.
- ✅ **Known Mayor Of section** on the Rival page — computed from town data, no new data entry needed. Color-codes lead-over-runner-up by "safe / watch / contested."
- ✅ **Rarity breakdown on portfolio snapshots** — common/rare/epic/legendary fields on `RivalEntry` SNAPSHOT type, with live sanity check vs total parcels.
- ✅ **State / country tags on towns** — optional `state` and `country` fields on `TownData`, warning badges on untagged towns, modal editor, auto-fill from a seeded common-towns lookup.
- ✅ **Mobile tab horizontal scroll** — `overflow-x-auto` on the nav strip with thin custom scrollbar.
- ✅ **Clipboard backup/restore** — Copy backup as text and Paste Restore dialog, complement to the existing file Backup/Restore. Solves daily mobile pain.

### June 2026 code scan fixes
- ✅ **Date-parsing UTC bug in Leaderboards math** — `rollup.ts`, `leaderboardMerge.ts`, and `LeaderboardsTracker.tsx` were comparing `YYYY-MM-DD` strings with bare `new Date()` instead of `parseLocalDate()`, which could flip tie-breaks (latest entry, Reported-vs-Identified precedence) by a day depending on timezone. All instances now use `parseLocalDate` from `utils.ts`.
- ✅ **Spread-before-update violation in legacy trackers** — `EarthTracker.tsx`, `StateTracker.tsx`, `CountryTracker.tsx` were rebuilding nested store entries without spreading the existing object first (the same pattern that once wiped town state/country tags). Fixed to spread first, consistent with `TownTracker.tsx`.
- ✅ **World-scope writes landing in an arbitrary region** — `LeaderboardsTracker.tsx`'s `getStoreInfo()` picked `Object.keys(regions)[0]` for World-scope adds/edits. Now prefers the Earth tracker's own `currentRegion` pointer, falling back to alphabetically-first, then a new `'World'` region.
- Originals archived to `_cowork/archive/` before editing (suffix `.20260626-pre-fix.bak`).

### Bugs squashed
- ✅ **`isInitialized` race condition** — load effect was synchronously marking initialized true, causing the save effect to overwrite freshly-loaded data with the empty default. Fixed across all 9 trackers using `setTimeout(0)` deferral. This was the *original* cause of the rent-data data loss.
- ✅ **TownData state/country wipe on edit** — `handleSaveEntry` and `deleteSpecificEntry` were rebuilding the town object without spreading the existing one, dropping state/country tags. Now use `...prev.towns[townName]` to preserve unknown fields.
- ✅ **MiniGameTracker "Latest Entry" sort bug** — was mutating the already-sorted history array mid-render. Fixed with `[...entries].sort(...)`.
- ✅ **Gemini API leftovers** — removed `process.env.API_KEY` / `process.env.GEMINI_API_KEY` from `vite.config.ts` and deleted `.env.local`.

---

## 🗒️ Notes for future sessions

- The owner's Atlas Earth username is `H1PHOPANONYMOUS`. Home town: `St. Petersburg`, Florida.
- The owner runs locally at `localhost:3000` and pushes to GitHub (`Atlas-Earth-Tracker` repo) for Vercel auto-deploy.
- The owner is generally Florida-focused for parcels; the seeded town→state lookup in `TownTracker.tsx` and the legacy `US_STATES` array reflect that.
- A backup template lives at the project root as `atlas-tracker-backup-template.json` for reference / restore-testing.
