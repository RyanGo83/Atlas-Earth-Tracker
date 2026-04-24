
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart 
} from 'recharts';
import { Trash2, PlusCircle, User, Edit2, Save as SaveIcon, X, RefreshCw, Crown, ChevronDown, MapPin, LayoutList, History, Pencil, Building2, UserPlus, Check, Search, AlertCircle, Users, TrendingUp, CalendarClock, Timer, Filter, ArrowUpDown, Award, Activity } from 'lucide-react';
import { TimeRange, filterByTimeRange } from '../utils';

type EntryType = 'SNAPSHOT' | 'STATE' | 'TOWN' | 'COUNTRY' | 'EARTH';

interface RivalEntry {
  id: number | string;
  townName: string; 
  rank: number | null;
  parcels: number;
  earnings: number;
  passports?: number;
  dateSpotted: string;
  activityLevel: string;
  isSynced?: boolean;
  entryType: EntryType;
  // Rarity breakdown — only used on SNAPSHOT entries, optional for backward compat
  common?: number;
  rare?: number;
  epic?: number;
  legendary?: number;
}

interface AllRivalsData {
  rivals: Record<string, RivalEntry[]>;
  currentRival: string | null;
}

interface PotentialRival {
  name: string;
  titles: string[];
  isMayor: boolean;
  isGovernor: boolean;
  isStatePlayer: boolean;
  isTracked: boolean;
  parcels: number;
}

const STORAGE_KEY = 'atlas_rival_data_v2';
const RENT_STORAGE_KEY = 'atlas_rent_data_v2';
const DEFAULT_RIVAL_NAME = "Chubbs123";

const getPassportBoost = (count: number) => {
  if (count === 0) return 0;
  if (count <= 10) return 5;
  if (count <= 30) return 10;
  if (count <= 60) return 15;
  if (count <= 100) return 20;
  return 25;
};

interface GroupCardProps {
  name: string;
  entries: RivalEntry[];
  isExpanded: boolean;
  toggle: () => void;
  onEdit: (entry: RivalEntry) => void;
  onDelete: (id: number | string) => void;
  icon: React.ReactNode;
  theme: 'orange' | 'purple';
  editingId: number | string | null;
}

const GroupCard: React.FC<GroupCardProps> = ({ 
  name, entries, isExpanded, toggle, onEdit, onDelete, icon, theme, editingId 
}) => {
  const latest = entries[0];
  const count = latest ? latest.parcels : 0;
  const borderColor = theme === 'orange' ? 'border-orange-500/30' : 'border-purple-500/30';
  const bgGradient = theme === 'orange' ? 'from-orange-900/10' : 'from-purple-900/10';
  const iconBg = theme === 'orange' ? 'bg-orange-500/20' : 'bg-purple-500/20';
  const textColor = theme === 'orange' ? 'text-orange-400' : 'text-purple-400';
  const editBg = theme === 'orange' ? 'bg-orange-500/10' : 'bg-purple-500/10';

  return (
    <div className={`bg-slate-800 rounded-xl border ${borderColor} shadow-lg overflow-hidden`}>
        <div className={`p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors bg-gradient-to-r ${bgGradient} to-transparent`} onClick={toggle}>
            <div className="flex items-center gap-4">
                <div className={`${iconBg} p-3 rounded-lg w-12 h-12 flex items-center justify-center`}>{icon}</div>
                <div>
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <div className="text-sm text-slate-400">Current: <span className="text-green-400 font-mono font-bold">{count} Parcels</span>{latest.rank && <span className={`ml-2 ${textColor}`}>Rank #{latest.rank}</span>}</div>
                </div>
            </div>
            <div className="flex items-center gap-4 mt-3 md:mt-0">
                <div className="text-right hidden md:block mr-4">
                    <div className="text-slate-500 text-xs uppercase font-bold">Last Update</div>
                    <div className="text-slate-300 text-sm">{latest.dateSpotted}</div>
                </div>
                <button className={`text-slate-400 ${isExpanded ? 'rotate-180' : ''} transition-transform`}><ChevronDown /></button>
            </div>
        </div>
        {isExpanded && (
            <div className="border-t border-slate-700 bg-slate-900/50 p-4 animate-fade-in">
                <table className="w-full text-left text-sm">
                    <thead className="text-slate-500 font-bold uppercase text-xs">
                        <tr><th className="p-2">Date</th><th className="p-2">Parcels</th><th className="p-2">Rank</th><th className="p-2 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-slate-300">
                        {entries.map(e => (
                            <tr key={e.id} className={editingId === e.id ? editBg : ''}>
                                <td className="p-2">{e.dateSpotted}</td>
                                <td className="p-2 font-mono text-green-400">{e.parcels}</td>
                                <td className={`p-2 ${textColor}`}>{e.rank ? `#${e.rank}` : '-'}</td>
                                <td className="p-2 text-right flex justify-end gap-2">
                                    {!e.isSynced ? (
                                        <>
                                            <button onClick={(ev) => { ev.stopPropagation(); onEdit(e); }} className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-900/20 rounded" title="Edit"><Pencil size={14} /></button>
                                            <button onClick={(ev) => { ev.stopPropagation(); onDelete(e.id); }} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded" title="Delete"><Trash2 size={14} /></button>
                                        </>
                                    ) : <span className="text-[10px] text-slate-500 italic bg-slate-800 px-2 py-1 rounded">Synced</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
};

export const RivalTracker: React.FC = () => {
  const [data, setData] = useState<AllRivalsData>({ rivals: {}, currentRival: null });
  const [myRentStats, setMyRentStats] = useState<any>(null);
  const [townTrackerData, setTownTrackerData] = useState<any>(null);
  const [stateTrackerData, setStateTrackerData] = useState<any>(null);
  const [countryTrackerData, setCountryTrackerData] = useState<any>(null);
  const [earthTrackerData, setEarthTrackerData] = useState<any>(null);
  const [newRivalName, setNewRivalName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [mayorOf, setMayorOf] = useState<Record<string, string>>({}); 
  const [governorOf, setGovernorOf] = useState<Record<string, string>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [potentialRivals, setPotentialRivals] = useState<PotentialRival[]>([]);
  const [selectedImports, setSelectedImports] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [townName, setTownName] = useState('');
  const [rank, setRank] = useState<number | ''>('');
  const [parcels, setParcels] = useState<number | ''>('');
  const [earnings, setEarnings] = useState<number | ''>(''); 
  const [passports, setPassports] = useState<number | ''>('');
  const [common, setCommon] = useState<number | ''>('');
  const [rare, setRare] = useState<number | ''>('');
  const [epic, setEpic] = useState<number | ''>('');
  const [legendary, setLegendary] = useState<number | ''>('');
  const [dateSpotted, setDateSpotted] = useState(new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState<EntryType>('TOWN');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [mayorSectionExpanded, setMayorSectionExpanded] = useState(true);
  const [showMyComparison, setShowMyComparison] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  
  const [modalFilter, setModalFilter] = useState<'ALL' | 'MAYORS' | 'GOVERNORS' | 'STATE_LB'>('ALL');
  const [modalSort, setModalSort] = useState<'NAME' | 'PARCELS'>('NAME');
  const isInitialized = useRef(false);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let loadedData: AllRivalsData = { rivals: { [DEFAULT_RIVAL_NAME]: [] }, currentRival: DEFAULT_RIVAL_NAME };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.rivals) {
           Object.keys(parsed.rivals).forEach(key => {
             parsed.rivals[key] = parsed.rivals[key].map((e: any) => ({
                 ...e,
                 entryType: e.entryType || (e.townName === "Portfolio Snapshot" ? 'SNAPSHOT' : 'TOWN')
             }));
           });
           loadedData = parsed;
        }
      } catch (e) { console.error(e); }
    }
    const townSaved = localStorage.getItem('atlas_town_data_v2');
    const stateSaved = localStorage.getItem('atlas_state_data_v2');
    const countrySaved = localStorage.getItem('atlas_country_data_v2');
    const earthSaved = localStorage.getItem('atlas_earth_data_v2');
    const rentSaved = localStorage.getItem(RENT_STORAGE_KEY);
    
    let tData = null;
    let sData = null;
    let cData = null;
    let eData = null;
    let rData = null;

    if (rentSaved) {
        try {
            rData = JSON.parse(rentSaved);
            // Migration for consistency in local data copy
            if (rData.history) {
                rData.history = rData.history.map((h: any) => ({
                    ...h,
                    totalAccrued: h.totalAccrued !== undefined ? h.totalAccrued : (h.currentBalance || 0)
                }));
            }
            setMyRentStats(rData);
        } catch(e) {}
    }

    const newMayorMap: Record<string, string> = {};
    const newGovernorMap: Record<string, string> = {};
    
    const extractLeaders = (rawData: any, map: Record<string, string>) => {
        if (!rawData || (!rawData.towns && !rawData.states)) return;
        const locations = rawData.towns || rawData.states || {};
        Object.entries(locations).forEach(([locName, locData]: [string, any]) => {
            const entries = locData.entries || [];
            if (entries.length === 0) return;
            const players: Record<string, any> = {};
            entries.forEach((e: any) => {
                const clean = e.name.trim();
                if (!players[clean] || new Date(e.date) > new Date(players[clean].date)) players[clean] = e;
            });
            const sorted = Object.values(players).sort((a: any, b: any) => b.parcels - a.parcels);
            const rank1 = sorted.find((p: any) => p.rank === 1);
            const leader = rank1 ? rank1.name : sorted[0].name;
            if (leader) map[leader] = locName;
        });
    };
    if (townSaved) { try { tData = JSON.parse(townSaved); extractLeaders(tData, newMayorMap); } catch(e) {} }
    if (stateSaved) { try { sData = JSON.parse(stateSaved); extractLeaders(sData, newGovernorMap); } catch(e) {} }
    if (countrySaved) { try { cData = JSON.parse(countrySaved); } catch(e) {} }
    if (earthSaved) { try { eData = JSON.parse(earthSaved); } catch(e) {} }
    setTownTrackerData(tData);
    setStateTrackerData(sData);
    setCountryTrackerData(cData);
    setEarthTrackerData(eData);
    setMayorOf(newMayorMap);
    setGovernorOf(newGovernorMap);
    setData(loadedData);
    isInitialized.current = true;
  };

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  // Sync data when tab might have changed (conceptual)
  useEffect(() => {
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

useEffect(() => {
    if (data.currentRival && entryType === 'SNAPSHOT' && !editingId) {
      const entries = data.rivals[data.currentRival] || [];
      const snapshots = entries.filter(e => e.entryType === 'SNAPSHOT');
      if (snapshots.length > 0) {
        const latest = snapshots.sort((a, b) => new Date(b.dateSpotted).getTime() - new Date(a.dateSpotted).getTime())[0];
        setEarnings(latest.earnings);
        setPassports(latest.passports || 0);
        setParcels(latest.parcels);
        // Prefill rarity breakdown from latest snapshot (likely a lower bound since parcels only go up)
        setCommon(latest.common ?? '');
        setRare(latest.rare ?? '');
        setEpic(latest.epic ?? '');
        setLegendary(latest.legendary ?? '');
      } else {
        setEarnings(''); setPassports(''); setParcels('');
        setCommon(''); setRare(''); setEpic(''); setLegendary('');
      }
    }
  }, [data.currentRival, entryType, editingId]);

  const toggleImportSelection = (name: string) => {
      const newSet = new Set(selectedImports);
      if (newSet.has(name)) newSet.delete(name);
      else newSet.add(name);
      setSelectedImports(newSet);
  };

  const executeImport = () => {
      const newRivals = { ...data.rivals };
      let changes = false;
      selectedImports.forEach(name => {
        const normalizedName = name.trim().toUpperCase();
        if (!newRivals[normalizedName]) { newRivals[normalizedName] = []; changes = true; }
      });
      potentialRivals.forEach(p => {
        const normalizedName = p.name.trim().toUpperCase();
        if (!selectedImports.has(p.name) && newRivals[normalizedName]) { delete newRivals[normalizedName]; changes = true; }
      });
      if (changes) {
          let nextRival = data.currentRival;
          if (data.currentRival && !newRivals[data.currentRival]) nextRival = Object.keys(newRivals)[0] || null;
          setData(prev => ({ ...prev, rivals: newRivals, currentRival: nextRival || prev.currentRival }));
      }
      setShowImportModal(false);
  };

  const addRival = () => {
    if (!newRivalName.trim()) return;
    const normalizedName = newRivalName.trim().toUpperCase();
    if (data.rivals[normalizedName]) { alert('Rival exists'); return; }
    setData(prev => ({ ...prev, rivals: { ...prev.rivals, [normalizedName]: [] }, currentRival: normalizedName }));
    setNewRivalName('');
  };

  const deleteCurrentRival = () => {
    if (!data.currentRival) return;
    if (!window.confirm(`Delete all for ${data.currentRival}?`)) return;
    const newRivals = { ...data.rivals };
    delete newRivals[data.currentRival];
    const nextRival = Object.keys(newRivals)[0] || null;
    setData({ rivals: newRivals, currentRival: nextRival });
  };

  const saveRename = () => {
    if (!data.currentRival || !renameValue.trim()) { setIsRenaming(false); return; }
    const normalizedName = renameValue.trim().toUpperCase();
    if (normalizedName === data.currentRival) { setIsRenaming(false); return; }
    if (data.rivals[normalizedName]) { alert("Name taken"); return; }
    const oldName = data.currentRival;
    const entries = data.rivals[oldName];
    const newRivals = { ...data.rivals };
    delete newRivals[oldName];
    newRivals[normalizedName] = entries;
    setData({ rivals: newRivals, currentRival: normalizedName });
    setIsRenaming(false);
  };

const startEditing = (entry: RivalEntry) => {
      if (entry.isSynced) { alert("Synced entry cannot be edited here."); return; }
      setEditingId(entry.id);
      setDateSpotted(entry.dateSpotted);
      setParcels(entry.parcels);
      setEntryType(entry.entryType);
      if (entry.entryType === 'SNAPSHOT') { 
        setEarnings(entry.earnings || ''); 
        setPassports(entry.passports || ''); 
        setTownName(''); setRank(''); 
        setCommon(entry.common ?? '');
        setRare(entry.rare ?? '');
        setEpic(entry.epic ?? '');
        setLegendary(entry.legendary ?? '');
      }
      else { 
        setTownName(entry.townName); 
        setRank(entry.rank === null ? '' : entry.rank); 
        setEarnings(''); setPassports(''); 
        setCommon(''); setRare(''); setEpic(''); setLegendary('');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

const cancelEditing = () => {
      setEditingId(null); setParcels(''); setEarnings(''); setPassports(''); setTownName(''); setRank(''); setEntryType('TOWN');
      setCommon(''); setRare(''); setEpic(''); setLegendary('');
      setDateSpotted(new Date().toISOString().split('T')[0]);
  };

const handleSaveEntry = () => {
    if (!data.currentRival) return;
    if (!dateSpotted || (entryType !== 'SNAPSHOT' && !townName)) { alert("Required fields missing"); return; }

    // Rarity sanity check (only when SNAPSHOT and user entered rarity numbers)
    if (entryType === 'SNAPSHOT') {
      const c = Number(common) || 0;
      const r = Number(rare) || 0;
      const ep = Number(epic) || 0;
      const lg = Number(legendary) || 0;
      const rarityTotal = c + r + ep + lg;
      const totalParcels = Number(parcels) || 0;
      const anyRarityEntered = common !== '' || rare !== '' || epic !== '' || legendary !== '';
      if (anyRarityEntered && totalParcels > 0 && rarityTotal !== totalParcels) {
        const proceed = window.confirm(
          `Rarity breakdown (${rarityTotal}) doesn't match total parcels (${totalParcels}).\n\nSave anyway? Click Cancel to fix first.`
        );
        if (!proceed) return;
      }
    }

    const newEntry: RivalEntry = {
      id: editingId || Date.now(),
      townName: entryType === 'SNAPSHOT' ? "Portfolio Snapshot" : townName,
      rank: entryType === 'SNAPSHOT' ? null : (rank === '' ? null : Number(rank)),
      parcels: Number(parcels) || 0,
      earnings: entryType === 'SNAPSHOT' ? (Number(earnings) || 0) : 0,
      passports: entryType === 'SNAPSHOT' ? (Number(passports) || 0) : undefined,
      dateSpotted, activityLevel: 'Unknown', entryType,
      // Attach rarity only for SNAPSHOTs and only when at least one number was entered
      ...(entryType === 'SNAPSHOT' && (common !== '' || rare !== '' || epic !== '' || legendary !== '')
        ? {
            common: Number(common) || 0,
            rare: Number(rare) || 0,
            epic: Number(epic) || 0,
            legendary: Number(legendary) || 0,
          }
        : {})
    };
    const currentList = data.rivals[data.currentRival] || [];
    let updatedList = editingId ? currentList.map(e => String(e.id) === String(editingId) ? newEntry : e) : [...currentList, newEntry];
    setData(prev => ({ ...prev, rivals: { ...prev.rivals, [prev.currentRival!]: updatedList } }));
    cancelEditing();
  };

  const deleteEntry = (id: number | string) => {
    if (!data.currentRival) return;
    if (window.confirm("Delete entry?")) {
      setData(prev => {
        const rivalName = prev.currentRival;
        if (!rivalName || !prev.rivals[rivalName]) return prev;
        return { ...prev, rivals: { ...prev.rivals, [rivalName]: prev.rivals[rivalName].filter(e => String(e.id) !== String(id)) } };
      });
      if (editingId && String(editingId) === String(id)) cancelEditing();
    }
  };

  const toggleExpand = (key: string) => { setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] })); };

// Compute which towns the current rival is Mayor of, from town data
  const mayorTowns = useMemo(() => {
    const currentRival = data.currentRival;
    if (!currentRival || !townTrackerData?.towns) return [];

    const results: Array<{
      town: string;
      state?: string;
      country?: string;
      parcels: number;
      lastObserved: string;
      runnerUpParcels: number;
      runnerUpName: string | null;
      gap: number;
    }> = [];

    Object.entries(townTrackerData.towns).forEach(([townName, townData]: [string, any]) => {
      const entries = townData.entries || [];
      if (entries.length === 0) return;

      // Get latest entry per player in this town
      const latestPerPlayer: Record<string, any> = {};
      entries.forEach((e: any) => {
        const clean = e.name.trim();
        if (!clean) return;
        if (!latestPerPlayer[clean] || new Date(e.date) > new Date(latestPerPlayer[clean].date)) {
          latestPerPlayer[clean] = e;
        }
      });

      const sorted = Object.values(latestPerPlayer).sort((a: any, b: any) => b.parcels - a.parcels);
      if (sorted.length === 0) return;

      // Mayor = explicit rank===1 if present, otherwise top of parcel-sorted list
      const explicitMayor = sorted.find((p: any) => p.rank === 1);
      const mayor: any = explicitMayor || sorted[0];

      // Is our current rival the mayor?
      if (mayor.name.trim() !== currentRival) return;

      // Find runner-up (first player who isn't the mayor)
      const runnerUp: any = sorted.find((p: any) => p.name.trim() !== mayor.name.trim());

      results.push({
        town: townName,
        state: townData.state,
        country: townData.country,
        parcels: mayor.parcels,
        lastObserved: mayor.date,
        runnerUpParcels: runnerUp ? runnerUp.parcels : 0,
        runnerUpName: runnerUp ? runnerUp.name : null,
        gap: runnerUp ? (mayor.parcels - runnerUp.parcels) : mayor.parcels
      });
    });

    // Sort by parcel count desc (biggest mayor towns first)
    results.sort((a, b) => b.parcels - a.parcels);
    return results;
  }, [data.currentRival, townTrackerData]);
      const currentRival = data.currentRival;
      const manualEntries = currentRival ? (data.rivals[currentRival] || []) : [];
      const syncedEntries: RivalEntry[] = [];
      const syncFromSource = (sourceData: any, type: EntryType, collectionKey: 'towns' | 'states') => {
        if (currentRival && sourceData && sourceData[collectionKey]) {
            Object.entries(sourceData[collectionKey]).forEach(([locName, locData]: [string, any]) => {
                const tEntries = locData.entries || [];
                const playerLatestMap: Record<string, any> = {};
                tEntries.forEach((e: any) => { if (!playerLatestMap[e.name] || new Date(e.date) > new Date(playerLatestMap[e.name].date)) playerLatestMap[e.name] = e; });
                const leaderboard = Object.values(playerLatestMap).sort((a: any, b: any) => b.parcels - a.parcels);
                const rankIndex = leaderboard.findIndex((e: any) => e.name === currentRival);
                const currentRank = rankIndex !== -1 ? rankIndex + 1 : null;
                const matches = tEntries.filter((e: any) => e.name === currentRival);
                matches.forEach((m: any) => {
                    syncedEntries.push({
                        id: `synced-${type}-${locName}-${m.date}-${m.parcels}`,
                        townName: locName, rank: m.rank || currentRank, parcels: m.parcels,
                        earnings: 0, dateSpotted: m.date, activityLevel: 'Synced', isSynced: true, entryType: type
                    });
                });
            });
        }
      };
      syncFromSource(townTrackerData, 'TOWN', 'towns');
      syncFromSource(stateTrackerData, 'STATE', 'states');
      const allEntries = [...manualEntries, ...syncedEntries];
      const grouped: Record<string, RivalEntry[]> = {};
      allEntries.forEach(e => {
         const key = e.entryType === 'SNAPSHOT' ? 'Portfolio Snapshot' : e.townName;
         if (!grouped[key]) grouped[key] = [];
         grouped[key].push(e);
      });
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a,b) => new Date(b.dateSpotted).getTime() - new Date(a.dateSpotted).getTime());
      });
      const snaps = grouped["Portfolio Snapshot"] || [];
      const tKeys: string[] = [];
      Object.keys(grouped).forEach(key => { if (key !== "Portfolio Snapshot") tKeys.push(key); });
      
      // Updated Sorting: Rank Ascending, then Parcel Count Descending
      tKeys.sort((a, b) => {
        const entryA = grouped[a][0];
        const entryB = grouped[b][0];
        const rankA = entryA.rank ?? Infinity;
        const rankB = entryB.rank ?? Infinity;
        
        if (rankA !== rankB) return rankA - rankB; // Ascending Rank (1 at top)
        return entryB.parcels - entryA.parcels;   // Descending Parcels (Highest at top for tied rank)
      });

      let trackedTotal = 0;
      tKeys.forEach(town => trackedTotal += grouped[town][0].parcels);
      const totalPortfolio = snaps.length > 0 ? snaps[0].parcels : 0;
      const latestPassports = snaps.length > 0 ? (snaps[0].passports || 0) : 0;
      const trackedPercent = totalPortfolio > 0 ? (trackedTotal / totalPortfolio) * 100 : 0;

      const calcGrowthForList = (list: RivalEntry[]) => {
          if (!list || list.length === 0) return { month: 0, daily: 0, start: Infinity, end: 0 };
          const sorted = [...list].sort((a,b) => new Date(a.dateSpotted).getTime() - new Date(b.dateSpotted).getTime());
          const oldest = sorted[0], newest = sorted[sorted.length - 1];
          const oTime = new Date(oldest.dateSpotted).getTime(), nTime = new Date(newest.dateSpotted).getTime();
          const now = new Date(), firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          let monthGain = 0;
          const prevBaseline = [...sorted].reverse().find(e => new Date(e.dateSpotted) < firstDayOfMonth);
          if (prevBaseline) monthGain = Math.max(0, newest.parcels - prevBaseline.parcels);
          let dailyRate = 0, daysDiff = (nTime - oTime) / (1000 * 3600 * 24);
          if (daysDiff > 0) dailyRate = (newest.parcels - oldest.parcels) / daysDiff;
          return { month: monthGain, daily: dailyRate, start: oTime, end: nTime };
      };

      let finalCurrentMonth = 0, finalAvgMonthly = 0, earliestAcrossAll = Infinity, latestAcrossAll = 0;
      const calcTarget = tKeys.length > 0 ? tKeys.map(k => grouped[k]) : [snaps];
      calcTarget.forEach(list => {
          const stats = calcGrowthForList(list);
          if (tKeys.length > 0 && list[0].entryType === 'TOWN') { finalCurrentMonth += stats.month; finalAvgMonthly += (stats.daily * 30.44); }
          else if (tKeys.length === 0) { finalCurrentMonth = stats.month; finalAvgMonthly = stats.daily * 30.44; }
          if (stats.start < earliestAcrossAll) earliestAcrossAll = stats.start;
          if (stats.end > latestAcrossAll) latestAcrossAll = stats.end;
      });

      return { 
        groupedEntries: grouped, snapshotEntries: snaps, townKeys: tKeys, 
        stats: { trackedTotal, totalPortfolio, latestPassports, trackedPercent: Math.min(100, trackedPercent) }, 
        growthStats: { currentMonth: finalCurrentMonth, avgMonthly: finalAvgMonthly, daysTracked: Math.max(0, Math.floor((latestAcrossAll - earliestAcrossAll) / (1000 * 3600 * 24))) } 
      };
  }, [data.rivals, data.currentRival, townTrackerData, stateTrackerData]);

  const combinedChartData = useMemo(() => {
    let rivalSnaps = [...snapshotEntries].sort((a, b) => new Date(a.dateSpotted + 'T00:00:00').getTime() - new Date(b.dateSpotted + 'T00:00:00').getTime());
    let myHistory = (myRentStats?.history || []).sort((a: any, b: any) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime());

    rivalSnaps = filterByTimeRange(rivalSnaps, 'dateSpotted', timeRange);
    myHistory = filterByTimeRange(myHistory, 'date', timeRange);

    const allDatesSet = new Set<string>();
    rivalSnaps.forEach(e => allDatesSet.add(e.dateSpotted));
    myHistory.forEach((h: any) => allDatesSet.add(h.date));
    const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime());

    let lastMyParcels: number | undefined = undefined;
    let lastMyTotalAccrued: number | undefined = undefined;
    let lastMyPassports: number | undefined = undefined;
    
    const result = [];

    for (const date of sortedDates) {
      const r = rivalSnaps.find(e => e.dateSpotted === date);
      const h = myHistory.find((e: any) => e.date === date);

      if (h) {
        lastMyParcels = h.totalParcels ?? lastMyParcels;
        // Strictly use totalAccrued, falling back to currentBalance only if missing
        if (h.totalAccrued !== undefined) {
            lastMyTotalAccrued = h.totalAccrued;
        } else if (h.currentBalance !== undefined) {
            lastMyTotalAccrued = h.currentBalance;
        }
        lastMyPassports = h.passports ?? lastMyPassports;
      }

      result.push({
        date,
        parcels: r ? r.parcels : undefined,
        earnings: r ? r.earnings : undefined,
        passports: r ? r.passports : undefined,
        myParcels: lastMyParcels,
        myTotalAccrued: lastMyTotalAccrued,
        myPassports: lastMyPassports
      });
    }

    return result;
  }, [snapshotEntries, myRentStats, showMyComparison, timeRange]);

  const openImportModal = () => {
      const myUser = localStorage.getItem('atlas_my_username') || 'H1PHOPANONYMOUS';
      const found: Record<string, PotentialRival> = {};
      const getOrInitFound = (name: string) => {
          const clean = name.trim();
          if (clean === myUser.trim()) return null;
          if (!found[clean]) {
              found[clean] = { 
                name: clean, titles: [], isMayor: false, isGovernor: false, isStatePlayer: false, isTracked: !!data.rivals[clean], parcels: 0
              };
          }
          return found[clean];
      };
      if (stateTrackerData?.states) {
          Object.entries(stateTrackerData.states).forEach(([stateName, stateData]: [string, any]) => {
              const entries = stateData.entries || [];
              const latestPlayers: Record<string, any> = {};
              entries.forEach((e: any) => {
                  const clean = e.name.trim();
                  if (!latestPlayers[clean] || new Date(e.date) > new Date(latestPlayers[clean].date)) latestPlayers[clean] = e;
              });
              const sorted = Object.values(latestPlayers).sort((a: any, b: any) => b.parcels - a.parcels);
              sorted.forEach((p: any, idx) => {
                  const fr = getOrInitFound(p.name);
                  if (!fr) return;
                  fr.isStatePlayer = true;
                  fr.parcels = Math.max(fr.parcels, p.parcels);
                  if (p.rank === 1 || (idx === 0 && !p.rank)) {
                      fr.isGovernor = true;
                      fr.titles.push(`Governor of ${stateName}`);
                  } else { fr.titles.push(`Ranked in ${stateName}`); }
              });
          });
      }
      if (townTrackerData?.towns) {
          Object.entries(townTrackerData.towns).forEach(([townName, townData]: [string, any]) => {
              const entries = townData.entries || [];
              const latestPlayers: Record<string, any> = {};
              entries.forEach((e: any) => {
                  const clean = e.name.trim();
                  if (!latestPlayers[clean] || new Date(e.date) > new Date(latestPlayers[clean].date)) latestPlayers[clean] = e;
              });
              const sorted = Object.values(latestPlayers).sort((a: any, b: any) => b.parcels - a.parcels);
              const rank1 = sorted.find((p: any) => p.rank === 1) || (sorted.length > 0 ? sorted[0] : null);
              if (rank1) {
                  const fr = getOrInitFound(rank1.name);
                  if (!fr) return;
                  fr.isMayor = true;
                  fr.parcels = Math.max(fr.parcels, rank1.parcels);
                  fr.titles.push(`Mayor of ${townName}`);
              }
          });
      }
      if (countryTrackerData?.countries) {
          Object.entries(countryTrackerData.countries).forEach(([countryName, countryData]: [string, any]) => {
              const entries = countryData.entries || [];
              const latestPlayers: Record<string, any> = {};
              entries.forEach((e: any) => {
                  const clean = e.name.trim();
                  if (!latestPlayers[clean] || new Date(e.date) > new Date(latestPlayers[clean].date)) latestPlayers[clean] = e;
              });
              const sorted = Object.values(latestPlayers).sort((a: any, b: any) => b.parcels - a.parcels);
              sorted.forEach((p: any, idx) => {
                  const fr = getOrInitFound(p.name);
                  if (!fr) return;
                  fr.parcels = Math.max(fr.parcels, p.parcels);
                  fr.titles.push(`Ranked in ${countryName}`);
              });
          });
      }
      if (earthTrackerData?.regions) {
          Object.entries(earthTrackerData.regions).forEach(([regionName, regionData]: [string, any]) => {
              const entries = regionData.entries || [];
              const latestPlayers: Record<string, any> = {};
              entries.forEach((e: any) => {
                  const clean = e.name.trim();
                  if (!latestPlayers[clean] || new Date(e.date) > new Date(latestPlayers[clean].date)) latestPlayers[clean] = e;
              });
              const sorted = Object.values(latestPlayers).sort((a: any, b: any) => b.parcels - a.parcels);
              sorted.forEach((p: any, idx) => {
                  const fr = getOrInitFound(p.name);
                  if (!fr) return;
                  fr.parcels = Math.max(fr.parcels, p.parcels);
                  fr.titles.push(`Ranked in ${regionName} (Earth)`);
              });
          });
      }
      const allFound = Object.values(found);
      setPotentialRivals(allFound);
      const currentSelection = new Set<string>();
      allFound.forEach(p => { if (data.rivals[p.name]) currentSelection.add(p.name); });
      setSelectedImports(currentSelection);
      setShowImportModal(true);
  };

  const filteredModalRivals = useMemo(() => {
      let filtered = [...potentialRivals];
      if (modalFilter === 'MAYORS') filtered = filtered.filter(p => p.isMayor);
      if (modalFilter === 'GOVERNORS') filtered = filtered.filter(p => p.isGovernor);
      if (modalFilter === 'STATE_LB') filtered = filtered.filter(p => p.isStatePlayer);
      return filtered.sort((a, b) => modalSort === 'NAME' ? a.name.localeCompare(b.name) : b.parcels - a.parcels);
  }, [potentialRivals, modalFilter, modalSort]);

  const isMayorTown = data.currentRival ? mayorOf[data.currentRival] : null;
  const isGovernorState = data.currentRival ? governorOf[data.currentRival] : null;

  return (
    <div className="space-y-6">
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="text-blue-400" /> Manage Tracker Rivals</h3>
                      <p className="text-xs text-slate-500">Add or remove players from other tracker data.</p>
                    </div>
                    <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                <div className="p-4 border-b border-slate-700 bg-slate-900/20 flex flex-wrap gap-3 items-center">
                    <div className="flex bg-slate-700 p-1 rounded-lg">
                        <button onClick={() => setModalFilter('ALL')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${modalFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>All</button>
                        <button onClick={() => setModalFilter('MAYORS')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${modalFilter === 'MAYORS' ? 'bg-yellow-600 text-white' : 'text-slate-400'}`}>Mayors</button>
                        <button onClick={() => setModalFilter('GOVERNORS')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${modalFilter === 'GOVERNORS' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>Governors</button>
                        <button onClick={() => setModalFilter('STATE_LB')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${modalFilter === 'STATE_LB' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>State Players</button>
                    </div>
                    <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Sort by:</span>
                        <select className="bg-slate-700 border-none rounded px-2 py-1 text-[10px] text-white font-bold outline-none cursor-pointer" value={modalSort} onChange={(e) => setModalSort(e.target.value as any)}>
                           <option value="NAME">Name</option><option value="PARCELS">Parcels</option>
                        </select>
                    </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-slate-900/30">
                    {filteredModalRivals.length === 0 ? (
                      <div className="text-center p-12 text-slate-500"><Search className="mx-auto opacity-10 mb-2" size={48} /><p>No players found for this criteria.</p></div>
                    ) : filteredModalRivals.map(p => {
                            const isSelected = selectedImports.has(p.name);
                            return (
                                <div key={p.name} className={`p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'bg-blue-900/30 border-blue-500/50 shadow-inner' : 'bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`} onClick={() => toggleImportSelection(p.name)}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-500 bg-slate-800'}`}>{isSelected && <Check size={16} className="text-white" />}</div>
                                        <div><div className="flex items-center gap-2"><div className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{p.name}</div><div className="flex gap-1">
                                                {p.isGovernor && <span className="bg-orange-500/20 text-orange-500 border border-orange-500/30 px-1.5 rounded text-[8px] font-bold uppercase">Gov</span>}
                                                {p.isMayor && <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 rounded text-[8px] font-bold uppercase">Mayor</span>}
                                                {p.isStatePlayer && !p.isGovernor && <span className="bg-purple-500/20 text-purple-500 border border-purple-500/30 px-1.5 rounded text-[8px] font-bold uppercase">State</span>}
                                              </div></div><div className="text-[10px] text-slate-500 truncate max-w-[400px]">{p.titles.join(' • ')}</div></div>
                                    </div>
                                    <div className="text-right"><div className="text-[10px] font-bold text-green-400 font-mono">{p.parcels} P</div>{isSelected && <span className="text-[9px] font-bold text-blue-400 uppercase">Following</span>}</div>
                                </div>
                            );
                        })}
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono font-bold">{selectedImports.size} players selected to track</span>
                    <div className="flex gap-2">
                      <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-bold">Cancel</button>
                      <button onClick={executeImport} className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl transition-all active:scale-95">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex flex-col md:flex-row gap-4 md:items-center justify-between">
         <div className="flex flex-col md:flex-row gap-3 flex-1 md:items-center">
            <div className="flex items-center gap-3">
                <User className="text-blue-400 flex-shrink-0" />
                {isRenaming ? (
                  <div className="flex items-center gap-2 animate-fade-in"><input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-2 text-white font-bold outline-none" autoFocus /><button onClick={saveRename} className="text-green-400 p-1 rounded"><SaveIcon size={18}/></button><button onClick={() => setIsRenaming(false)} className="text-red-400 p-1 rounded"><X size={18}/></button></div>
                ) : (
                  <div className="flex items-center gap-2"><select className="bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold min-w-[200px] outline-none cursor-pointer" value={data.currentRival || ''} onChange={(e) => setData(prev => ({ ...prev, currentRival: e.target.value }))}>
                      {Object.keys(data.rivals).map(name => <option key={name} value={name}>{name}</option>)}{Object.keys(data.rivals).length === 0 && <option value="">No Rivals Added</option>}
                    </select><button onClick={() => { setRenameValue(data.currentRival || ''); setIsRenaming(true); }} className="text-slate-400 hover:text-white p-2 rounded transition-colors" title="Rename"><Edit2 size={16} /></button></div>
                )}
            </div>
            <div className="flex flex-col gap-1">
                {isMayorTown && <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full w-fit"><Crown size={14} className="text-yellow-500" /><span className="text-xs text-yellow-500 font-bold uppercase">Mayor of {isMayorTown}</span></div>}
                {isGovernorState && <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full w-fit"><Crown size={14} className="text-orange-500" /><span className="text-xs text-orange-500 font-bold uppercase">Governor of {isGovernorState}</span></div>}
            </div>
         </div>
         <div className="flex gap-2 items-center border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-4">
            <button onClick={openImportModal} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-blue-400 py-2 px-3 rounded text-xs font-bold uppercase"><Users size={16} /> Manage Rivals</button>
            <input type="text" placeholder="New Name" value={newRivalName} onChange={e => setNewRivalName(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white w-32 focus:border-blue-500 outline-none" /><button onClick={addRival} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded transition-colors"><PlusCircle size={18}/></button><button onClick={deleteCurrentRival} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded transition-colors"><Trash2 size={18}/></button>
         </div>
      </div>

      {data.currentRival ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><TrendingUp size={24} /></div>
              <div><div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">This Month</div><div className="text-white text-lg font-bold font-mono">+{growthStats.currentMonth} <span className="text-[10px] text-slate-500 font-normal">P</span></div></div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><CalendarClock size={24} /></div>
              <div><div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Avg / Month</div><div className="text-white text-lg font-bold font-mono">+{growthStats.avgMonthly.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">P</span></div></div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Timer size={24} /></div>
              <div><div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Days Tracked</div><div className="text-white text-lg font-bold font-mono">{growthStats.daysTracked} <span className="text-[10px] text-slate-500 font-normal">Days</span></div></div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><Award size={24} /></div>
              <div><div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Passports</div><div className="text-white text-lg font-bold font-mono">{stats.latestPassports} <span className="text-cyan-400 text-[10px]">+{getPassportBoost(stats.latestPassports)}%</span></div></div>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
               <h3 className="text-white font-bold flex items-center gap-2"><Activity size={18} className="text-blue-400" /> 📈 Portfolio Growth: <span className="text-blue-400">{data.currentRival}</span></h3>
               <div className="flex items-center gap-4">
                  {/* Range Toggles */}
                  <div className="flex items-center gap-3 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Range</span>
                    <div className="flex gap-1 pr-1">
                      {(['WTD', 'MTD', 'YTD', 'ALL'] as TimeRange[]).map((range) => (
                        <button 
                          key={range}
                          onClick={() => setTimeRange(range)}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowMyComparison(!showMyComparison)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${showMyComparison ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-slate-700 text-slate-400 border-slate-600 hover:text-white'}`}>{showMyComparison ? <Check size={14} /> : <ArrowUpDown size={14} />} {showMyComparison ? "Comparison On" : "Compare with Me"}</button>
               </div>
            </div>
            <div className="h-80 w-full min-w-0">
              {combinedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedChartData} barGap={4} barCategoryGap="20%">
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                    <YAxis yAxisId="left" stroke="#4ade80" fontSize={10} name="Parcels" />
                    <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" fontSize={10} name="Earnings" />
                    <YAxis yAxisId="passports" orientation="right" stroke="#22d3ee" fontSize={10} domain={[0, 101]} hide={!showMyComparison && !snapshotEntries.some(s => s.passports)} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} 
                        itemStyle={{ padding: '2px 0' }}
                        formatter={(value: any, name: string) => {
                            if (name.includes("Total Accrued")) return [`$${parseFloat(value).toFixed(2)}`, name];
                            if (name.includes("Earnings")) return [`$${parseFloat(value).toFixed(2)}`, name];
                            return [value, name];
                        }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    
                    {/* Rival Data */}
                    <Bar yAxisId="left" dataKey="parcels" name={`${data.currentRival} Parcels`} fill="#4ade80" fillOpacity={0.4} />
                    <Line yAxisId="right" type="monotone" dataKey="earnings" name={`${data.currentRival} Earnings`} stroke="#60a5fa" strokeWidth={2} dot={{r:3}} connectNulls />
                    <Line yAxisId="passports" type="stepAfter" dataKey="passports" name={`${data.currentRival} Passports`} stroke="#22d3ee" strokeWidth={2} dot={{r:2}} connectNulls />
                    
                    {showMyComparison && (
                      <>
                        {/* User Data - Now using Bar for Parcels */}
                        <Bar yAxisId="left" dataKey="myParcels" name="My Parcels" fill="#f97316" fillOpacity={0.8} />
                        <Line yAxisId="right" type="monotone" dataKey="myTotalAccrued" name="My Total Accrued ($)" stroke="#facc15" strokeWidth={3} dot={{r:4, fill:'#facc15'}} connectNulls />
                        <Line yAxisId="passports" type="stepAfter" dataKey="myPassports" name="My Passports" stroke="#a855f7" strokeWidth={2} strokeDasharray="3 3" dot={{r:2}} connectNulls />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-500">Add snapshots to see chart.</div>}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg transition-all border-l-4 border-l-blue-500">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">{editingId ? "Edit Entry" : "Add Entry"}</h3>
                <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
                 {['SNAPSHOT', 'STATE', 'TOWN', 'COUNTRY', 'EARTH'].map((t) => (<button key={t} onClick={() => setEntryType(t as EntryType)} className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${entryType === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{t}</button>))}
                </div>
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Date:</label>
                <input type="date" value={dateSpotted} onChange={e => setDateSpotted(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
              </div>
              {entryType === 'SNAPSHOT' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Earnings:</label>
                    <input type="number" placeholder="Earnings ($)" value={earnings} onChange={e => setEarnings(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Passports:</label>
                    <input type="number" placeholder="Passports" value={passports} onChange={e => setPassports(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Location Name:</label>
                    <input type="text" placeholder="Location Name" value={townName} onChange={e => setTownName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Rank (#):</label>
                    <input type="number" placeholder="Rank" value={rank} onChange={e => setRank(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Parcels:</label>
                <input type="number" placeholder="Parcels" value={parcels} onChange={e => setParcels(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="md:col-span-2 lg:col-span-1 flex items-end gap-2 pb-0.5">
                <button onClick={handleSaveEntry} className="flex-1 font-bold py-2 px-4 rounded bg-blue-600 text-white shadow-lg text-sm transition-all hover:bg-blue-500 active:scale-95">{editingId ? "Update" : "Add"}</button>
                {editingId && <button onClick={cancelEditing} className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-600 transition-colors">Cancel</button>}
              </div>
            </div>

            {/* Rarity Breakdown — only shown for SNAPSHOT entries */}
            {entryType === 'SNAPSHOT' && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Rarity Breakdown (Optional)</label>
                  {(() => {
                    const c = Number(common) || 0;
                    const r = Number(rare) || 0;
                    const ep = Number(epic) || 0;
                    const lg = Number(legendary) || 0;
                    const rarityTotal = c + r + ep + lg;
                    const total = Number(parcels) || 0;
                    const anyEntered = common !== '' || rare !== '' || epic !== '' || legendary !== '';
                    if (!anyEntered) return null;
                    if (rarityTotal === total) {
                      return <span className="text-[10px] font-bold text-green-400">✓ Sum matches ({rarityTotal})</span>;
                    }
                    return <span className="text-[10px] font-bold text-amber-400">⚠ Sum: {rarityTotal} vs Total: {total}</span>;
                  })()}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Common</label>
                    <input type="number" placeholder="0" value={common} onChange={e => setCommon(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rare</label>
                    <input type="number" placeholder="0" value={rare} onChange={e => setRare(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Epic</label>
                    <input type="number" placeholder="0" value={epic} onChange={e => setEpic(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Legendary</label>
                    <input type="number" placeholder="0" value={legendary} onChange={e => setLegendary(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
             {snapshotEntries.length > 0 && (
                <div className="bg-slate-800 rounded-xl border border-yellow-500/30 shadow-lg overflow-hidden">
                   <div className="p-4 flex flex-col cursor-pointer hover:bg-slate-700/30 transition-colors bg-gradient-to-r from-yellow-900/10 to-transparent" onClick={() => toggleExpand('Portfolio Snapshot')}>
                       <div className="flex items-center justify-between w-full mb-3">
                         <div className="flex items-center gap-4">
                           <div className="bg-yellow-500/20 p-3 rounded-lg text-yellow-500"><LayoutList /></div>
                           <div><h3 className="text-lg font-bold text-white">Portfolio Snapshot</h3><div className="flex gap-4 text-xs text-slate-400"><span>Parcels: <span className="text-green-400 font-bold">{stats.totalPortfolio}</span></span><span>Passports: <span className="text-cyan-400 font-bold">{stats.latestPassports}</span></span></div></div>
                         </div>
                         <button className={`text-slate-400 ${expandedGroups['Portfolio Snapshot'] ? 'rotate-180' : ''} transition-transform`}><ChevronDown /></button>
                       </div>
                       <div className="w-full bg-slate-900 rounded-full h-4 relative border border-slate-700"><div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.trackedPercent}%` }} /><div className="absolute top-0 w-full text-center text-[10px] font-bold text-white">{stats.trackedTotal} / {stats.totalPortfolio} ({stats.trackedPercent.toFixed(1)}%)</div></div>
                   </div>
                   {expandedGroups['Portfolio Snapshot'] && (
                      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                        <table className="w-full text-left text-sm">
                          <thead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                              <th className="p-2">Date</th>
                              <th className="p-2">Parcels</th>
                              <th className="p-2 hidden md:table-cell">Rarity (C / R / E / L)</th>
                              <th className="p-2">Passports</th>
                              <th className="p-2">Earnings ($)</th>
                              <th className="p-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700 text-slate-300">
                            {snapshotEntries.map(e => {
                              const hasRarity = e.common !== undefined || e.rare !== undefined || e.epic !== undefined || e.legendary !== undefined;
                              return (
                                <tr key={e.id}>
                                  <td className="p-2 text-xs">{e.dateSpotted}</td>
                                  <td className="p-2 font-mono text-green-400">{e.parcels}</td>
                                  <td className="p-2 font-mono text-xs hidden md:table-cell">
                                    {hasRarity ? (
                                      <span>
                                        <span className="text-slate-400">{e.common ?? 0}</span>
                                        <span className="text-slate-600"> / </span>
                                        <span className="text-blue-400">{e.rare ?? 0}</span>
                                        <span className="text-slate-600"> / </span>
                                        <span className="text-purple-400">{e.epic ?? 0}</span>
                                        <span className="text-slate-600"> / </span>
                                        <span className="text-yellow-400">{e.legendary ?? 0}</span>
                                      </span>
                                    ) : <span className="text-slate-600">—</span>}
                                  </td>
                                  <td className="p-2 font-mono text-cyan-400">{e.passports || 0}</td>
                                  <td className="p-2 font-mono text-white">${e.earnings?.toFixed(2)}</td>
                                  <td className="p-2 text-right">
                                    <button onClick={() => startEditing(e)} className="text-blue-400 mr-2 p-1 rounded hover:bg-slate-700"><Pencil size={14}/></button>
                                    <button onClick={() => deleteEntry(e.id)} className="text-red-400 p-1 rounded hover:bg-slate-700"><Trash2 size={14}/></button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                   )}
                </div>
             )}
            {/* Known Mayor Of — computed from town data */}
             {mayorTowns.length > 0 && (
               <div className="bg-slate-800 rounded-xl border border-yellow-500/30 shadow-lg overflow-hidden">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors bg-gradient-to-r from-yellow-900/10 to-transparent"
                    onClick={() => setMayorSectionExpanded(!mayorSectionExpanded)}
                  >
                     <div className="flex items-center gap-4">
                        <div className="bg-yellow-500/20 p-3 rounded-lg text-yellow-500">
                           <Crown size={20} />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              Known Mayor Of 
                              <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                 {mayorTowns.length} {mayorTowns.length === 1 ? 'town' : 'towns'}
                              </span>
                           </h3>
                           <div className="text-xs text-slate-400 mt-0.5">
                              Computed from your town observations
                           </div>
                        </div>
                     </div>
                     <button className={`text-slate-400 ${mayorSectionExpanded ? 'rotate-180' : ''} transition-transform`}>
                        <ChevronDown />
                     </button>
                  </div>
                  {mayorSectionExpanded && (
                    <div className="border-t border-slate-700 bg-slate-900/50 p-4 animate-fade-in">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                              <th className="p-2">Town</th>
                              <th className="p-2">Parcels</th>
                              <th className="p-2 hidden md:table-cell">Lead Over #2</th>
                              <th className="p-2 hidden md:table-cell">Last Seen</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700 text-slate-300">
                            {mayorTowns.map(m => {
                              // Highlight safe / contested mayor titles visually
                              const gapColor = 
                                m.gap >= 50 ? 'text-green-400' :
                                m.gap >= 10 ? 'text-yellow-400' :
                                'text-red-400';
                              return (
                                <tr key={m.town} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      <Crown size={12} className="text-yellow-500 flex-shrink-0" />
                                      <div>
                                        <div className="font-bold text-white">{m.town}</div>
                                        {m.state && (
                                          <div className="text-[10px] text-slate-500">
                                            {m.state}{m.country && m.country !== 'USA' ? `, ${m.country}` : ''}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 font-mono text-green-400 font-bold">{m.parcels}</td>
                                  <td className={`p-2 font-mono ${gapColor} hidden md:table-cell`}>
                                    {m.runnerUpName ? (
                                      <span>+{m.gap} <span className="text-slate-600 text-[10px]">vs {m.runnerUpName}</span></span>
                                    ) : (
                                      <span className="text-slate-500">no rival</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-xs text-slate-400 hidden md:table-cell">{m.lastObserved}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 text-[10px] text-slate-500 px-2">
                        <span className="text-green-400">●</span> Safe (50+)&nbsp;&nbsp;
                        <span className="text-yellow-400">●</span> Watch (10–49)&nbsp;&nbsp;
                        <span className="text-red-400">●</span> Contested (under 10)
                      </div>
                    </div>
                  )}
               </div>
             )}

             <div className="space-y-4">
               <h4 className="text-slate-400 font-bold text-xs uppercase flex items-center gap-2 mt-6"><MapPin size={14} className="text-purple-500" /> Town Stats</h4>
               {townKeys.map(town => <GroupCard key={town} name={town} entries={groupedEntries[town]} isExpanded={expandedGroups[town]} toggle={() => toggleExpand(town)} onEdit={startEditing} onDelete={deleteEntry} icon={<MapPin size={16} className="text-purple-400" />} theme="purple" editingId={editingId} />)}
             </div>
          </div>
        </>
      ) : <div className="bg-slate-800 p-12 rounded-xl border border-slate-700 text-center shadow-lg"><h3 className="text-xl text-slate-300 font-bold mb-2">No Rivals Selected</h3><button onClick={openImportModal} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 mx-auto"><Users size={20} /> Manage Rivals</button></div>}
    </div>
  );
};
