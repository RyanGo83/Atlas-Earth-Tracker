import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Map, Globe, Trophy, ChevronDown, Crown, User, Users } from 'lucide-react';
import { getMergedLeaderboard, listScopeValues, type MergedPlayerEntry } from '../leaderboardMerge';

// localStorage keys
const TOWN_KEY = 'atlas_town_data_v2';
const STATE_KEY = 'atlas_state_data_v2';
const COUNTRY_KEY = 'atlas_country_data_v2';
const EARTH_KEY = 'atlas_earth_data_v2';
const USERNAME_KEY = 'atlas_my_username';

// The four scopes the selector offers
type UIScope = 'TOWN' | 'STATE' | 'COUNTRY' | 'WORLD';

const SCOPE_CONFIG: Record<UIScope, { label: string; icon: React.ReactNode; color: string }> = {
  TOWN:    { label: 'Town',    icon: <MapPin size={16} />, color: 'bg-purple-500' },
  STATE:   { label: 'State',   icon: <Map size={16} />,    color: 'bg-orange-500' },
  COUNTRY: { label: 'Country', icon: <Globe size={16} />,  color: 'bg-emerald-500' },
  WORLD:   { label: 'World',   icon: <Trophy size={16} />, color: 'bg-cyan-500' },
};

// Sort that mirrors leaderboardMerge: manual rank first (ascending), then parcels descending
const sortEntries = (entries: MergedPlayerEntry[]): MergedPlayerEntry[] => {
  return [...entries].sort((a, b) => {
    const aHas = typeof a.rank === 'number';
    const bHas = typeof b.rank === 'number';
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    if (aHas && bHas) return (a.rank! - b.rank!);
    if (b.parcels !== a.parcels) return b.parcels - a.parcels;
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });
};

export const LeaderboardsTracker: React.FC = () => {
  // Raw data from localStorage
  const [townData, setTownData] = useState<any>(null);
  const [stateData, setStateData] = useState<any>(null);
  const [countryData, setCountryData] = useState<any>(null);
  const [earthData, setEarthData] = useState<any>(null);
  const [username, setUsername] = useState<string>('');

  // Scope selection
  const [scope, setScope] = useState<UIScope>('TOWN');
  const [scopeValue, setScopeValue] = useState<string>('');

  // --- LOAD DATA ---
  useEffect(() => {
    const safeLoad = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error(`Failed to load ${key}`, e);
        return null;
      }
    };
    setTownData(safeLoad(TOWN_KEY));
    setStateData(safeLoad(STATE_KEY));
    setCountryData(safeLoad(COUNTRY_KEY));
    setEarthData(safeLoad(EARTH_KEY));
    setUsername(localStorage.getItem(USERNAME_KEY) || 'H1PHOPANONYMOUS');
  }, []);

  // --- AVAILABLE SCOPE VALUES (for the dropdown) ---
  const scopeOptions = useMemo(() => {
    if (scope === 'WORLD') return ['World'];
    if (scope === 'TOWN') {
      return townData?.towns ? Object.keys(townData.towns).sort() : [];
    }
    if (scope === 'STATE') {
      return listScopeValues(townData, stateData?.states || null, 'STATE');
    }
    if (scope === 'COUNTRY') {
      return listScopeValues(townData, countryData?.countries || null, 'COUNTRY');
    }
    return [];
  }, [scope, townData, stateData, countryData]);

  // When scope changes, pick a sensible default scopeValue
  useEffect(() => {
    if (scope === 'WORLD') {
      setScopeValue('World');
      return;
    }
    if (scopeOptions.length > 0) {
      setScopeValue(prev => scopeOptions.includes(prev) ? prev : scopeOptions[0]);
    } else {
      setScopeValue('');
    }
  }, [scope, scopeOptions]);

  // --- TOWN SCOPE LEADERBOARD (direct observations, no rollup) ---
  const townLeaderboard: MergedPlayerEntry[] = useMemo(() => {
    if (scope !== 'TOWN' || !townData?.towns || !scopeValue) return [];
    const town = townData.towns[scopeValue];
    if (!town?.entries) return [];
    // Latest entry per player
    const latest: Record<string, any> = {};
    town.entries.forEach((e: any) => {
      const name = (e.name || '').trim();
      if (!name) return;
      if (!latest[name] || new Date(e.date) > new Date(latest[name].date)) {
        latest[name] = e;
      }
    });
    const entries: MergedPlayerEntry[] = Object.values(latest).map((e: any) => ({
      name: (e.name || '').trim(),
      parcels: e.parcels || 0,
      source: 'reported' as const,
      reportedParcels: e.parcels || 0,
      rank: typeof e.rank === 'number' ? e.rank : undefined,
      lastSeen: e.date
    }));
    return sortEntries(entries);
  }, [scope, scopeValue, townData]);

  // --- STATE / COUNTRY / WORLD LEADERBOARD (merged: reported + identified) ---
  const mergedLeaderboard: MergedPlayerEntry[] = useMemo(() => {
    if (!townData || scope === 'TOWN') return [];
    if (scope === 'STATE') {
      return getMergedLeaderboard(townData, stateData?.states || null, 'STATE', scopeValue);
    }
    if (scope === 'COUNTRY') {
      return getMergedLeaderboard(townData, countryData?.countries || null, 'COUNTRY', scopeValue);
    }
    if (scope === 'WORLD') {
      return getMergedLeaderboard(
        townData,
        earthData?.regions || null,
        'WORLD',
        undefined,
        countryData?.countries || null
      );
    }
    return [];
  }, [scope, scopeValue, townData, stateData, countryData, earthData]);

  // The leaderboard to display, whichever scope is active
  const leaderboard = scope === 'TOWN' ? townLeaderboard : mergedLeaderboard;

  // --- SUMMARY STATS ---
  const summary = useMemo(() => {
    const myIdx = leaderboard.findIndex(
      p => p.name.toLowerCase() === username.toLowerCase()
    );
    return {
      total: leaderboard.length,
      myPosition: myIdx >= 0 ? myIdx + 1 : null,
      myParcels: myIdx >= 0 ? leaderboard[myIdx].parcels : null,
      leader: leaderboard[0] || null
    };
  }, [leaderboard, username]);

  const showSourceColumn = scope !== 'TOWN';
  const scopeLabel = SCOPE_CONFIG[scope].label;
  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-6">
      {/* --- SCOPE SELECTOR --- */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(SCOPE_CONFIG) as UIScope[]).map(s => {
              const cfg = SCOPE_CONFIG[s];
              const isActive = scope === s;
              return (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    isActive
                      ? `${cfg.color} text-white shadow-lg`
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {cfg.icon}
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {scope !== 'WORLD' && (
            <div className="flex items-center gap-2 md:ml-2">
              <span className="text-slate-500 text-sm font-bold hidden md:inline">›</span>
              {scopeOptions.length > 0 ? (
                <div className="relative flex-1 md:flex-none">
                  <select
                    value={scopeValue}
                    onChange={(e) => setScopeValue(e.target.value)}
                    className="appearance-none bg-slate-900 border border-slate-600 rounded-lg pl-3 pr-9 py-2 text-white font-bold text-sm cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                  >
                    {scopeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              ) : (
                <span className="text-slate-500 text-sm italic">
                  No {scopeLabel.toLowerCase()} data yet
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- SUMMARY STATS --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Your Rank</div>
          <div className="text-white text-2xl font-bold font-mono">
            {summary.myPosition ? `#${summary.myPosition}` : '—'}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Your Parcels</div>
          <div className="text-green-400 text-2xl font-bold font-mono">
            {summary.myParcels !== null ? fmt(summary.myParcels) : '—'}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Players Tracked</div>
          <div className="text-white text-2xl font-bold font-mono">{summary.total}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Leader</div>
          {summary.leader ? (
            <div>
              <div className="text-yellow-400 text-sm font-bold truncate">{summary.leader.name}</div>
              <div className="text-slate-400 text-xs font-mono">{fmt(summary.leader.parcels)} parcels</div>
            </div>
          ) : (
            <div className="text-slate-600 text-2xl font-bold">—</div>
          )}
        </div>
      </div>

      {/* --- LEADERBOARD TABLE --- */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <Trophy size={18} className="text-cyan-400" />
          <h3 className="text-lg font-bold text-white">
            {scopeLabel} Leaderboard
            {scope !== 'WORLD' && scopeValue ? <span className="text-slate-400 font-normal"> — {scopeValue}</span> : ''}
          </h3>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users size={36} className="mx-auto mb-3 opacity-40" />
            <div className="text-sm">
              No players tracked at this scope yet.
              {scope !== 'TOWN' && ' Tag your towns with a state/country, or add entries in the legacy tabs.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-3 w-16">#</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-right">Parcels</th>
                  {showSourceColumn && <th className="p-3 text-center hidden md:table-cell">Source</th>}
                  <th className="p-3 text-right hidden md:table-cell">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {leaderboard.map((entry, idx) => {
                  const position = idx + 1;
                  const isMe = entry.name.toLowerCase() === username.toLowerCase();
                  const gap = (entry.reportedParcels !== undefined && entry.identifiedParcels !== undefined)
                    ? entry.reportedParcels - entry.identifiedParcels
                    : null;

                  // Position styling
                  let posClass = 'text-slate-400 font-mono';
                  if (position === 1) posClass = 'text-yellow-400 font-bold text-lg font-mono';
                  else if (position === 2) posClass = 'text-slate-300 font-bold font-mono';
                  else if (position === 3) posClass = 'text-orange-400 font-bold font-mono';

                  return (
                    <tr
                      key={entry.name}
                      className={`transition-colors ${isMe ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-slate-700/30'}`}
                    >
                      {/* Position */}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className={posClass}>{position}</span>
                          {position === 1 && <Crown size={14} className="text-yellow-500" />}
                        </div>
                      </td>

                      {/* Player name */}
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                            {entry.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1">
                              <User size={9} /> You
                            </span>
                          )}
                          {typeof entry.rank === 'number' && (
                            <span
                              className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold"
                              title="Rank reported directly from the in-game leaderboard"
                            >
                              🏆 #{entry.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Parcels */}
                      <td className="p-3 text-right">
                        <span
                          className="font-mono font-bold text-green-400"
                          title={
                            gap !== null
                              ? `Reported: ${fmt(entry.reportedParcels!)} · Identified: ${fmt(entry.identifiedParcels!)} · Gap: ${fmt(Math.abs(gap))}`
                              : undefined
                          }
                        >
                          {fmt(entry.parcels)}
                        </span>
                      </td>

                      {/* Source badge */}
                      {showSourceColumn && (
                        <td className="p-3 text-center hidden md:table-cell">
                          {entry.source === 'reported' ? (
                            <span className="text-[9px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full uppercase font-bold border border-green-500/30">
                              ✓ Reported
                            </span>
                          ) : (
                            <span
                              className="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full uppercase font-bold border border-amber-500/30"
                              title="Identified — summed from town observations. This is a lower bound; the player may own parcels in towns you haven't tracked."
                            >
                              ◇ Identified
                            </span>
                          )}
                        </td>
                      )}

                      {/* Last seen */}
                      <td className="p-3 text-right text-xs text-slate-500 hidden md:table-cell">
                        {entry.lastSeen}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Source legend (only for merged scopes) */}
        {showSourceColumn && leaderboard.length > 0 && (
          <div className="px-4 py-3 bg-slate-900/40 border-t border-slate-700 text-[10px] text-slate-500">
            <span className="text-green-400 font-bold">✓ Reported</span> = directly from the game leaderboard &nbsp;·&nbsp;
            <span className="text-amber-400 font-bold">◇ Identified</span> = summed from your town observations (a lower bound).
            Hover a parcel count to see both numbers.
          </div>
        )}
      </div>
    </div>
  );
};
