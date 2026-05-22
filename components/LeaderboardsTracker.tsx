import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Map, Globe, Trophy, ChevronDown, Crown, User, Users, LineChart as LineChartIcon, Plus, X, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
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

  // Add-entry form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formParcels, setFormParcels] = useState('');
  const [formRank, setFormRank] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLocation, setFormLocation] = useState('');
  const [infoNote, setInfoNote] = useState<string | null>(null);

  // --- LOAD DATA (reusable) ---
  const loadAllData = () => {
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
  };

  useEffect(() => {
    loadAllData();
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

  // --- TREND CHART STATE ---
  type ChartRange = 'ALL' | 'YTD' | 'MTD' | '30d' | '7d';
  const [chartRange, setChartRange] = useState<ChartRange>('ALL');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  // Line colors for the race chart
  const LINE_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
  ];

  // Per-player observation history at the current scope
  const scopeHistory = useMemo(() => {
    const hist: Record<string, Array<{ date: string; parcels: number }>> = {};
    const addEntries = (entries: any[]) => {
      (entries || []).forEach((e: any) => {
        const name = (e.name || '').trim();
        if (!name || !e.date) return;
        if (!hist[name]) hist[name] = [];
        hist[name].push({ date: e.date, parcels: e.parcels || 0 });
      });
    };

    if (scope === 'TOWN' && townData?.towns?.[scopeValue]) {
      addEntries(townData.towns[scopeValue].entries);
    } else if (scope === 'STATE' && stateData?.states?.[scopeValue]) {
      addEntries(stateData.states[scopeValue].entries);
    } else if (scope === 'COUNTRY' && countryData?.countries?.[scopeValue]) {
      addEntries(countryData.countries[scopeValue].entries);
    } else if (scope === 'WORLD') {
      const regions = earthData?.regions || {};
      Object.values(regions).forEach((r: any) => addEntries(r.entries));
    }

    // Sort each player's history by date ascending
    Object.keys(hist).forEach(name => {
      hist[name].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return hist;
  }, [scope, scopeValue, townData, stateData, countryData, earthData]);

  // Reset player selection to default (top 3 + you) whenever the board changes
  useEffect(() => {
    const def = new Set<string>();
    leaderboard.slice(0, 3).forEach(p => def.add(p.name));
    const me = leaderboard.find(p => p.name.toLowerCase() === username.toLowerCase());
    if (me) def.add(me.name);
    setSelectedPlayers(def);
  }, [leaderboard, username]);

  // Time-range cutoff
  const getRangeCutoff = (range: ChartRange): Date | null => {
    if (range === 'ALL') return null;
    const now = new Date();
    if (range === 'YTD') return new Date(now.getFullYear(), 0, 1);
    if (range === 'MTD') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (range === '30d') { const d = new Date(); d.setDate(d.getDate() - 30); return d; }
    if (range === '7d') { const d = new Date(); d.setDate(d.getDate() - 7); return d; }
    return null;
  };

  // Build recharts-friendly data: one row per date, carry-forward each player's value
  const chartData = useMemo(() => {
    const selected = Array.from(selectedPlayers);
    if (selected.length === 0) return [];

    // Union of all dates across selected players
    const dateSet = new Set<string>();
    selected.forEach(p => {
      (scopeHistory[p] || []).forEach(pt => dateSet.add(pt.date));
    });
    let dates = Array.from(dateSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Apply time filter
    const cutoff = getRangeCutoff(chartRange);
    if (cutoff) {
      dates = dates.filter(d => new Date(d + 'T00:00:00').getTime() >= cutoff.getTime());
    }

    return dates.map(date => {
      const row: any = { date };
      selected.forEach(p => {
        const h = scopeHistory[p] || [];
        // Latest entry on or before this date (carry-forward for a continuous line)
        let val: number | undefined;
        for (const pt of h) {
          if (new Date(pt.date).getTime() <= new Date(date).getTime()) {
            val = pt.parcels;
          }
        }
        if (val !== undefined) row[p] = val;
      });
      return row;
    });
  }, [selectedPlayers, scopeHistory, chartRange]);

  const togglePlayer = (name: string) => {
    setSelectedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Keep the form's location field synced with the current scope selection
  useEffect(() => {
    if (scope !== 'WORLD') {
      setFormLocation(scopeValue);
    }
  }, [scope, scopeValue]);

  // --- ADD ENTRY ---
  const handleAddEntry = () => {
    const name = formName.trim().toUpperCase();
    const parcels = parseInt(formParcels);
    if (!name) { alert('Enter a player name.'); return; }
    if (!formParcels || isNaN(parcels)) { alert('Enter a valid parcel count.'); return; }
    if (!formDate) { alert('Pick a date.'); return; }

    const rank = formRank ? parseInt(formRank) : null;
    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      rank,
      parcels,
      date: formDate
    };

    // Helper: append an entry into a { [topKey]: { [loc]: { entries, lastUpdated } } } store
    const writeToStore = (storageKey: string, topKey: string, loc: string, extraDefaults: any = {}) => {
      let raw: any;
      try {
        raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
      } catch {
        raw = {};
      }
      if (!raw[topKey]) raw[topKey] = {};
      const existing = raw[topKey][loc];
      raw[topKey][loc] = {
        ...extraDefaults,
        ...(existing || {}),
        entries: [...((existing && existing.entries) || []), newEntry],
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(raw));
    };

    if (scope === 'WORLD') {
      // Write into the single Earth region (reuse existing key, or create 'World')
      let raw: any;
      try { raw = JSON.parse(localStorage.getItem(EARTH_KEY) || '{}'); } catch { raw = {}; }
      if (!raw.regions) raw.regions = {};
      const regionKey = Object.keys(raw.regions)[0] || 'World';
      const existing = raw.regions[regionKey];
      raw.regions[regionKey] = {
        ...(existing || {}),
        entries: [...((existing && existing.entries) || []), newEntry],
        lastUpdated: new Date().toISOString()
      };
      if (!raw.currentRegion) raw.currentRegion = regionKey;
      localStorage.setItem(EARTH_KEY, JSON.stringify(raw));
    } else {
      const loc = formLocation.trim();
      if (!loc) { alert(`Enter a ${SCOPE_CONFIG[scope].label.toLowerCase()} name.`); return; }
      if (scope === 'TOWN') {
        // New towns default to USA so rollups work; preserves state/country if town exists
        writeToStore(TOWN_KEY, 'towns', loc, { country: 'USA' });
      } else if (scope === 'STATE') {
        writeToStore(STATE_KEY, 'states', loc);
      } else if (scope === 'COUNTRY') {
        writeToStore(COUNTRY_KEY, 'countries', loc);
      }
    }

    // Refresh data, jump to the location just edited, reset form
    loadAllData();
    if (scope !== 'WORLD' && formLocation.trim() && formLocation.trim() !== scopeValue) {
      setScopeValue(formLocation.trim());
    }
    setFormName('');
    setFormParcels('');
    setFormRank('');
    setInfoNote(`Added ${name} (${fmt(parcels)} parcels)${scope !== 'WORLD' ? ` to ${formLocation.trim()}` : ''}.`);
  };

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

      {/* --- ADD ENTRY --- */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full text-left px-4 py-3 flex items-center justify-between group hover:bg-slate-700/20 transition-colors"
        >
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <Plus size={16} className="text-green-400" />
            Add a {scopeLabel} observation
          </span>
          <ChevronDown className={`text-slate-500 group-hover:text-white transition-transform ${showAddForm ? 'rotate-180' : ''}`} size={18} />
        </button>
        {showAddForm && (
          <div className="border-t border-slate-700 p-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              {/* Location (not shown for World) */}
              {scope !== 'WORLD' && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {scopeLabel}
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    list="loc-options"
                    placeholder={`e.g. ${scope === 'TOWN' ? 'Tampa' : scope === 'STATE' ? 'Florida' : 'USA'}`}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-cyan-500"
                  />
                  <datalist id="loc-options">
                    {scopeOptions.map(o => <option key={o} value={o} />)}
                  </datalist>
                </div>
              )}
              <div className={scope === 'WORLD' ? 'md:col-span-2' : ''}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Player</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Player name"
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Parcels</label>
                <input
                  type="number"
                  value={formParcels}
                  onChange={(e) => setFormParcels(e.target.value)}
                  placeholder="#"
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rank <span className="text-slate-600 normal-case">(opt)</span></label>
                <input
                  type="number"
                  value={formRank}
                  onChange={(e) => setFormRank(e.target.value)}
                  placeholder="#"
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-cyan-500"
                />
              </div>
              <div className={scope === 'WORLD' ? '' : 'md:col-span-6'}>
                <button
                  onClick={handleAddEntry}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded text-sm transition-colors"
                >
                  Add Entry
                </button>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-3">
              {scope === 'WORLD'
                ? 'World entries are stored in the global leaderboard. Rank is the in-game world rank if you have it.'
                : `Adds an observation at ${scopeLabel.toLowerCase()} scope. Type a new ${scopeLabel.toLowerCase()} name to start tracking it. Editing and deleting entries is coming in a follow-up update.`}
            </div>
          </div>
        )}
      </div>

      {/* --- INFO BANNER --- */}
      {infoNote && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-3 flex items-start gap-3 animate-fade-in">
          <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-cyan-100 flex-1">{infoNote}</span>
          <button onClick={() => setInfoNote(null)} className="text-cyan-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

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
                      onClick={() => {
                        if (entry.source === 'identified') {
                          setInfoNote(`${entry.name}'s total here is computed from your town observations. To change it, edit their entries in the relevant town(s) on the Town scope.`);
                        }
                      }}
                      className={`transition-colors ${
                        entry.source === 'identified' ? 'cursor-help' : ''
                      } ${isMe ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-slate-700/30'}`}
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

      {/* --- TREND CHART --- */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <LineChartIcon size={18} className="text-cyan-400" /> Parcel Race
            <span className="text-[10px] text-slate-500 font-normal normal-case ml-1">history at this scope</span>
          </h3>
          {/* Time range filter */}
          <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-700">
            {(['ALL', 'YTD', 'MTD', '30d', '7d'] as ChartRange[]).map(r => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`text-xs font-bold px-2.5 py-1 rounded transition-colors ${
                  chartRange === r
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No data to chart at this scope yet.
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Player picker chips */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
                Compare players — tap to add or remove
              </div>
              <div className="flex flex-wrap gap-2">
                {leaderboard.slice(0, 30).map((p) => {
                  const isSelected = selectedPlayers.has(p.name);
                  const colorIdx = Array.from(selectedPlayers).indexOf(p.name);
                  const chipColor = isSelected && colorIdx >= 0
                    ? LINE_COLORS[colorIdx % LINE_COLORS.length]
                    : undefined;
                  return (
                    <button
                      key={p.name}
                      onClick={() => togglePlayer(p.name)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? 'text-white border-transparent'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
                      }`}
                      style={isSelected && chipColor ? { backgroundColor: chipColor } : undefined}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
              {leaderboard.length > 30 && (
                <div className="text-[10px] text-slate-600 mt-2">
                  Showing the top 30 players as options.
                </div>
              )}
            </div>

            {/* The chart */}
            {selectedPlayers.size === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
                Select one or more players above to compare.
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
                No observations in this time range. Try a wider range, or log more data.
              </div>
            ) : (
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} width={55} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {Array.from(selectedPlayers).map((name, idx) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="text-[10px] text-slate-500">
              Lines use each player's logged observations at this scope, carried forward between dates.
              Sparse data shows as dots — log more over time to fill in the lines.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
