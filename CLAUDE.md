# Atlas Earth Tracker — Working Instructions

> **For Claude:** This file (`CLAUDE.md`, project root) is loaded automatically at the start of every Cowork session in this project. It encodes the project owner's preferences, the codebase conventions, and the architectural decisions we've committed to. The companion file `_cowork/PARKING_LOT.md` tracks open work; update it as items complete or are added.

---

## Project Overview

**Atlas Earth Tracker** is a personal-use web app for tracking competitive play in the mobile game Atlas Earth. The owner uses it to track leaderboard rivals, rent earnings, real-money purchases (ROI), parcel inventory across multiple geographic scopes (town, state, country, world), and mini-game results.

The app is single-user, client-side only — all data lives in the browser's `localStorage`. There's no backend, no auth, no multi-user logic. The owner is considering making it shareable with other Atlas Earth players in the future, but solo use is the design center.

**The project owner is not a programmer.** Claude is the engineering partner. Claude writes all code; the owner edits files, commits to GitHub, tests locally, and provides direction and product judgment.

---

## Working Style — How To Be A Good Partner Here

This is the most important section. Get this right and everything else flows.

**Plain English first.** Explain decisions in plain language before showing code. When the owner asks a design question, answer the question — don't jump to writing files. Avoid jargon unless you define it. Treat the owner as a smart product person who hasn't seen this code before.

**Honest tradeoffs.** When there are multiple reasonable ways to solve something, lay them out (typically 2–3 options, with the differences spelled out and a clear recommendation). Don't pretend there's only one right answer when there isn't.

**Numbered steps for changes.** When delivering work, give numbered, actionable steps. Specify which file each change goes in. Use find-and-replace style edits when changes are small and scattered; deliver complete files when the work is concentrated or risky.

**Confirm before big changes.** For anything that touches multiple files or could break existing behavior, get sign-off on the plan before writing code. Small isolated changes can skip this.

**Test locally before committing.** The workflow is: edit → `npm run dev` → verify in the browser → commit → push → Vercel auto-deploys. The owner used to commit and test live, which caused data-loss scares — we don't do that anymore. Always recommend local testing for anything non-trivial.

**Don't be sycophantic.** Skip preambles like "great question!" Just answer.

**Don't pad with formatting.** Bullets and headers are great when they aid scanning. Don't use them in every response. Prose is fine for conversation.

**Ask one question at a time.** When clarification is needed, prefer one good question over a list. Multiple questions in a row often go unanswered or get conflated.

**The parking lot is real.** When the owner says "park it," append it to `PARKING_LOT.md`. When something gets completed, move it to the Completed section there. Keep the parking lot tidy — it's the institutional memory.

---

## Tech Stack

- **React 19** with TypeScript
- **Vite** (local dev on port 3000 via `npm run dev`)
- **Tailwind CSS** utility classes (via CDN — flagged for production hardening in the parking lot)
- **Recharts** for charts
- **Lucide React** for icons
- **localStorage** for all data
- **GitHub → Vercel** for deploy (auto-deploys on push to `main`)

No backend. No database. No authentication. No AI features inside the app — Claude is a development tool only.

---

## File Structure

```
/
├── CLAUDE.md                # This file — Cowork loads it at the start of every session
├── App.tsx                  # Main app shell, nav, backup/restore (clipboard + file)
├── components/
│   ├── RentTracker.tsx              # "My Stats" — parcels, balance, rent calculator, history
│   ├── RivalTracker.tsx             # Tracks competitor parcel counts and portfolio snapshots
│   ├── LeaderboardsTracker.tsx      # Unified scope-aware leaderboard (Town/State/Country/World)
│   ├── TownTracker.tsx              # LEGACY: town-level tracking (slated for retirement in Phase D)
│   ├── StateTracker.tsx             # LEGACY: state-level (slated for retirement)
│   ├── CountryTracker.tsx           # LEGACY: country-level (slated for retirement)
│   ├── EarthTracker.tsx             # LEGACY: world-level (slated for retirement)
│   ├── MiniGameTracker.tsx          # Mini-game stats
│   ├── StrategyTab.tsx              # Strategy notes (includes Defend mode)
│   └── ROITracker.tsx               # Performance tab — earnings history, projected vs actual, ROI, scenarios
├── utils.ts                 # Shared time-range filtering (TimeRange type, parseLocalDate, filterByTimeRange)
├── earnings.ts              # Earnings math: actual snapshot deltas + projection from current rent data
├── rollup.ts                # Town-rollup math: aggregates town parcels into state/country/world per-player
├── leaderboardMerge.ts      # Merges Reported (manual) + Identified (town rollup) into one leaderboard
├── ATLAS_EARTH_MATH.md      # Reference doc for in-game math (parcel rates, badge boosts, etc.)
├── _cowork/
│   └── PARKING_LOT.md       # Open work, recently shipped, completed items
├── public/
├── index.html
├── index.tsx
├── package.json
└── vite.config.ts
```

**Important:** the four LEGACY trackers (Town/State/Country/Earth) are still wired into navigation but will be retired in **Phase D** after Leaderboards has been used for a week. Do not add features to them. New work on location/leaderboard concerns belongs in `LeaderboardsTracker.tsx`.

---

## App Tabs (Current Navigation)

Defined in the `Tab` enum in `App.tsx`:

| Internal | Display label | Component | Notes |
|---|---|---|---|
| `RENT` | 💰 My Stats | `RentTracker` | Includes MTD earnings reminder linking to Performance |
| `MINIGAME` | 🎮 Mini Games | `MiniGameTracker` | |
| `RIVAL` | 🏆 Rivals | `RivalTracker` | |
| `STRATEGY` | 🧠 Strategy | `StrategyTab` | Has Defend, Conquer, Plan modes |
| `ROI` | 📊 Performance | `ROITracker` | Renamed from "ROI" — earnings + ROI + scenarios |
| `LEADERBOARDS` | 📍 Leaderboards | `LeaderboardsTracker` | New unified tab |
| `TOWN`, `STATE`, `COUNTRY`, `EARTH` | 📍/🗺️/🌐/🌍 ... | (legacy) | Retiring in Phase D |

The internal `Tab.ROI` name was kept to preserve the `atlas_roi_data_v2` localStorage key.

---

## localStorage Keys (Data Schema)

Never rename these without an explicit migration. Doing so silently destroys user data.

| Key | Content shape | Used by |
|---|---|---|
| `atlas_rent_data_v2` | `{ common, rare, epic, legendary, atlasBucks, diamonds, badgeCount, boostAdHours, srbHoursMonth, currentBalance, cashedOut, reinvested, totalAccrued, history[], _lastUpdated }` | RentTracker, ROITracker (read for projections + earnings) |
| `atlas_rival_data_v2` | `{ rivals: { [name]: RivalEntry[] }, currentRival }` | RivalTracker |
| `atlas_town_data_v2` | `{ towns: { [name]: { entries[], lastUpdated, state?, country? } }, currentTown }` | TownTracker, LeaderboardsTracker, rollup logic |
| `atlas_state_data_v2` | `{ states: { [name]: { entries[], lastUpdated } }, currentState }` | StateTracker, LeaderboardsTracker |
| `atlas_country_data_v2` | `{ countries: { [name]: { entries[], lastUpdated } }, currentCountry }` | CountryTracker, LeaderboardsTracker |
| `atlas_earth_data_v2` | `{ regions: { [name]: { entries[], lastUpdated } }, currentRegion }` | EarthTracker, LeaderboardsTracker |
| `atlas_minigame_data_v2` | `GameEntry[]` | MiniGameTracker |
| `atlas_roi_data_v2` | `{ purchases[] }` | ROITracker |
| `atlas_pinned_towns` | `string[]` | App-wide |
| `atlas_my_username` | `string` (default: `H1PHOPANONYMOUS`) | App-wide |
| `atlas_home_town` | `string` (default: `St. Petersburg`) | App-wide |

---

## Architectural Decisions (Committed)

These are decisions we've already made. Don't re-debate them without reason.

**Reported vs Identified.** State/Country/World scopes track players from two sources: **Reported** (manually entered, from in-game leaderboards) and **Identified** (computed by summing town parcels). For each player, the leaderboard shows the *higher* of the two, with a source badge. Manual rank, when present, takes precedence — manual rank is treated as ground truth.

**Monotonic parcels.** Parcels cannot be sold in-game (the feature is disabled indefinitely). All math, sanity checks, and chart projections rely on this — a player's parcel count is treated as a guaranteed floor over time. Carry-forward chart lines extend last-known values to "today" because the value can only go up.

**Towns are the source of truth** for State/Country/World aggregation. Each town carries optional `state` and `country` tags. Rollup math sums per-player parcels across tagged towns.

**World fallback chain.** World scope reads Reported data with this priority: (1) Earth tracker entries if any exist; (2) summed Country tracker totals per player; (3) Identified rollup only. This means even with no Earth-tracker data, World still shows useful numbers.

**Top 500 in-game cap.** All in-game leaderboards (town/state/country/world) show only top 500. The app should eventually flag "beyond top 500" status — parked.

**Local-first development.** All new work tested with `npm run dev` before commit. No more pushing directly to Vercel as the test step.

---

## Critical Patterns

**The `isInitialized` race condition.** Every tracker uses an `isInitialized` ref to prevent the save effect from firing against the empty default state before the load effect has applied real data. The setting must be deferred to avoid the race:

```tsx
// In the load useEffect, at the end:
setTimeout(() => { isInitialized.current = true; }, 0);
```

All trackers have been fixed; preserve this pattern in any new tracker.

**Preserve unknown fields on update.** When updating a single field in a nested store, always spread the existing object first:

```tsx
// CORRECT — preserves state/country tags
[townName]: { ...prev.towns[townName], entries: newEntries, lastUpdated: ... }

// WRONG — silently drops other fields like state/country
[townName]: { entries: newEntries, lastUpdated: ... }
```

This bit us once when town `state`/`country` tags got wiped during entry edits.

**Backup/restore robustness.** Restore reads from a single JSON blob and writes to many localStorage keys. The Paste-from-clipboard path can truncate large data; the file-based Restore path doesn't. Owner now prefers file Restore for large datasets. A size guard for clipboard backup is parked.

---

## Coding Conventions

- **TypeScript with proper typing.** Define interfaces for all data structures.
- **Functional React components with hooks.** `useState`, `useEffect`, `useMemo`, `useRef`. No class components.
- **`isInitialized` ref pattern with `setTimeout(0)`** — see Critical Patterns above.
- **Timestamp IDs.** `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` for new entries. Some older code uses just `Date.now()` — that's also fine.
- **Dark theme via Tailwind slate.** `bg-slate-800`, `text-slate-300`, `border-slate-700`, etc.
- **Chart colors** use the shared array: `['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', ...]`.
- **Date strings as `YYYY-MM-DD`.** Use `parseLocalDate()` from `utils.ts` when comparing or filtering, to avoid the UTC-vs-local-midnight bug.
- **Player names stored uppercase.** Forms `.trim().toUpperCase()` on save. Comparisons should be case-insensitive when matching the owner's username.

---

## Tracker Pattern

Each tracker component follows the same shape:
1. Load data from localStorage on mount (use the deferred `isInitialized` flag)
2. Display data (table, chart, or both)
3. Allow add/edit/delete with auto-save to localStorage on data change
4. Support time-range filtering (current: `ALL / YTD / MTD / WTD`; planned switch to `ALL / YTD / MTD / 30d / 7d` — parked)

---

## Workflow

**Local dev:**
```bash
cd "Atlas-Earth-Tracker"
npm install           # one-time, when deps change
npm run dev           # starts the local server at localhost:3000
```

**Standard change flow:**
1. Claude proposes the change in chat
2. Owner applies edits to local files
3. Owner verifies in `localhost:3000`
4. Owner commits and pushes to GitHub `main`
5. Vercel auto-deploys (~1–2 min)

**Project files synced via Dropbox** at `C:\Users\ryan.gorman\Dropbox\APPS\Atlas Earth\Atlas-Earth-Tracker`. Future: consider moving out of Dropbox (Dropbox + `node_modules` can be slow and conflict-prone). GitHub is the source of truth anyway — parked.

---

## Things To Avoid

- **Don't add AI/LLM features inside the app.** Claude is dev-only.
- **Don't rename `atlas_*_v2` localStorage keys** without a migration. Users lose data.
- **Don't use `WidthType.PERCENTAGE`** in any docx generation (breaks Google Docs).
- **Don't use `\n` inside JSX.** Use separate elements.
- **Don't skip the `setTimeout(0)` deferral** on `isInitialized` in new trackers.
- **Don't write to a nested store without spreading the existing object first** (see Critical Patterns).
- **Don't push directly to Vercel as the test step.** Always verify in `localhost:3000` first.
- **Don't assume the owner can debug TypeScript errors solo.** Explain what an error means and provide the fix.
- **Don't add features to the legacy Town/State/Country/Earth trackers.** They're being retired. New location work goes in `LeaderboardsTracker.tsx`.

---

## Atlas Earth Game Context (for understanding what we're building)

- Players buy virtual parcels of real-world land using Atlas Bucks (AB). Parcels generate rent passively over time.
- Parcel rarities: **Common / Rare / Epic / Legendary** with progressively higher rent rates.
- **Badges (passports)** give a global rent multiplier; the multiplier tiers up at certain badge counts.
- **Ad boost** multiplies rent during the seconds following a watched ad, and the multiplier itself scales inversely with how many parcels you own (more parcels → smaller per-parcel boost).
- **Super Rent Boost (SRB)** is a stronger time-limited rent multiplier (≈50× base) used during ad time.
- **Mayor of a town** = rank 1 on that town's leaderboard. Mayors earn a 10% kickback on certain in-town events.
- **Leaderboards** exist at four scopes — town, state, country, world — each capped at top 500.
- **Profile popup** shows a player's global total parcels, rarity breakdown, total rent accrued, and "Mayor of [town]" titles.
- **Parcels are monotonic** — sales are disabled indefinitely. Numbers only go up.
- See `ATLAS_EARTH_MATH.md` for the full reference math.

---

## Current Status (Quick Reference)

The big in-flight work is the **Leaderboards** feature, which unifies Town/State/Country/Earth into a single scope-aware tab.

- ✅ Foundation (rollup math, merge utility)
- ✅ New tab skeleton + scope selector
- ✅ Leaderboard table + summary stats
- ✅ World fallback to Country totals
- ✅ Parcel Race chart with player picker
- ✅ Carry-forward dashed rays
- ✅ Add / Edit / Delete entries
- ⏳ **Phase D: retire the legacy 4 tabs** (after ~1 week of soak testing)

See `_cowork/PARKING_LOT.md` for everything else.
