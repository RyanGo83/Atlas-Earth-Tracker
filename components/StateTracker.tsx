
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, PlusCircle, Map, Trophy, ArrowUp, ArrowDown, Minus, Crown, Target, ChevronDown, ChevronUp, Pencil, Save, X, History, Users, Check, Search } from 'lucide-react';

// --- TYPES ---
interface StateEntry {
  id: string;
  name: string;
  rank?: number | null;
  parcels: number;
  date: string;
}

interface StateData {
  entries: StateEntry[];
  lastUpdated: string;
}

interface AllStatesData {
  states: Record<string, StateData>;
  currentState: string | null;
}

const STORAGE_KEY = 'atlas_state_data_v2';
const RIVAL_STORAGE_KEY = 'atlas_rival_data_v2';
const USER_KEY = 'atlas_my_username';

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const StateTracker: React.FC = () => {
  const [data, setData] = useState<AllStatesData>({ states: {}, currentState: null });
  const [newStateName, setNewStateName] = useState('');
  
  // Read Global Username
  const myUsername = useMemo(() => localStorage.getItem(USER_KEY) || 'H1PHOPANONYMOUS', []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryName, setEntryName] = useState('');
  const [entryRank, setEntryRank] = useState('');
  const [entryParcels, setEntryParcels] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toLocaleDateString('en-CA'));

  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({});

  // Manage States State
  const [showManageModal, setShowManageModal] = useState(false);
  const [potentialStates, setPotentialStates] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [modalSearch, setModalSearch] = useState('');
  const isInitialized = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    // Create base template with all 50 states
    const baseStates: Record<string, StateData> = {};
    const now = new Date().toISOString();
    US_STATES.forEach(s => {
      baseStates[s] = { entries: [], lastUpdated: now };
    });

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge base template with saved data (saved data overwrites base template)
        const mergedStates = { ...baseStates, ...parsed.states };
        setData({ 
          states: mergedStates, 
          currentState: parsed.currentState || 'Florida' 
        });
      } catch (e) { 
        console.error("Error parsing saved state data", e);
        setData({ states: baseStates, currentState: 'Florida' });
      }
    } else {
      setData({ states: baseStates, currentState: 'Florida' });
    }
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const addState = () => {
    const name = newStateName.trim();
    if (!name) return;
    if (data.states[name]) { alert('State/Territory already exists in the list.'); return; }
    
    setData(prev => ({
      ...prev,
      states: { ...prev.states, [name]: { entries: [], lastUpdated: new Date().toISOString() } },
      currentState: name
    }));
    setNewStateName('');
  };

  const deleteCurrentState = () => {
    if (!data.currentState) return;
    if (!window.confirm(`Are you sure you want to remove ${data.currentState} from the tracker? This will delete all history for this state.`)) return;
    const newStates = { ...data.states };
    delete newStates[data.currentState];
    const nextState = Object.keys(newStates).sort()[0] || null;
    setData({ states: newStates, currentState: nextState });
  };

  const handleSaveEntry = () => {
    if (!data.currentState || !entryName.trim() || !entryParcels) return;
    
    const newEntry: StateEntry = {
      id: editingId || generateId(),
      name: entryName.trim().toUpperCase(),
      rank: entryRank ? parseInt(entryRank) : null,
      parcels: parseInt(entryParcels),
      date: entryDate
    };

    const currentList = data.states[data.currentState].entries;
    let updatedEntries;
    if (editingId) {
       updatedEntries = currentList.map(e => e.id === editingId ? newEntry : e);
    } else {
       updatedEntries = [...currentList, newEntry];
    }
    
    setData(prev => ({
      ...prev,
      states: {
        ...prev.states,
        [prev.currentState!]: { entries: updatedEntries, lastUpdated: new Date().toISOString() }
      }
    }));
    cancelEditing();
  };

  const startEditing = (entry: StateEntry) => {
     setEditingId(entry.id);
     setEntryName(entry.name);
     setEntryRank(entry.rank ? entry.rank.toString() : '');
     setEntryParcels(entry.parcels.toString());
     setEntryDate(entry.date);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
     setEditingId(null);
     setEntryName('');
     setEntryRank('');
     setEntryParcels('');
     setEntryDate(new Date().toLocaleDateString('en-CA'));
  };

  const deleteSpecificEntry = (id: string) => {
     if (!data.currentState) return;
     if (!window.confirm("Delete this entry?")) return;
     const currentList = data.states[data.currentState].entries;
     const updatedEntries = currentList.filter(e => e.id !== id);
     setData(prev => ({ ...prev, states: { ...prev.states, [prev.currentState!]: { entries: updatedEntries, lastUpdated: new Date().toISOString() } } }));
     if (editingId === id) cancelEditing();
  };

  const openManageModal = () => {
    const rivalSaved = localStorage.getItem(RIVAL_STORAGE_KEY);
    const foundStates = new Set<string>();
    
    if (rivalSaved) {
      try {
        const parsed = JSON.parse(rivalSaved);
        if (parsed.rivals) {
          Object.values(parsed.rivals).forEach((entries: any) => {
            entries.forEach((e: any) => {
              if (e.entryType === 'STATE' && e.townName) {
                foundStates.add(e.townName.trim());
              }
            });
          });
        }
      } catch (e) { console.error(e); }
    }
    
    const sortedStates = Array.from(foundStates).sort();
    setPotentialStates(sortedStates);
    
    const currentSelection = new Set<string>();
    Object.keys(data.states).forEach(s => currentSelection.add(s));
    setSelectedStates(currentSelection);
    setShowManageModal(true);
  };

  const executeManage = () => {
    const newStates = { ...data.states };
    let changes = false;
    
    selectedStates.forEach(s => {
      if (!newStates[s]) {
        newStates[s] = { entries: [], lastUpdated: new Date().toISOString() };
        changes = true;
      }
    });
    
    potentialStates.forEach(s => {
      if (!selectedStates.has(s) && newStates[s]) {
        delete newStates[s];
        changes = true;
      }
    });

    if (changes) {
      let nextState = data.currentState;
      if (data.currentState && !newStates[data.currentState]) {
        nextState = Object.keys(newStates).sort()[0] || null;
      }
      setData(prev => ({ ...prev, states: newStates, currentState: nextState || prev.currentState }));
    }
    setShowManageModal(false);
  };

  const toggleStateSelection = (name: string) => {
    const newSet = new Set(selectedStates);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setSelectedStates(newSet);
  };

  const currentEntries = data.currentState ? data.states[data.currentState].entries : [];
  const playerHistory: Record<string, StateEntry[]> = {};
  currentEntries.forEach(e => {
    const cleanName = e.name.trim();
    if (!playerHistory[cleanName]) playerHistory[cleanName] = [];
    playerHistory[cleanName].push(e);
  });
  
  Object.keys(playerHistory).forEach(name => {
    playerHistory[name].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id));
  });

  const currentLeaderboard = Object.keys(playerHistory).map(name => playerHistory[name][0]).sort((a,b) => b.parcels - a.parcels);
  const prevLeaderboard = Object.keys(playerHistory).map(name => {
    const history = playerHistory[name];
    return history.length > 1 ? history[1] : history[0];
  }).sort((a,b) => b.parcels - a.parcels);

  const getIndexRank = (list: StateEntry[], name: string) => {
    const idx = list.findIndex(e => e.name.trim().toLowerCase() === name.trim().toLowerCase());
    return idx === -1 ? null : idx + 1;
  };

  const myIndex = getIndexRank(currentLeaderboard, myUsername);
  const myEntry = myIndex ? currentLeaderboard[myIndex - 1] : null;
  const governorEntry = currentLeaderboard.find(e => e.rank === 1) || (currentLeaderboard.length > 0 ? currentLeaderboard[0] : null);

  let parcelsForGovernor = 0;
  let parcelsForNextRank = 0;
  let nextRankName = "";

  if (myEntry) {
    if (governorEntry && myEntry.name.trim().toLowerCase() !== governorEntry.name.trim().toLowerCase()) {
      parcelsForGovernor = (governorEntry.parcels - myEntry.parcels) + 1;
    }
    if (myIndex && myIndex > 1) {
      const targetEntry = currentLeaderboard[myIndex - 2];
      parcelsForNextRank = (targetEntry.parcels - myEntry.parcels) + 1;
      nextRankName = targetEntry.name;
    }
  } else if (governorEntry) {
    parcelsForGovernor = governorEntry.parcels + 1;
  }

  const existingNames = Object.keys(playerHistory).sort();
  const availableStates = Object.keys(data.states).sort();

  return (
    <div className="space-y-6">
      {showManageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-orange-400" /> Manage States
                </h3>
                <p className="text-xs text-slate-500">Import states/regions from your Rival Tracker entries.</p>
              </div>
              <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            
            <div className="p-4 border-b border-slate-700 bg-slate-900/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search potential states..." 
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-slate-900/30">
              {potentialStates.filter(s => s.toLowerCase().includes(modalSearch.toLowerCase())).length === 0 ? (
                <div className="text-center p-12 text-slate-500">
                  <Search className="mx-auto opacity-10 mb-2" size={48} />
                  <p>No new states found in Rival Tracker.</p>
                </div>
              ) : (
                potentialStates.filter(s => s.toLowerCase().includes(modalSearch.toLowerCase())).map(s => {
                  const isSelected = selectedStates.has(s);
                  return (
                    <div 
                      key={s} 
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'bg-orange-900/30 border-orange-500/50 shadow-inner' : 'bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}
                      onClick={() => toggleStateSelection(s)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-500 bg-slate-800'}`}>
                          {isSelected && <Check size={16} className="text-white" />}
                        </div>
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{s}</span>
                      </div>
                      {isSelected && <span className="text-[10px] font-bold text-orange-400 uppercase">Tracked</span>}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono font-bold">{selectedStates.size} states selected</span>
              <div className="flex gap-2">
                <button onClick={() => setShowManageModal(false)} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-bold">Cancel</button>
                <button onClick={executeManage} className="px-6 py-2 rounded-lg font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-xl transition-all active:scale-95">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3 w-full md:w-auto">
            <Map className="text-orange-400 flex-shrink-0" />
            <select 
              className="bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold cursor-pointer outline-none focus:ring-2 focus:ring-orange-500 flex-1 md:flex-none"
              value={data.currentState || ''}
              onChange={(e) => setData(prev => ({ ...prev, currentState: e.target.value }))}
            >
              {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <div className="flex gap-2 w-full md:w-auto items-center">
            <button 
              onClick={openManageModal}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-orange-400 py-2 px-3 rounded text-xs font-bold uppercase border border-orange-500/20 transition-colors"
            >
              <Users size={16} /> Manage States
            </button>
            <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block"></div>
            <input type="text" placeholder="Add Custom State/Region" value={newStateName} onChange={e => setNewStateName(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white w-full md:w-40 outline-none focus:border-orange-500" />
            <button onClick={addState} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded shrink-0" title="Add Region"><PlusCircle size={18}/></button>
            <button onClick={deleteCurrentState} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded shrink-0" title="Remove current state from list"><Trash2 size={18}/></button>
         </div>
      </div>

      {data.currentState && governorEntry && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-orange-900/40 to-slate-800 p-4 rounded-xl border border-orange-500/30 flex items-center gap-4 shadow-lg">
             <div className="bg-orange-500/20 p-3 rounded-full text-orange-400"><Crown size={24} /></div>
             <div>
                <div className="text-orange-500 text-xs font-bold uppercase tracking-wider">Current Governor</div>
                <div className="text-white font-bold text-lg truncate max-w-[200px]">{governorEntry.name}</div>
                <div className="text-slate-300 font-mono text-sm">{governorEntry.parcels} Parcels</div>
             </div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 shadow-lg">
             <div className="bg-blue-500/20 p-3 rounded-full text-blue-400"><Target size={24} /></div>
             <div>
                <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">Next Rank Target</div>
                {myIndex && myIndex > 1 ? (
                   <><div className="text-white font-bold text-lg">+{parcelsForNextRank} Parcels</div><div className="text-slate-400 text-xs">to overtake {nextRankName}</div></>
                ) : myIndex === 1 ? (
                  <div className="text-white font-bold text-sm">You are in the lead!</div>
                ) : (
                  <div className="text-slate-500 text-sm">Add your data to see targets</div>
                )}
             </div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4 shadow-lg">
             <div className="bg-purple-500/20 p-3 rounded-full text-purple-400"><Trophy size={24} /></div>
             <div>
                <div className="text-purple-400 text-xs font-bold uppercase tracking-wider">To Be Governor</div>
                {myEntry?.rank === 1 || (myIndex === 1 && !myEntry?.rank) ? (
                   <div className="text-green-400 font-bold text-lg">You are Governor!</div>
                ) : (
                   <><div className="text-white font-bold text-lg">+{parcelsForGovernor} Parcels</div><div className="text-slate-400 text-xs">to take Rank #1</div></>
                )}
             </div>
          </div>
        </div>
      )}

      {data.currentState && (
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
                <input type="text" placeholder="Username" value={entryName} onChange={e => setEntryName(e.target.value)} list="state-player-names" className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500 w-full" />
                <datalist id="state-player-names">{existingNames.map(name => <option key={name} value={name} />)}</datalist>
             </div>
             <div className="flex gap-2">
               <input type="number" placeholder="Rank (#)" value={entryRank} onChange={e => setEntryRank(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500 w-24" />
               <input type="number" placeholder="Parcels" value={entryParcels} onChange={e => setEntryParcels(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500 flex-1" />
             </div>
             <button onClick={handleSaveEntry} className={`font-bold rounded shadow-lg transition-transform active:scale-95 text-white flex items-center justify-center gap-2 ${editingId ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'}`}>
                {editingId ? <Save size={18} /> : <PlusCircle size={18} />}{editingId ? "Update Entry" : "Add Update"}
             </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
        <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
           <span className="text-white font-bold flex items-center gap-2 font-mono uppercase tracking-wider text-xs"><Map size={16} /> Leaderboard: {data.currentState}</span>
           <span className="text-slate-500 text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">Updated: {data.states[data.currentState || '']?.lastUpdated.split('T')[0]}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <tr><th className="p-4">Rank</th><th className="p-4">Player</th><th className="p-4">Parcels</th><th className="p-4">History</th><th className="p-4 text-right">Latest Date</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
                {currentLeaderboard.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No data recorded for {data.currentState} yet. Use the form above to add an entry.</td></tr>
                ) : (
                  currentLeaderboard.map((entry, idx) => {
                    const localRank = idx + 1;
                    const displayRank = entry.rank || localRank; 
                    const history = playerHistory[entry.name.trim()];
                    const prevRankVal = getIndexRank(prevLeaderboard, entry.name);
                    const isExpanded = expandedPlayers[entry.name];
                    const isMe = entry.name.trim().toLowerCase() === myUsername.toLowerCase();

                    let rankIcon = <Minus size={14} className="text-slate-600" />;
                    if (history.length <= 1) rankIcon = <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded uppercase">New</span>;
                    else if (prevRankVal && localRank < prevRankVal) rankIcon = <div className="flex items-center text-green-400"><ArrowUp size={14} /><span className="text-xs">{prevRankVal - localRank}</span></div>;
                    else if (prevRankVal && localRank > prevRankVal) rankIcon = <div className="flex items-center text-red-400"><ArrowDown size={14} /><span className="text-xs">{localRank - prevRankVal}</span></div>;

                    const rankClass = displayRank === 1 ? "text-yellow-400 font-bold text-lg" : displayRank === 2 ? "text-slate-300 font-bold text-lg" : displayRank === 3 ? "text-orange-400 font-bold text-lg" : "text-slate-300 font-mono";

                    return (
                      <React.Fragment key={entry.name}>
                        <tr className={`transition-colors cursor-pointer ${isMe ? "bg-blue-900/20 border-l-4 border-blue-500" : "hover:bg-slate-700/30 border-l-4 border-transparent"} ${isExpanded ? 'bg-slate-700/50' : ''}`} onClick={() => setExpandedPlayers(p => ({ ...p, [entry.name]: !isExpanded }))}>
                            <td className="p-4"><div className="flex items-center gap-3"><span className={rankClass}>#{displayRank}</span>{!entry.rank && <span className="text-[10px] text-slate-600 italic">(local)</span>}{rankIcon}</div></td>
                            <td className="p-4"><div className="flex items-center gap-2">{displayRank === 1 && <Crown size={14} className="text-yellow-500" />}<span className={`font-bold ${isMe ? 'text-blue-400' : 'text-white'}`}>{entry.name}</span>{isMe && <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded-full uppercase font-bold">You</span>}</div></td>
                            <td className="p-4 font-mono text-green-400 font-bold text-lg">{entry.parcels}</td>
                            <td className="p-4 text-xs text-slate-500 flex items-center gap-1"><History size={14} /> {history.length}</td>
                            <td className="p-4 text-right flex items-center justify-end gap-2"><span className="text-sm text-slate-400 font-mono">{entry.date}</span>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                        </tr>
                        {isExpanded && (
                           <tr className="bg-slate-900/50 animate-fade-in"><td colSpan={5} className="p-4"><div className="border border-slate-700 rounded-lg bg-slate-800 overflow-hidden shadow-inner">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-slate-400 font-bold"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Rank</th><th className="p-3 text-left">Parcels</th><th className="p-3 text-right">Actions</th></tr></thead>
                                <tbody className="divide-y divide-slate-700">{history.map((hist) => (
                                  <tr key={hist.id} className={`hover:bg-slate-700/50 ${editingId === hist.id ? 'bg-orange-500/10' : ''}`}>
                                    <td className="p-3 text-slate-300 font-mono">{hist.date}</td>
                                    <td className="p-3 text-blue-300 font-mono">{hist.rank ? `#${hist.rank}` : '-'}</td>
                                    <td className="p-3 text-green-400 font-bold font-mono">{hist.parcels}</td>
                                    <td className="p-3 text-right flex justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); startEditing(hist); }} className="p-1.5 rounded hover:bg-slate-700 text-blue-400" title="Edit Entry"><Pencil size={14} /></button><button onClick={(e) => { e.stopPropagation(); deleteSpecificEntry(hist.id); }} className="p-1.5 rounded hover:bg-slate-700 text-red-400" title="Delete Entry"><Trash2 size={14} /></button></td>
                                  </tr>
                                ))}</tbody>
                              </table>
                           </div></td></tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
