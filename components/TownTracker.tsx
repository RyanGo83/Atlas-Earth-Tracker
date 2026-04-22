
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trash2, PlusCircle, MapPin, Trophy, ArrowUp, ArrowDown, Minus, Crown, Target, 
  ChevronDown, ChevronUp, Pencil, Save, X, History, LayoutList, LineChart as ChartIcon,
  Users, Check, Search
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { TimeRange, filterByTimeRange, parseLocalDate } from '../utils';

// --- TYPES ---
interface TownEntry {
  id: number | string;
  name: string;
  parcels: number;
  date: string;
}

interface TownData {
  entries: TownEntry[];
  lastUpdated: string;
  state?: string;
  country?: string;
}

interface AllTownsData {
  towns: Record<string, TownData>;
  currentTown: string | null;
}

type ViewMode = 'TABLE' | 'CHART';

const STORAGE_KEY = 'atlas_town_data_v2';
const RIVAL_STORAGE_KEY = 'atlas_rival_data_v2';
const USER_KEY = 'atlas_my_username';

// Helper for chart colors
const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
];

// US states for the location picker autocomplete
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming", "District of Columbia"
];

// Seed mapping of common Atlas Earth towns to their states.
// Expand this over time — used to auto-tag existing towns on load and new ones on creation.
const COMMON_TOWN_STATES: Record<string, string> = {
  // Florida
  "St. Petersburg": "Florida",
  "Tampa": "Florida",
  "Orlando": "Florida",
  "Miami": "Florida",
  "Jacksonville": "Florida",
  "Tallahassee": "Florida",
  "Fort Lauderdale": "Florida",
  "Clearwater": "Florida",
  "Sarasota": "Florida",
  "Naples": "Florida",
  "Fort Myers": "Florida",
  "Daytona Beach": "Florida",
  "Gainesville": "Florida",
  "Pensacola": "Florida",
  "Key West": "Florida",
  "Redington Beach": "Florida",
  "North Redington Beach": "Florida",
  "Ocala": "Florida",
  "Lakeland": "Florida",
  "Bradenton": "Florida",
  "Venice": "Florida",
  "Cape Coral": "Florida",
  "West Palm Beach": "Florida",
  "Boca Raton": "Florida",
  // Other common US cities
  "New York": "New York",
  "Los Angeles": "California",
  "Chicago": "Illinois",
  "Houston": "Texas",
  "Phoenix": "Arizona",
  "Philadelphia": "Pennsylvania",
  "San Antonio": "Texas",
  "San Diego": "California",
  "Dallas": "Texas",
  "Austin": "Texas",
  "San Francisco": "California",
  "Seattle": "Washington",
  "Denver": "Colorado",
  "Boston": "Massachusetts",
  "Nashville": "Tennessee",
  "Atlanta": "Georgia",
  "Las Vegas": "Nevada",
  "Portland": "Oregon",
  "Minneapolis": "Minnesota",
  "New Orleans": "Louisiana",
  "Swarthmore": "Pennsylvania",
  "Pittsburgh": "Pennsylvania",
};

// Case-insensitive lookup so "tampa" and "Tampa" both work
const lookupTownState = (townName: string): string | undefined => {
  if (!townName) return undefined;
  const clean = townName.trim();
  if (COMMON_TOWN_STATES[clean]) return COMMON_TOWN_STATES[clean];
  const lower = clean.toLowerCase();
  const match = Object.keys(COMMON_TOWN_STATES).find(k => k.toLowerCase() === lower);
  return match ? COMMON_TOWN_STATES[match] : undefined;
};

export const TownTracker: React.FC = () => {
  // --- STATE ---
  const [data, setData] = useState<AllTownsData>({ towns: {}, currentTown: null });
  const [newTownName, setNewTownName] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  
  // Read Global Username
  const myUsername = useMemo(() => localStorage.getItem(USER_KEY) || 'H1PHOPANONYMOUS', []);

  // Entry Form
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [entryName, setEntryName] = useState('');
  const [entryParcels, setEntryParcels] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  // UI State
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({});

  // Manage Towns State
  const [showManageModal, setShowManageModal] = useState(false);
  const [potentialTowns, setPotentialTowns] = useState<string[]>([]);
  const [selectedTowns, setSelectedTowns] = useState<Set<string>>(new Set());
  const [modalSearch, setModalSearch] = useState('');
  const isInitialized = useRef(false);

  // Location Editor Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationTownName, setLocationTownName] = useState<string>('');
  const [locationState, setLocationState] = useState<string>('');
  const [locationCountry, setLocationCountry] = useState<string>('USA');

// --- PERSISTENCE & MIGRATION ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.towns) {
          Object.entries(parsed.towns).forEach(([townName, town]: [string, any]) => {
            // Ensure every entry has an id
            if (town.entries) {
              town.entries.forEach((e: any, idx: number) => {
                if (!e.id) e.id = Date.now() + idx; 
              });
            }
            // Migration: default country to USA if missing
            if (!town.country) town.country = 'USA';
            // Migration: auto-fill state from the common-towns lookup when possible
            if (!town.state) {
              const guess = lookupTownState(townName);
              if (guess) town.state = guess;
            }
          });
        }
        setData(parsed);
      } catch (e) { console.error(e); }
    } else {
      setData({ 
        towns: { 
          'St. Petersburg': { 
            entries: [], 
            lastUpdated: new Date().toISOString(),
            state: 'Florida',
            country: 'USA'
          } 
        }, 
        currentTown: 'St. Petersburg' 
      });
    }
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

const addTown = () => {
    const trimmed = newTownName.trim();
    if (!trimmed) return;
    if (data.towns[trimmed]) { alert('Town exists'); return; }
    
    const guessedState = lookupTownState(trimmed);
    setData(prev => ({
      ...prev,
      towns: { 
        ...prev.towns, 
        [trimmed]: { 
          entries: [], 
          lastUpdated: new Date().toISOString(),
          state: guessedState,
          country: 'USA'
        } 
      },
      currentTown: trimmed
    }));
    setNewTownName('');
  };

  const deleteCurrentTown = () => {
    if (!data.currentTown) return;
    if (!window.confirm(`Delete ${data.currentTown}?`)) return;
    
    const newTowns = { ...data.towns };
    delete newTowns[data.currentTown];
    const nextTown = Object.keys(newTowns).sort()[0] || null;
    setData({ towns: newTowns, currentTown: nextTown });
  };

  const handleSaveEntry = () => {
    if (!data.currentTown || !entryName || !entryParcels) return;
    const cleanName = entryName.trim().toUpperCase();

    const newEntry: TownEntry = {
      id: editingId || Date.now(),
      name: cleanName,
      parcels: parseInt(entryParcels),
      date: entryDate
    };

    const currentList = data.towns[data.currentTown].entries;
    let updatedEntries;
    if (editingId) {
       updatedEntries = currentList.map(e => String(e.id) === String(editingId) ? newEntry : e);
    } else {
       updatedEntries = [...currentList, newEntry];
    }
    
    setData(prev => ({
      ...prev,
      towns: {
        ...prev.towns,
        [prev.currentTown!]: { entries: updatedEntries, lastUpdated: new Date().toISOString() }
      }
    }));

    setEntryName('');
    setEntryParcels('');
    setEditingId(null);
  };

  const startEditing = (entry: TownEntry) => {
     setEditingId(entry.id);
     setEntryName(entry.name);
     setEntryParcels(entry.parcels.toString());
     setEntryDate(entry.date);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
     setEditingId(null);
     setEntryName('');
     setEntryParcels('');
     setEntryDate(new Date().toISOString().split('T')[0]);
  };

  const deleteSpecificEntry = (id: number | string) => {
     if (!data.currentTown) return;
     if (!window.confirm("Delete this entry?")) return;
     const currentList = data.towns[data.currentTown].entries;
     const updatedEntries = currentList.filter(e => String(e.id) !== String(id));
     setData(prev => ({
       ...prev,
       towns: {
         ...prev.towns,
         [prev.currentTown!]: { entries: updatedEntries, lastUpdated: new Date().toISOString() }
       }
     }));
     if (editingId === id) cancelEditing();
  };

  const toggleExpandPlayer = (playerName: string) => {
    setExpandedPlayers(prev => ({ ...prev, [playerName]: !prev[playerName] }));
  };

  const openManageModal = () => {
    const rivalSaved = localStorage.getItem(RIVAL_STORAGE_KEY);
    const foundTowns = new Set<string>();
    
    if (rivalSaved) {
      try {
        const parsed = JSON.parse(rivalSaved);
        if (parsed.rivals) {
          Object.values(parsed.rivals).forEach((entries: any) => {
            entries.forEach((e: any) => {
              if (e.entryType === 'TOWN' && e.townName) {
                foundTowns.add(e.townName.trim());
              }
            });
          });
        }
      } catch (e) { console.error(e); }
    }
    
    const sortedTowns = Array.from(foundTowns).sort();
    setPotentialTowns(sortedTowns);
    
    const currentSelection = new Set<string>();
    Object.keys(data.towns).forEach(t => currentSelection.add(t));
    setSelectedTowns(currentSelection);
    setShowManageModal(true);
  };

  const executeManage = () => {
    const newTowns = { ...data.towns };
    let changes = false;
    
// Add selected towns that aren't already there
    selectedTowns.forEach(t => {
      if (!newTowns[t]) {
        newTowns[t] = { 
          entries: [], 
          lastUpdated: new Date().toISOString(),
          state: lookupTownState(t),
          country: 'USA'
        };
        changes = true;
      }
    });
    
    // Remove towns that were deselected (optional - Manage Rivals does this)
    // Actually, Manage Rivals only removes if they were in the potential list but not selected.
    potentialTowns.forEach(t => {
      if (!selectedTowns.has(t) && newTowns[t]) {
        delete newTowns[t];
        changes = true;
      }
    });

    if (changes) {
      let nextTown = data.currentTown;
      if (data.currentTown && !newTowns[data.currentTown]) {
        nextTown = Object.keys(newTowns).sort()[0] || null;
      }
      setData(prev => ({ ...prev, towns: newTowns, currentTown: nextTown || prev.currentTown }));
    }
    setShowManageModal(false);
  };

const toggleTownSelection = (name: string) => {
    const newSet = new Set(selectedTowns);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setSelectedTowns(newSet);
  };

  // --- LOCATION EDITOR ---
  const openLocationEditor = () => {
    if (!data.currentTown) return;
    const town = data.towns[data.currentTown];
    setLocationTownName(data.currentTown);
    setLocationState(town?.state || '');
    setLocationCountry(town?.country || 'USA');
    setShowLocationModal(true);
  };

  const saveLocation = () => {
    if (!locationTownName || !data.towns[locationTownName]) {
      setShowLocationModal(false);
      return;
    }
    setData(prev => ({
      ...prev,
      towns: {
        ...prev.towns,
        [locationTownName]: {
          ...prev.towns[locationTownName],
          state: locationState.trim() || undefined,
          country: locationCountry.trim() || 'USA',
          lastUpdated: new Date().toISOString()
        }
      }
    }));
    setShowLocationModal(false);
  };

  // --- LEADERBOARD & TREND LOGIC ---
  const currentEntries = data.currentTown ? data.towns[data.currentTown].entries : [];

  const playerHistory = useMemo(() => {
    const history: Record<string, TownEntry[]> = {};
    currentEntries.forEach(e => {
      const cleanName = e.name.trim(); 
      if (!history[cleanName]) history[cleanName] = [];
      history[cleanName].push({ ...e, name: cleanName });
    });
    
    Object.keys(history).forEach(name => {
      history[name].sort((a,b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          const idA = typeof a.id === 'number' ? a.id : 0;
          const idB = typeof b.id === 'number' ? b.id : 0;
          return idB - idA;
      });
    });
    return history;
  }, [currentEntries]);

  const currentLeaderboard = useMemo(() => {
    return Object.keys(playerHistory).map(name => {
      return playerHistory[name][0];
    }).sort((a,b) => b.parcels - a.parcels);
  }, [playerHistory]);

  const prevLeaderboard = useMemo(() => {
    return Object.keys(playerHistory).map(name => {
      const history = playerHistory[name];
      return history.length > 1 ? history[1] : history[0];
    }).sort((a,b) => b.parcels - a.parcels);
  }, [playerHistory]);

  // --- CHART DATA PROCESSING ---
  const filteredChartEntries = useMemo(() => {
    return filterByTimeRange(currentEntries, 'date', timeRange);
  }, [currentEntries, timeRange]);
  const chartData = useMemo(() => {
    if (filteredChartEntries.length === 0) return [];
    
    // Get all unique dates within the filtered range
    const allDatesSet = new Set<string>();
    filteredChartEntries.forEach(e => allDatesSet.add(e.date));
    const sortedDates = Array.from(allDatesSet).sort((a, b) => parseLocalDate(a).getTime() - parseLocalDate(b).getTime());
    
    // Players to show (Top 10 current)
    const topPlayerNames = currentLeaderboard.slice(0, 10).map(p => p.name);
    
    return sortedDates.map(date => {
      const entry: any = { date };
      topPlayerNames.forEach(name => {
        // Find most recent entry for this player on or before this date
        // We look at the full playerHistory to ensure we have the correct "current" count even if not updated today
        const history = [...playerHistory[name]].reverse(); // Chronological
        const latestOnOrBefore = history.filter(h => parseLocalDate(h.date) <= parseLocalDate(date)).pop();
        if (latestOnOrBefore) {
          entry[name] = latestOnOrBefore.parcels;
        }
      });
      return entry;
    });
  }, [filteredChartEntries, currentLeaderboard, playerHistory]);

  const getRank = (list: TownEntry[], name: string) => {
    const idx = list.findIndex(e => e.name === name);
    return idx === -1 ? null : idx + 1;
  };

  const myCurrentRank = getRank(currentLeaderboard, myUsername);
  const myEntry = myCurrentRank ? currentLeaderboard[myCurrentRank - 1] : null;
  const mayorEntry = currentLeaderboard.length > 0 ? currentLeaderboard[0] : null;

  let parcelsForMayor = 0;
  let parcelsForNextRank = 0;
  let nextRankName = "";

  if (myEntry) {
    if (mayorEntry && myEntry.name !== mayorEntry.name) {
      parcelsForMayor = (mayorEntry.parcels - myEntry.parcels) + 1;
    }
    if (myCurrentRank && myCurrentRank > 1) {
      const targetEntry = currentLeaderboard[myCurrentRank - 2]; 
      parcelsForNextRank = (targetEntry.parcels - myEntry.parcels) + 1;
      nextRankName = targetEntry.name;
    }
  } else if (mayorEntry) {
    parcelsForMayor = mayorEntry.parcels + 1;
  }

  const existingNames = Object.keys(playerHistory).sort();

  return (
    <div className="space-y-6">
      {/* Location Editor Modal */}
      {showLocationModal && (
        <div 
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowLocationModal(false)}
        >
          <div 
            className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <MapPin className="text-purple-400" size={20} /> Edit Town Location
              </h3>
              <button onClick={() => setShowLocationModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              Tag <span className="text-white font-bold">{locationTownName}</span> with its state and country. Used later for leaderboard rollups.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label>
                <input
                  type="text"
                  value={locationCountry}
                  onChange={(e) => setLocationCountry(e.target.value)}
                  placeholder="USA"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  State / Region
                </label>
                <input
                  type="text"
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  list="state-suggestions"
                  placeholder={locationCountry.trim().toUpperCase() === 'USA' ? 'e.g., Florida' : 'e.g., Île-de-France'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-purple-500"
                />
                {locationCountry.trim().toUpperCase() === 'USA' && (
                  <datalist id="state-suggestions">
                    {US_STATES.map(s => <option key={s} value={s} />)}
                  </datalist>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => setShowLocationModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveLocation}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-bold transition-colors"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      {showManageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-purple-400" /> Manage Towns
                </h3>
                <p className="text-xs text-slate-500">Import towns from your Rival Tracker entries.</p>
              </div>
              <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            
            <div className="p-4 border-b border-slate-700 bg-slate-900/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search potential towns..." 
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-slate-900/30">
              {potentialTowns.filter(t => t.toLowerCase().includes(modalSearch.toLowerCase())).length === 0 ? (
                <div className="text-center p-12 text-slate-500">
                  <Search className="mx-auto opacity-10 mb-2" size={48} />
                  <p>No new towns found in Rival Tracker.</p>
                </div>
              ) : (
                potentialTowns.filter(t => t.toLowerCase().includes(modalSearch.toLowerCase())).map(t => {
                  const isSelected = selectedTowns.has(t);
                  return (
                    <div 
                      key={t} 
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'bg-purple-900/30 border-purple-500/50 shadow-inner' : 'bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}
                      onClick={() => toggleTownSelection(t)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-500 bg-slate-800'}`}>
                          {isSelected && <Check size={16} className="text-white" />}
                        </div>
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{t}</span>
                      </div>
                      {isSelected && <span className="text-[10px] font-bold text-purple-400 uppercase">Tracked</span>}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono font-bold">{selectedTowns.size} towns selected</span>
              <div className="flex gap-2">
                <button onClick={() => setShowManageModal(false)} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-bold">Cancel</button>
                <button onClick={executeManage} className="px-6 py-2 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-xl transition-all active:scale-95">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
         <div className="flex flex-col gap-2 w-full md:w-auto">
           <div className="flex items-center gap-3 w-full md:w-auto">
              <MapPin className="text-purple-400 flex-shrink-0" />
              <select 
                className="bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold cursor-pointer outline-none focus:ring-2 focus:ring-purple-500 flex-1 md:flex-none"
                value={data.currentTown || ''}
                onChange={(e) => setData(prev => ({ ...prev, currentTown: e.target.value }))}
              >
                {Object.keys(data.towns).sort().map(t => {
                  const needsTag = !data.towns[t].state;
                  return <option key={t} value={t}>{needsTag ? '⚠️ ' : ''}{t}</option>;
                })}
              </select>
           </div>
           {/* Location badge / editor trigger */}
           {data.currentTown && (() => {
              const town = data.towns[data.currentTown];
              const hasState = Boolean(town?.state);
              return (
                <button 
                  onClick={openLocationEditor}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-md ml-7 transition-colors ${
                    hasState 
                      ? 'text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-700 border border-slate-700' 
                      : 'text-amber-400 hover:text-white bg-amber-900/20 hover:bg-amber-600/30 border border-amber-500/30'
                  }`}
                  title="Edit town location"
                >
                  <MapPin size={12} />
                  {hasState 
                    ? `${town.state}, ${town.country || 'USA'}` 
                    : 'Set state / country'}
                  <Pencil size={11} className="opacity-60" />
                </button>
              );
           })()}
         </div>

         <div className="flex gap-2 w-full md:w-auto items-center">
            <button 
              onClick={openManageModal}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-purple-400 py-2 px-3 rounded text-xs font-bold uppercase border border-purple-500/20 transition-colors"
            >
              <Users size={16} /> Manage Towns
            </button>
            <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block"></div>
            <input 
              type="text" 
              placeholder="New Town Name" 
              value={newTownName}
              onChange={e => setNewTownName(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white w-full md:w-40 outline-none focus:border-purple-500"
            />
            <button onClick={addTown} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded shrink-0"><PlusCircle size={18}/></button>
            <button onClick={deleteCurrentTown} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded shrink-0"><Trash2 size={18}/></button>
         </div>
      </div>

      {data.currentTown && mayorEntry && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-900/40 to-slate-800 p-4 rounded-xl border border-yellow-500/30 flex items-center gap-4 shadow-lg">
             <div className="bg-yellow-500/20 p-3 rounded-full text-yellow-400">
                <Crown size={24} />
             </div>
             <div>
                <div className="text-yellow-500 text-xs font-bold uppercase tracking-wider">Current Mayor</div>
                <div className="text-white font-bold text-lg truncate max-w-[200px]">{mayorEntry.name}</div>
                <div className="text-slate-300 font-mono text-sm">{mayorEntry.parcels} Parcels</div>
             </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 shadow-lg">
             <div className="bg-blue-500/20 p-3 rounded-full text-blue-400">
                <Target size={24} />
             </div>
             <div>
                <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">Next Rank Target</div>
                {myCurrentRank && myCurrentRank > 1 ? (
                   <>
                     <div className="text-white font-bold text-lg">+{parcelsForNextRank} Parcels</div>
                     <div className="text-slate-400 text-xs">to overtake {nextRankName}</div>
                   </>
                ) : myCurrentRank === 1 ? (
                  <div className="text-white font-bold text-sm">You are in the lead!</div>
                ) : (
                  <div className="text-slate-500 text-sm">Add your data to see targets</div>
                )}
             </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 shadow-lg">
             <div className="bg-purple-500/20 p-3 rounded-full text-purple-400">
                <Trophy size={24} />
             </div>
             <div>
                <div className="text-purple-400 text-xs font-bold uppercase tracking-wider">To Be Mayor</div>
                {myCurrentRank === 1 ? (
                   <div className="text-green-400 font-bold text-lg">You are Mayor!</div>
                ) : (
                   <>
                     <div className="text-white font-bold text-lg">+{parcelsForMayor} Parcels</div>
                     <div className="text-slate-400 text-xs">to take Rank #1</div>
                   </>
                )}
             </div>
          </div>
        </div>
      )}

      {data.currentTown && (
        <div className={`p-6 rounded-xl border shadow transition-all duration-300 ${editingId ? 'bg-slate-800 border-orange-500/50' : 'bg-slate-800 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                 {editingId ? <Pencil className="text-orange-500" /> : <PlusCircle className="text-green-500" />}
                 <h3 className="text-white font-bold">{editingId ? 'Edit Entry' : 'Update Player Data'}</h3>
             </div>
             {editingId && (
                 <button onClick={cancelEditing} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm bg-slate-700 px-3 py-1 rounded">
                     <X size={14} /> Cancel Edit
                 </button>
             )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500" />
             <div>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={entryName} 
                  onChange={e => setEntryName(e.target.value)} 
                  list="player-names"
                  className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500 w-full" 
                />
                <datalist id="player-names">
                    {existingNames.map(name => <option key={name} value={name} />)}
                </datalist>
             </div>
             <input type="number" placeholder="Parcels" value={entryParcels} onChange={e => setEntryParcels(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500" />
             <button 
                onClick={handleSaveEntry} 
                className={`font-bold rounded shadow-lg transition-transform active:scale-95 text-white flex items-center justify-center gap-2 ${editingId ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'}`}
             >
                {editingId ? <Save size={18} /> : <PlusCircle size={18} />}
                {editingId ? "Update Entry" : "Add Update"}
             </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
        <div className="p-4 bg-slate-900 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
           <span className="text-white font-bold flex items-center gap-2">
             <MapPin size={16} /> Leaderboard History: {data.currentTown}
           </span>
           
           <div className="flex items-center gap-4">
              {/* Range Toggles (YTD & ALL only) */}
              <div className="flex items-center gap-3 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Range</span>
                <div className="flex gap-1 pr-1">
                  {(['WTD', 'MTD', 'YTD', 'ALL'] as TimeRange[]).map((range) => (
                    <button 
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button 
                  onClick={() => setViewMode('TABLE')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'TABLE' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <LayoutList size={14} /> Table
                </button>
                <button 
                  onClick={() => setViewMode('CHART')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'CHART' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <ChartIcon size={14} /> Chart
                </button>
              </div>
           </div>
        </div>

        <div className="p-4 bg-slate-800">
          {viewMode === 'TABLE' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Player</th>
                      <th className="p-4">Parcels</th>
                      <th className="p-4">History</th>
                      <th className="p-4 text-right">Latest Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {currentLeaderboard.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No data for this town yet.</td></tr>
                    ) : (
                      currentLeaderboard.map((entry, idx) => {
                        const rank = idx + 1;
                        const prevRank = getRank(prevLeaderboard, entry.name);
                        const isExpanded = expandedPlayers[entry.name];
                        const history = playerHistory[entry.name];
                        const hasHistory = history.length > 1;
                        
                        let rankIcon = <Minus size={14} className="text-slate-600" />;
                        if (!hasHistory) {
                           rankIcon = <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded uppercase">New</span>;
                        } else if (prevRank && prevRank > rank) {
                           rankIcon = <div className="flex items-center text-green-400"><ArrowUp size={14} /><span className="text-xs">{prevRank - rank}</span></div>;
                        } else if (prevRank && prevRank < rank) {
                           rankIcon = <div className="flex items-center text-red-400"><ArrowDown size={14} /><span className="text-xs">{rank - prevRank}</span></div>;
                        }

                        let rankClass = "text-slate-300 font-mono";
                        if (rank === 1) rankClass = "text-yellow-400 font-bold text-lg";
                        if (rank === 2) rankClass = "text-slate-300 font-bold text-lg";
                        if (rank === 3) rankClass = "text-orange-400 font-bold text-lg";

                        const isMe = entry.name.toLowerCase() === myUsername.toLowerCase();
                        const rowClass = isMe ? "bg-blue-900/20 border-l-4 border-blue-500" : "hover:bg-slate-700/30 border-l-4 border-transparent";

                        return (
                          <React.Fragment key={entry.name}>
                            <tr 
                                className={`transition-colors cursor-pointer ${rowClass} ${isExpanded ? 'bg-slate-700/50' : ''}`}
                                onClick={() => toggleExpandPlayer(entry.name)}
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <span className={rankClass}>#{rank}</span>
                                        {rankIcon}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                    {rank === 1 && <Crown size={14} className="text-yellow-500" />}
                                    <span className={`font-bold ${isMe ? 'text-blue-400' : 'text-white'}`}>{entry.name}</span>
                                    {isMe && <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded-full uppercase font-bold">You</span>}
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-green-400 font-bold text-lg">{entry.parcels}</td>
                                <td className="p-4 text-xs text-slate-500 flex items-center gap-1">
                                    <History size={14} /> {history.length}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-sm text-slate-400 font-mono">{entry.date}</span>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </div>
                                </td>
                            </tr>
                            {isExpanded && (
                               <tr className="bg-slate-900/50 animate-fade-in">
                                  <td colSpan={5} className="p-0">
                                     <div className="border-t border-slate-700 p-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-1 flex items-center gap-2">
                                            <History size={14}/> Entry History: <span className="text-white">{entry.name}</span>
                                        </h4>
                                        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-900 text-slate-400 font-bold">
                                                    <tr>
                                                        <th className="p-3 text-left">Date Recorded</th>
                                                        <th className="p-3 text-left">Parcels</th>
                                                        <th className="p-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-700">
                                                    {history.map((hist) => (
                                                        <tr key={hist.id} className={`hover:bg-slate-700/50 ${String(editingId) === String(hist.id) ? 'bg-orange-500/10' : ''}`}>
                                                            <td className="p-3 text-slate-300 font-mono">{hist.date}</td>
                                                            <td className="p-3 text-green-400 font-bold font-mono">{hist.parcels}</td>
                                                            <td className="p-3 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={(e) => { e.stopPropagation(); startEditing(hist); }} className="p-1.5 rounded hover:bg-slate-700 text-blue-400 transition-colors"><Pencil size={14} /></button>
                                                                    <button onClick={(e) => { e.stopPropagation(); deleteSpecificEntry(hist.id); }} className="p-1.5 rounded hover:bg-slate-700 text-red-400 transition-colors"><Trash2 size={14} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                     </div>
                                  </td>
                               </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-96 w-full min-w-0 bg-slate-900/50 p-6 rounded-xl border border-slate-700 shadow-inner">
               {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                       <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickFormatter={(str) => {
                             const parts = str.split('-');
                             return parts.length > 2 ? `${parts[1]}/${parts[2]}` : str;
                          }}
                       />
                       <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} 
                          labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                       />
                       <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                       {currentLeaderboard.slice(0, 10).map((p, idx) => (
                         <Line 
                            key={p.name} 
                            type="monotone" 
                            dataKey={p.name} 
                            stroke={COLORS[idx % COLORS.length]} 
                            strokeWidth={p.name.toLowerCase() === myUsername.toLowerCase() ? 4 : 2}
                            dot={{ r: p.name.toLowerCase() === myUsername.toLowerCase() ? 4 : 2 }}
                            activeDot={{ r: 6 }}
                            connectNulls
                         />
                       ))}
                    </LineChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <History size={48} className="opacity-10 mb-4" />
                    <p>Insufficient data to generate history chart for the selected range.</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
