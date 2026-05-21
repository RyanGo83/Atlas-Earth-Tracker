import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Map, Globe, Trophy, ChevronDown } from 'lucide-react';
import { getMergedLeaderboard, listScopeValues, type Scope, type MergedPlayerEntry } from '../leaderboardMerge';

// localStorage keys
const TOWN_KEY = 'atlas_town_data_v2';
const STATE_KEY = 'atlas_state_data_v2';
const COUNTRY_KEY = 'atlas_country_data_v2';
const EARTH_KEY = 'atlas_earth_data_v2';
const TOWN_DATA_KEY = 'atlas_town_data_v2';

// The four scopes the selector offers
type UIScope = 'TOWN' | 'STATE' | 'COUNTRY' | 'WORLD';

const SCOPE_CONFIG: Record<UIScope, { label: string; icon: React.ReactNode; color: string }> = {
  TOWN:    { label: 'Town',    icon: <MapPin size={16} />, color: 'bg-purple-500' },
  STATE:   { label: 'State',   icon: <Map size={16} />,    color: 'bg-orange-500' },
  COUNTRY: { label: 'Country', icon: <Globe size={16} />,  color: 'bg-emerald-500' },
  WORLD:   { label: 'World',   icon: <Trophy size={16} />, color: 'bg-cyan-500' },
};

export const LeaderboardsTracker: React.FC = () => {
  // Raw data from localStorage
  const [townData, setTownData] = useState<any>(null);
  const [stateData, setStateData] = useState<any>(null);
  const [countryData, setCountryData] = useState<any>(null);
  const [earthData, setEarthData] = useState<any>(null);

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
    setTownData(safeLoad(TOWN_DATA_KEY));
    setStateData(safeLoad(STATE_KEY));
    setCountryData(safeLoad(COUNTRY_KEY));
    setEarthData(safeLoad(EARTH_KEY));
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
      // Keep current selection if still valid, else pick first
      setScopeValue(prev => scopeOptions.includes(prev) ? prev : scopeOptions[0]);
    } else {
      setScopeValue('');
    }
  }, [scope, scopeOptions]);

  // --- MERGED LEADERBOARD (placeholder use for now; Phase C renders it) ---
  const leaderboard: MergedPlayerEntry[] = useMemo(() => {
    if (!townData) return [];
    if (scope === 'TOWN') {
      // Town scope handled differently in Phase C — return empty for now
      return [];
    }
    if (scope === 'STATE') {
      return getMergedLeaderboard(townData, stateData?.states || null, 'STATE', scopeValue);
    }
    if (scope === 'COUNTRY') {
      return getMergedLeaderboard(townData, countryData?.countries || null, 'COUNTRY', scopeValue);
    }
    if (scope === 'WORLD') {
      return getMergedLeaderboard(townData, earthData?.regions || null, 'WORLD');
    }
    return [];
  }, [scope, scopeValue, townData, stateData, countryData, earthData]);

  return (
    <div className="space-y-6">
      {/* --- SCOPE SELECTOR --- */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Scope buttons */}
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

          {/* Location dropdown (hidden for World) */}
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
                  No {SCOPE_CONFIG[scope].label.toLowerCase()} data yet
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- PLACEHOLDER CONTENT (Phase C will replace this) --- */}
      <div className="bg-slate-800 rounded-xl border border-dashed border-slate-600 p-12 text-center">
        <div className="text-slate-500">
          <Trophy size={40} className="mx-auto mb-3 opacity-40" />
          <div className="text-lg font-bold text-slate-400 mb-1">
            {SCOPE_CONFIG[scope].label} Leaderboard
            {scope !== 'WORLD' && scopeValue ? ` — ${scopeValue}` : ''}
          </div>
          <div className="text-sm">
            Scope selector is working. The leaderboard table, stats, and chart
            arrive in the next update.
          </div>
          {/* Tiny diagnostic so we can confirm data is flowing */}
          <div className="mt-4 text-xs text-slate-600 font-mono">
            {scope === 'TOWN'
              ? `${scopeOptions.length} towns available`
              : `${leaderboard.length} players found at this scope`}
          </div>
        </div>
      </div>
    </div>
  );
};
