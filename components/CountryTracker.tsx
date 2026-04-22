
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trash2, PlusCircle, Globe, Trophy, ArrowUp, ArrowDown, Minus, Crown, Target, 
  ChevronDown, ChevronUp, Pencil, Save, X, History, LayoutList, LineChart as ChartIcon,
  Users, Check, Search
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { TimeRange, filterByTimeRange, parseLocalDate } from '../utils';

// --- TYPES ---
interface CountryEntry {
  id: number | string;
  name: string;
  parcels: number;
  date: string;
}

interface CountryData {
  entries: CountryEntry[];
  lastUpdated: string;
}

interface AllCountriesData {
  countries: Record<string, CountryData>;
  currentCountry: string | null;
}

type ViewMode = 'TABLE' | 'CHART';

const STORAGE_KEY = 'atlas_country_data_v2';
const RIVAL_STORAGE_KEY = 'atlas_rival_data_v2';
const USER_KEY = 'atlas_my_username';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
];

export const CountryTracker: React.FC = () => {
  const [data, setData] = useState<AllCountriesData>({ countries: {}, currentCountry: null });
  const [newCountryName, setNewCountryName] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  
  const myUsername = useMemo(() => localStorage.getItem(USER_KEY) || 'H1PHOPANONYMOUS', []);

  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [entryName, setEntryName] = useState('');
  const [entryParcels, setEntryParcels] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({});

  const [showManageModal, setShowManageModal] = useState(false);
  const [potentialCountries, setPotentialCountries] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [modalSearch, setModalSearch] = useState('');
  const isInitialized = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (e) { console.error(e); }
    } else {
      setData({ countries: { 'USA': { entries: [], lastUpdated: new Date().toISOString() } }, currentCountry: 'USA' });
    }
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const addCountry = () => {
    if (!newCountryName.trim()) return;
    if (data.countries[newCountryName]) { alert('Country exists'); return; }
    
    setData(prev => ({
      ...prev,
      countries: { ...prev.countries, [newCountryName]: { entries: [], lastUpdated: new Date().toISOString() } },
      currentCountry: newCountryName
    }));
    setNewCountryName('');
  };

  const deleteCurrentCountry = () => {
    if (!data.currentCountry) return;
    if (!window.confirm(`Delete ${data.currentCountry}?`)) return;
    
    const newCountries = { ...data.countries };
    delete newCountries[data.currentCountry];
    const nextCountry = Object.keys(newCountries).sort()[0] || null;
    setData({ countries: newCountries, currentCountry: nextCountry });
  };

  const handleSaveEntry = () => {
    if (!data.currentCountry || !entryName || !entryParcels) return;
    const cleanName = entryName.trim().toUpperCase();

    const newEntry: CountryEntry = {
      id: editingId || Date.now(),
      name: cleanName,
      parcels: parseInt(entryParcels),
      date: entryDate
    };

    const currentList = data.countries[data.currentCountry].entries;
    let updatedEntries;
    if (editingId) {
       updatedEntries = currentList.map(e => String(e.id) === String(editingId) ? newEntry : e);
    } else {
       updatedEntries = [...currentList, newEntry];
    }
    
    setData(prev => ({
      ...prev,
      countries: {
        ...prev.countries,
        [prev.currentCountry!]: { entries: updatedEntries, lastUpdated: new Date().toISOString() }
      }
    }));

    setEntryName('');
    setEntryParcels('');
    setEditingId(null);
  };

  const startEditing = (entry: CountryEntry) => {
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
     if (!data.currentCountry) return;
     if (!window.confirm("Delete this entry?")) return;
     const currentList = data.countries[data.currentCountry].entries;
     const updatedEntries = currentList.filter(e => String(e.id) !== String(id));
     setData(prev => ({
       ...prev,
       countries: {
         ...prev.countries,
         [prev.currentCountry!]: { entries: updatedEntries, lastUpdated: new Date().toISOString() }
       }
     }));
     if (editingId === id) cancelEditing();
  };

  const toggleExpandPlayer = (playerName: string) => {
    setExpandedPlayers(prev => ({ ...prev, [playerName]: !prev[playerName] }));
  };

  const openManageModal = () => {
    const rivalSaved = localStorage.getItem(RIVAL_STORAGE_KEY);
    const found = new Set<string>();
    
    if (rivalSaved) {
      try {
        const parsed = JSON.parse(rivalSaved);
        if (parsed.rivals) {
          Object.values(parsed.rivals).forEach((entries: any) => {
            entries.forEach((e: any) => {
              if (e.entryType === 'COUNTRY' && e.townName) {
                found.add(e.townName.trim());
              }
            });
          });
        }
      } catch (e) { console.error(e); }
    }
    
    const sorted = Array.from(found).sort();
    setPotentialCountries(sorted);
    
    const currentSelection = new Set<string>();
    Object.keys(data.countries).forEach(t => currentSelection.add(t));
    setSelectedCountries(currentSelection);
    setShowManageModal(true);
  };

  const executeManage = () => {
    const newCountries = { ...data.countries };
    let changes = false;
    
    selectedCountries.forEach(t => {
      if (!newCountries[t]) {
        newCountries[t] = { entries: [], lastUpdated: new Date().toISOString() };
        changes = true;
      }
    });
    
    potentialCountries.forEach(t => {
      if (!selectedCountries.has(t) && newCountries[t]) {
        delete newCountries[t];
        changes = true;
      }
    });

    if (changes) {
      let next = data.currentCountry;
      if (data.currentCountry && !newCountries[data.currentCountry]) {
        next = Object.keys(newCountries).sort()[0] || null;
      }
      setData(prev => ({ ...prev, countries: newCountries, currentCountry: next || prev.currentCountry }));
    }
    setShowManageModal(false);
  };

  const toggleSelection = (name: string) => {
    const newSet = new Set(selectedCountries);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setSelectedCountries(newSet);
  };

  const currentEntries = data.currentCountry ? data.countries[data.currentCountry].entries : [];

  const playerHistory = useMemo(() => {
    const history: Record<string, CountryEntry[]> = {};
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
    return Object.keys(playerHistory).map(name => playerHistory[name][0]).sort((a,b) => b.parcels - a.parcels);
  }, [playerHistory]);

  const prevLeaderboard = useMemo(() => {
    return Object.keys(playerHistory).map(name => {
      const history = playerHistory[name];
      return history.length > 1 ? history[1] : history[0];
    }).sort((a,b) => b.parcels - a.parcels);
  }, [playerHistory]);

  const filteredChartEntries = useMemo(() => {
    return filterByTimeRange(currentEntries, 'date', timeRange);
  }, [currentEntries, timeRange]);

  const chartData = useMemo(() => {
    if (filteredChartEntries.length === 0) return [];
    const allDatesSet = new Set<string>();
    filteredChartEntries.forEach(e => allDatesSet.add(e.date));
    const sortedDates = Array.from(allDatesSet).sort((a, b) => parseLocalDate(a).getTime() - parseLocalDate(b).getTime());
    const topPlayerNames = currentLeaderboard.slice(0, 10).map(p => p.name);
    
    return sortedDates.map(date => {
      const entry: any = { date };
      topPlayerNames.forEach(name => {
        const history = [...playerHistory[name]].reverse();
        const latestOnOrBefore = history.filter(h => parseLocalDate(h.date) <= parseLocalDate(date)).pop();
        if (latestOnOrBefore) entry[name] = latestOnOrBefore.parcels;
      });
      return entry;
    });
  }, [filteredChartEntries, currentLeaderboard, playerHistory]);

  const getRank = (list: CountryEntry[], name: string) => {
    const idx = list.findIndex(e => e.name === name);
    return idx === -1 ? null : idx + 1;
  };

  const myCurrentRank = getRank(currentLeaderboard, myUsername);
  const myEntry = myCurrentRank ? currentLeaderboard[myCurrentRank - 1] : null;
  const presidentEntry = currentLeaderboard.length > 0 ? currentLeaderboard[0] : null;

  let parcelsForPresident = 0;
  let parcelsForNextRank = 0;
  let nextRankName = "";

  if (myEntry) {
    if (presidentEntry && myEntry.name !== presidentEntry.name) {
      parcelsForPresident = (presidentEntry.parcels - myEntry.parcels) + 1;
    }
    if (myCurrentRank && myCurrentRank > 1) {
      const targetEntry = currentLeaderboard[myCurrentRank - 2]; 
      parcelsForNextRank = (targetEntry.parcels - myEntry.parcels) + 1;
      nextRankName = targetEntry.name;
    }
  } else if (presidentEntry) {
    parcelsForPresident = presidentEntry.parcels + 1;
  }

  const existingNames = Object.keys(playerHistory).sort();

  return (
    <div className="space-y-6">
      {showManageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-emerald-400" /> Manage Countries
                </h3>
                <p className="text-xs text-slate-500">Import countries from your Rival Tracker entries.</p>
              </div>
              <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            
            <div className="p-4 border-b border-slate-700 bg-slate-900/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search potential countries..." 
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-slate-900/30">
              {potentialCountries.filter(t => t.toLowerCase().includes(modalSearch.toLowerCase())).length === 0 ? (
                <div className="text-center p-12 text-slate-500">
                  <Search className="mx-auto opacity-10 mb-2" size={48} />
                  <p>No new countries found in Rival Tracker.</p>
                </div>
              ) : (
                potentialCountries.filter(t => t.toLowerCase().includes(modalSearch.toLowerCase())).map(t => {
                  const isSelected = selectedCountries.has(t);
                  return (
                    <div 
                      key={t} 
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'bg-emerald-900/30 border-emerald-500/50 shadow-inner' : 'bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}
                      onClick={() => toggleSelection(t)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 bg-slate-800'}`}>
                          {isSelected && <Check size={16} className="text-white" />}
                        </div>
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{t}</span>
                      </div>
                      {isSelected && <span className="text-[10px] font-bold text-emerald-400 uppercase">Tracked</span>}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono font-bold">{selectedCountries.size} countries selected</span>
              <div className="flex gap-2">
                <button onClick={() => setShowManageModal(false)} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-bold">Cancel</button>
                <button onClick={executeManage} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl transition-all active:scale-95">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3 w-full md:w-auto">
            <Globe className="text-emerald-400 flex-shrink-0" />
            <select 
              className="bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500 flex-1 md:flex-none"
              value={data.currentCountry || ''}
              onChange={(e) => setData(prev => ({ ...prev, currentCountry: e.target.value }))}
            >
              {Object.keys(data.countries).sort().map(t => <option key={t} value={t}>{t}</option>)}
            </select>
         </div>

         <div className="flex gap-2 w-full md:w-auto items-center">
            <button 
              onClick={openManageModal}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-emerald-400 py-2 px-3 rounded text-xs font-bold uppercase border border-emerald-500/20 transition-colors"
            >
              <Users size={16} /> Manage Countries
            </button>
            <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block"></div>
            <input 
              type="text" 
              placeholder="New Country Name" 
              value={newCountryName}
              onChange={e => setNewCountryName(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white w-full md:w-40 outline-none focus:border-emerald-500"
            />
            <button onClick={addCountry} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded shrink-0"><PlusCircle size={18}/></button>
            <button onClick={deleteCurrentCountry} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded shrink-0"><Trash2 size={18}/></button>
         </div>
      </div>

      {data.currentCountry && presidentEntry && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-900/40 to-slate-800 p-4 rounded-xl border border-yellow-500/30 flex items-center gap-4 shadow-lg">
             <div className="bg-yellow-500/20 p-3 rounded-full text-yellow-400"><Crown size={24} /></div>
             <div>
                <div className="text-yellow-500 text-xs font-bold uppercase tracking-wider">Current President</div>
                <div className="text-white font-bold text-lg truncate max-w-[200px]">{presidentEntry.name}</div>
                <div className="text-slate-300 font-mono text-sm">{presidentEntry.parcels} Parcels</div>
             </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 shadow-lg">
             <div className="bg-blue-500/20 p-3 rounded-full text-blue-400"><Target size={24} /></div>
             <div>
                <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">Next Rank Target</div>
                {myCurrentRank && myCurrentRank > 1 ? (
                   <><div className="text-white font-bold text-lg">+{parcelsForNextRank} Parcels</div><div className="text-slate-400 text-xs">to overtake {nextRankName}</div></>
                ) : myCurrentRank === 1 ? (
                  <div className="text-white font-bold text-sm">You are in the lead!</div>
                ) : (
                  <div className="text-slate-500 text-sm">Add your data to see targets</div>
                )}
             </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 shadow-lg">
             <div className="bg-purple-500/20 p-3 rounded-full text-purple-400"><Trophy size={24} /></div>
             <div>
                <div className="text-purple-400 text-xs font-bold uppercase tracking-wider">To Be President</div>
                {myCurrentRank === 1 ? (
                   <div className="text-green-400 font-bold text-lg">You are President!</div>
                ) : (
                   <><div className="text-white font-bold text-lg">+{parcelsForPresident} Parcels</div><div className="text-slate-400 text-xs">to take Rank #1</div></>
                )}
             </div>
          </div>
        </div>
      )}

      {data.currentCountry && (
        <div className={`p-6 rounded-xl border shadow transition-all duration-300 ${editingId ? 'bg-slate-800 border-orange-500/50' : 'bg-slate-800 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                 {editingId ? <Pencil className="text-orange-500" /> : <PlusCircle className="text-green-500" />}
                 <h3 className="text-white font-bold">{editingId ? 'Edit Entry' : 'Update Player Data'}</h3>
             </div>
             {editingId && <button onClick={cancelEditing} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm bg-slate-700 px-3 py-1 rounded"><X size={14} /> Cancel Edit</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500" />
             <div>
                <input type="text" placeholder="Username" value={entryName} onChange={e => setEntryName(e.target.value)} list="country-player-names" className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500 w-full" />
                <datalist id="country-player-names">{existingNames.map(name => <option key={name} value={name} />)}</datalist>
             </div>
             <input type="number" placeholder="Parcels" value={entryParcels} onChange={e => setEntryParcels(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500" />
             <button onClick={handleSaveEntry} className={`font-bold rounded shadow-lg transition-transform active:scale-95 text-white flex items-center justify-center gap-2 ${editingId ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'}`}>
                {editingId ? <Save size={18} /> : <PlusCircle size={18} />}{editingId ? "Update Entry" : "Add Update"}
             </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
        <div className="p-4 bg-slate-900 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
           <span className="text-white font-bold flex items-center gap-2"><Globe size={16} /> Leaderboard History: {data.currentCountry}</span>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Range</span>
                <div className="flex gap-1 pr-1">
                  {(['WTD', 'MTD', 'YTD', 'ALL'] as TimeRange[]).map((range) => (
                    <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{range}</button>
                  ))}
                </div>
              </div>
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button onClick={() => setViewMode('TABLE')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'TABLE' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><LayoutList size={14} /> Table</button>
                <button onClick={() => setViewMode('CHART')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'CHART' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><ChartIcon size={14} /> Chart</button>
              </div>
           </div>
        </div>

        <div className="p-4 bg-slate-800">
          {viewMode === 'TABLE' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                    <tr><th className="p-4">Rank</th><th className="p-4">Player</th><th className="p-4">Parcels</th><th className="p-4">History</th><th className="p-4 text-right">Latest Date</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {currentLeaderboard.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No data for this country yet.</td></tr>
                    ) : (
                      currentLeaderboard.map((entry, idx) => {
                        const rank = idx + 1;
                        const prevRank = getRank(prevLeaderboard, entry.name);
                        const isExpanded = expandedPlayers[entry.name];
                        const history = playerHistory[entry.name];
                        const hasHistory = history.length > 1;
                        let rankIcon = <Minus size={14} className="text-slate-600" />;
                        if (!hasHistory) rankIcon = <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded uppercase">New</span>;
                        else if (prevRank && prevRank > rank) rankIcon = <div className="flex items-center text-green-400"><ArrowUp size={14} /><span className="text-xs">{prevRank - rank}</span></div>;
                        else if (prevRank && prevRank < rank) rankIcon = <div className="flex items-center text-red-400"><ArrowDown size={14} /><span className="text-xs">{rank - prevRank}</span></div>;
                        const rankClass = rank === 1 ? "text-yellow-400 font-bold text-lg" : rank === 2 ? "text-slate-300 font-bold text-lg" : rank === 3 ? "text-orange-400 font-bold text-lg" : "text-slate-300 font-mono";
                        const isMe = entry.name.toLowerCase() === myUsername.toLowerCase();
                        return (
                          <React.Fragment key={entry.name}>
                            <tr className={`transition-colors cursor-pointer ${isMe ? "bg-blue-900/20 border-l-4 border-blue-500" : "hover:bg-slate-700/30 border-l-4 border-transparent"} ${isExpanded ? 'bg-slate-700/50' : ''}`} onClick={() => toggleExpandPlayer(entry.name)}>
                                <td className="p-4"><div className="flex items-center gap-3"><span className={rankClass}>#{rank}</span>{rankIcon}</div></td>
                                <td className="p-4"><div className="flex items-center gap-2">{rank === 1 && <Crown size={14} className="text-yellow-500" />}<span className={`font-bold ${isMe ? 'text-blue-400' : 'text-white'}`}>{entry.name}</span>{isMe && <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded-full uppercase font-bold">You</span>}</div></td>
                                <td className="p-4 font-mono text-green-400 font-bold text-lg">{entry.parcels}</td>
                                <td className="p-4 text-xs text-slate-500 flex items-center gap-1"><History size={14} /> {history.length}</td>
                                <td className="p-4 text-right flex items-center justify-end gap-2"><span className="text-sm text-slate-400 font-mono">{entry.date}</span>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                            </tr>
                            {isExpanded && (
                               <tr className="bg-slate-900/50 animate-fade-in"><td colSpan={5} className="p-0"><div className="border-t border-slate-700 p-4">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-1 flex items-center gap-2"><History size={14}/> Entry History: <span className="text-white">{entry.name}</span></h4>
                                  <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                                      <table className="w-full text-sm">
                                          <thead className="bg-slate-900 text-slate-400 font-bold"><tr><th className="p-3 text-left">Date Recorded</th><th className="p-3 text-left">Parcels</th><th className="p-3 text-right">Actions</th></tr></thead>
                                          <tbody className="divide-y divide-slate-700">{history.map((hist) => (
                                              <tr key={hist.id} className={`hover:bg-slate-700/50 ${String(editingId) === String(hist.id) ? 'bg-orange-500/10' : ''}`}>
                                                  <td className="p-3 text-slate-300 font-mono">{hist.date}</td>
                                                  <td className="p-3 text-green-400 font-bold font-mono">{hist.parcels}</td>
                                                  <td className="p-3 text-right flex justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); startEditing(hist); }} className="p-1.5 rounded hover:bg-slate-700 text-blue-400 transition-colors"><Pencil size={14} /></button><button onClick={(e) => { e.stopPropagation(); deleteSpecificEntry(hist.id); }} className="p-1.5 rounded hover:bg-slate-700 text-red-400 transition-colors"><Trash2 size={14} /></button></td>
                                              </tr>
                                          ))}</tbody>
                                      </table>
                                  </div>
                               </div></td></tr>
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
                       <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(str) => { const parts = str.split('-'); return parts.length > 2 ? `${parts[1]}/${parts[2]}` : str; }} />
                       <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }} />
                       <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                       {currentLeaderboard.slice(0, 10).map((p, idx) => (
                         <Line key={p.name} type="monotone" dataKey={p.name} stroke={COLORS[idx % COLORS.length]} strokeWidth={p.name.toLowerCase() === myUsername.toLowerCase() ? 4 : 2} dot={{ r: p.name.toLowerCase() === myUsername.toLowerCase() ? 4 : 2 }} activeDot={{ r: 6 }} connectNulls />
                       ))}
                    </LineChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500"><History size={48} className="opacity-10 mb-4" /><p>Insufficient data to generate history chart for the selected range.</p></div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
