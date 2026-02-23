
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, Award, Crown, MapPin, Calculator, Info, Zap, CheckCircle2, Pin, PinOff, Search, ChevronDown, ChevronUp, X, ShieldAlert, Sword, ShieldCheck, AlertTriangle } from 'lucide-react';

// Shared AE Logic Constants
const TIER_LIMITS = [150, 220, 290, 365, 435, 545, 625, 730, 875, 1100, 1500, 1721];
const PASSPORT_LIMITS = [1, 11, 31, 61, 101];

const TIER_DATA = [
  { limit: 150, boost: "30x" },
  { limit: 220, boost: "20x" },
  { limit: 290, boost: "15x" },
  { limit: 365, boost: "12x" },
  { limit: 435, boost: "10x" },
  { limit: 545, boost: "8x" },
  { limit: 625, boost: "7x" },
  { limit: 730, boost: "6x" },
  { limit: 875, boost: "5x" },
  { limit: 1100, boost: "4x" },
  { limit: 1500, boost: "3x" },
  { limit: 1721, boost: "2x" },
];

const PASSPORT_DATA = [
  { level: 0, badges: 0, boost: 0 },
  { level: 1, badges: 1, boost: 5 },
  { level: 2, badges: 11, boost: 10 },
  { level: 3, badges: 31, boost: 15 },
  { level: 4, badges: 61, boost: 20 },
  { level: 5, badges: 101, boost: 25 },
];

const STORAGE_KEYS = {
  RENT: 'atlas_rent_data_v2',
  TOWN: 'atlas_town_data_v2',
  USER: 'atlas_my_username',
  PINNED: 'atlas_pinned_towns'
};

type OppMode = 'ATTACK' | 'DEFEND';

export const StrategyTab: React.FC = () => {
  // --- STATE ---
  const [pinnedTowns, setPinnedTowns] = useState<string[]>([]);
  const [showAllTowns, setShowAllTowns] = useState(false);
  const [townSearch, setTownSearch] = useState('');
  const [showTierModal, setShowTierModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [oppMode, setOppMode] = useState<OppMode>('ATTACK');
  const isInitialized = useRef(false);

  // Load pinned towns on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PINNED);
    if (saved) {
      try {
        setPinnedTowns(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load pinned towns", e);
      }
    }
    isInitialized.current = true;
  }, []);

  // Save pinned towns whenever state changes
  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(pinnedTowns));
    }
  }, [pinnedTowns]);

  const togglePin = (townName: string) => {
    setPinnedTowns(prev => 
      prev.includes(townName) 
        ? prev.filter(t => t !== townName) 
        : [...prev, townName]
    );
  };

  // --- LOAD DATA ---
  const rentData = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RENT);
    return saved ? JSON.parse(saved) : { common: 0, rare: 0, epic: 0, legendary: 0, badgeCount: 0, atlasBucks: 0 };
  }, [localStorage.getItem(STORAGE_KEYS.RENT)]);

  const townData = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TOWN);
    return saved ? JSON.parse(saved) : { towns: {} };
  }, [localStorage.getItem(STORAGE_KEYS.TOWN)]);

  const myUsername = useMemo(() => {
    return localStorage.getItem(STORAGE_KEYS.USER) || 'H1PHOPANONYMOUS';
  }, []);

  const currentAB = rentData.atlasBucks || 0;
  const totalParcels = rentData.common + rentData.rare + rentData.epic + rentData.legendary;
  
  // 1. Tier Jump Calculation
  const tierInfo = useMemo(() => {
    const currentTierIndex = TIER_LIMITS.findIndex(limit => totalParcels <= limit);
    if (currentTierIndex === -1) return null;

    const currentLimit = TIER_LIMITS[currentTierIndex];
    const nextPeak = TIER_LIMITS[currentTierIndex + 1] || TIER_LIMITS[currentTierIndex];
    const totalToNextPeak = nextPeak - totalParcels;

    return {
      currentLimit,
      nextPeak,
      totalToNextPeak,
      abNeeded: totalToNextPeak * 100
    };
  }, [totalParcels]);

  // 2. Passport Boost Calculation
  const passportInfo = useMemo(() => {
    const badges = rentData.badgeCount || 0;
    const nextLimit = PASSPORT_LIMITS.find(limit => badges < limit);
    
    if (nextLimit === undefined) return null;

    const needed = nextLimit - badges;
    const boostLevels = { 1: 5, 11: 10, 31: 15, 61: 20, 101: 25 };
    const nextBoost = (boostLevels as any)[nextLimit];

    return {
      current: badges,
      nextLimit,
      needed,
      nextBoost,
      abNeeded: needed * 200
    };
  }, [rentData.badgeCount]);

  // 3. Process All Potential Opportunities
  const allOpportunities = useMemo(() => {
    const towns = townData.towns || {};
    const opps: any[] = [];
    const userClean = myUsername.trim().toLowerCase();

    Object.entries(towns).forEach(([townName, townInfo]: [string, any]) => {
      const entries = townInfo.entries || [];
      if (entries.length === 0) return;

      const players: Record<string, { parcels: number, date: string }> = {};
      entries.forEach((e: any) => {
        const name = e.name.trim();
        if (!players[name] || new Date(e.date).getTime() >= new Date(players[name].date).getTime()) {
           players[name] = { parcels: e.parcels, date: e.date };
        }
      });

      const sorted = Object.entries(players)
        .map(([name, info]) => ({ name, parcels: info.parcels }))
        .sort((a, b) => b.parcels - a.parcels);
      
      const mayor = sorted[0];
      const mayorNameClean = mayor.name.toLowerCase();
      const isUserMayor = userClean === mayorNameClean;
      const isPinned = pinnedTowns.includes(townName);
      const userParcels = players[myUsername.trim()]?.parcels || 0;
      
      // Challenger logic for Defend Mode
      let challenger = null;
      let challengerParcels = 0;
      let lead = 0;

      if (isUserMayor) {
        if (sorted.length > 1) {
          challenger = sorted[1].name;
          challengerParcels = sorted[1].parcels;
          lead = userParcels - challengerParcels;
        } else {
          lead = userParcels; // Alone in town
        }
      }

      const distance = isUserMayor ? 0 : (mayor.parcels - userParcels) + 1;
      
      opps.push({ 
        townName, 
        mayor: mayor.name, 
        mayorParcels: mayor.parcels, 
        userParcels, 
        distance, 
        isMayor: isUserMayor,
        isPinned,
        cost: distance * 100,
        challenger,
        challengerParcels,
        lead
      });
    });

    return opps.sort((a, b) => {
      // Primary Sort: Pinned Status
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Secondary Sort: Distance/Lead
      if (oppMode === 'ATTACK') return a.distance - b.distance;
      return a.lead - b.lead;
    });
  }, [townData, myUsername, pinnedTowns, oppMode]);

  // Priority list for display
  const displayOpportunities = useMemo(() => {
    if (oppMode === 'ATTACK') {
      return allOpportunities.filter(o => !o.isMayor);
    } else {
      return allOpportunities.filter(o => o.isMayor);
    }
  }, [allOpportunities, oppMode]);

  const filteredOther = useMemo(() => {
    const priorityNames = new Set(displayOpportunities.slice(0, 10).map(o => o.townName));
    const others = allOpportunities.filter(o => !priorityNames.has(o.townName));
    if (!townSearch) return others;
    const s = townSearch.toLowerCase();
    return others.filter(o => o.townName.toLowerCase().includes(s));
  }, [allOpportunities, displayOpportunities, townSearch]);

  return (
    <div className="space-y-6 pb-20">
      {/* --- INFO MODALS --- */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={() => setShowTierModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2"><Zap size={18} className="text-yellow-400" /> Atlas Earth Rent Tiers</h3>
              <button onClick={() => setShowTierModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Boost levels drop as your parcel count increases. SRB (Super Rent Boost) events always provide a 50x boost regardless of your current tier.</p>
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-700">
                  <tr>
                    <th className="py-2">Parcel Range</th>
                    <th className="py-2 text-right">Ad Boost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {TIER_DATA.map((t, idx) => {
                    const prevLimit = idx === 0 ? 0 : TIER_DATA[idx-1].limit;
                    const isActive = totalParcels > prevLimit && totalParcels <= t.limit;
                    return (
                      <tr key={idx} className={`${isActive ? 'bg-yellow-500/10' : ''}`}>
                        <td className={`py-3 ${isActive ? 'text-white font-bold' : 'text-slate-300 font-mono'}`}>
                          {prevLimit + 1} - {t.limit} {isActive && <span className="ml-2 text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Active</span>}
                        </td>
                        <td className={`py-3 text-right font-bold ${isActive ? 'text-yellow-400' : 'text-slate-500'}`}>{t.boost}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="py-3 text-slate-500 font-mono italic">1721+</td>
                    <td className="py-3 text-right font-bold text-slate-600 italic">2x</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showPassportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={() => setShowPassportModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2"><Award size={18} className="text-cyan-400" /> Passport Levels</h3>
              <button onClick={() => setShowPassportModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Badges increase your permanent rent boost across all parcels. This stacks with your active ad boost tier.</p>
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-700">
                  <tr>
                    <th className="py-2">Level</th>
                    <th className="py-2">Badges</th>
                    <th className="py-2 text-right">Perm Boost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {PASSPORT_DATA.map((p, idx) => {
                    const nextLimit = idx === PASSPORT_DATA.length - 1 ? Infinity : PASSPORT_DATA[idx+1].badges;
                    const isActive = rentData.badgeCount >= p.badges && rentData.badgeCount < nextLimit;
                    return (
                      <tr key={idx} className={`${isActive ? 'bg-cyan-500/10' : ''}`}>
                        <td className={`py-3 font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>Lvl {p.level}</td>
                        <td className={`py-3 font-mono ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                          {p.badges}{idx < PASSPORT_DATA.length - 1 ? ` - ${PASSPORT_DATA[idx+1].badges - 1}` : '+'}
                          {isActive && <span className="ml-2 text-[10px] bg-cyan-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Active</span>}
                        </td>
                        <td className={`py-3 text-right font-bold ${isActive ? 'text-cyan-400 text-lg' : 'text-slate-500'}`}>+{p.boost}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calculator className="text-red-400" />
          <div>
            <h2 className="text-xl font-bold text-white">🧠 Strategic Growth Planner</h2>
            <p className="text-slate-400 text-xs">Calculated based on your current inventory and tracker data.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Wallet</div>
          <div className="text-green-400 font-mono font-bold text-lg">{currentAB.toLocaleString()} AB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- LEFT COLUMN: CORE JUMPS --- */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="text-yellow-400" size={18} />
                <h3 className="text-white font-bold">Tier-Jump Strategy</h3>
              </div>
              <button onClick={() => setShowTierModal(true)} className="p-1 text-slate-500 hover:text-white transition-colors" title="View All Tiers">
                <Info size={18} />
              </button>
            </div>
            <div className="p-6">
              {tierInfo ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Current Status</div>
                      <div className="text-white text-2xl font-bold font-mono">{totalParcels} / {tierInfo.currentLimit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Target Peak</div>
                      <div className="text-yellow-400 text-2xl font-bold font-mono">{tierInfo.nextPeak}</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (totalParcels / tierInfo.currentLimit) * 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center">
                      <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">To Peak</div>
                      <div className="text-green-400 text-xl font-bold font-mono">{tierInfo.totalToNextPeak}</div>
                      <div className="text-slate-500 text-[10px]">Parcels Needed</div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center relative overflow-hidden group">
                      <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Cost (AB)</div>
                      <div className={`text-xl font-bold font-mono ${currentAB >= tierInfo.abNeeded ? 'text-green-400' : 'text-blue-400'}`}>
                        {tierInfo.abNeeded.toLocaleString()}
                      </div>
                      <div className="text-slate-500 text-[10px]">Atlas Bucks</div>
                      {currentAB >= tierInfo.abNeeded && (
                        <div className="absolute top-0 right-0 p-1">
                          <CheckCircle2 size={12} className="text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 italic">No tier data available.</div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-cyan-400" size={18} />
                <h3 className="text-white font-bold">Passport Boost Progress</h3>
              </div>
              <button onClick={() => setShowPassportModal(true)} className="p-1 text-slate-500 hover:text-white transition-colors" title="View Boost Levels">
                <Info size={18} />
              </button>
            </div>
            <div className="p-6">
              {passportInfo ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Current Badges</div>
                      <div className="text-white text-3xl font-bold font-mono">{passportInfo.current}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-400 text-sm font-bold">Next: {passportInfo.nextLimit} Badges</div>
                      <div className="text-slate-500 text-xs">+{passportInfo.nextBoost}% Boost</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                      <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Needed</div>
                      <div className="text-cyan-400 text-xl font-bold font-mono">{passportInfo.needed}</div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 relative overflow-hidden">
                      <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">AB Needed</div>
                      <div className={`text-xl font-bold font-mono ${currentAB >= passportInfo.abNeeded ? 'text-green-400' : 'text-white'}`}>
                        {passportInfo.abNeeded.toLocaleString()}
                      </div>
                      {currentAB >= passportInfo.abNeeded && (
                        <div className="absolute top-0 right-0 p-1">
                          <CheckCircle2 size={12} className="text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 italic">Max Badge Level achieved.</div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: OPPORTUNITIES / DEFEND --- */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {oppMode === 'ATTACK' ? <Crown className="text-yellow-500" size={18} /> : <ShieldAlert className="text-orange-500" size={18} />}
                <h3 className="text-white font-bold">{oppMode === 'ATTACK' ? 'Target Opportunities' : 'Town Defense'}</h3>
              </div>
              
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button 
                  onClick={() => setOppMode('ATTACK')}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${oppMode === 'ATTACK' ? 'bg-yellow-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Sword size={12} /> Attack
                </button>
                <button 
                  onClick={() => setOppMode('DEFEND')}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${oppMode === 'DEFEND' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <ShieldCheck size={12} /> Defend
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto min-h-[300px]">
              {displayOpportunities.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  {oppMode === 'ATTACK' ? (
                    <>
                      <MapPin size={48} className="mx-auto opacity-10 mb-4" />
                      <p>No takeover opportunities found.</p>
                    </>
                  ) : (
                    <>
                      <Crown size={48} className="mx-auto opacity-10 mb-4" />
                      <p>You aren't currently Mayor of any tracked towns.</p>
                    </>
                  )}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    <tr>
                      <th className="p-4 w-10"></th>
                      <th className="p-4">Town Name</th>
                      <th className="p-4 text-center">{oppMode === 'ATTACK' ? 'Gap' : 'Lead'}</th>
                      <th className="p-4 text-right">{oppMode === 'ATTACK' ? 'Cost (AB)' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {displayOpportunities.map((opp, idx) => {
                      const canAfford = oppMode === 'ATTACK' && currentAB >= opp.cost;
                      
                      // Row Styling Logic
                      let rowClass = "transition-all group ";
                      if (opp.isPinned) rowClass += "bg-blue-500/5 border-l-2 border-l-blue-500 ";
                      else rowClass += "hover:bg-slate-700/30 border-l-2 border-l-transparent ";
                      
                      if (canAfford) rowClass += "!bg-green-500/10 !border-l-green-500 ";

                      return (
                        <tr key={idx} className={rowClass}>
                          <td className="p-4">
                            <button 
                              onClick={() => togglePin(opp.townName)} 
                              className={`transition-colors ${opp.isPinned ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}
                            >
                              <Pin size={16} className={opp.isPinned ? 'fill-blue-400/20' : ''} />
                            </button>
                          </td>
                          <td className="p-4">
                            <span className="text-white font-bold text-sm block leading-tight">{opp.townName}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                              {oppMode === 'ATTACK' ? `Mayor: ${opp.mayor} (${opp.mayorParcels})` : `Challenger: ${opp.challenger || 'None'}`}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {oppMode === 'ATTACK' ? (
                              <>
                                <div className={`font-bold font-mono text-sm ${canAfford ? 'text-green-400' : 'text-slate-300'}`}>
                                  +{opp.distance}
                                </div>
                                {canAfford && <div className="text-[8px] font-bold text-green-600 uppercase animate-pulse">Affordable</div>}
                              </>
                            ) : (
                              <>
                                <div className={`font-bold font-mono text-sm ${opp.lead > 20 ? 'text-green-400' : opp.lead > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {opp.lead}
                                </div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase">Parcels Lead</div>
                              </>
                            )}
                          </td>
                          <td className="p-4 text-right">
                             {oppMode === 'ATTACK' ? (
                               <span className={`text-sm font-bold font-mono ${canAfford ? 'text-green-400' : 'text-blue-400'}`}>
                                 {opp.cost.toLocaleString()}
                               </span>
                             ) : (
                               <div className="flex flex-col items-end">
                                 {opp.lead <= 5 ? (
                                   <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase bg-red-900/20 px-2 py-1 rounded border border-red-500/20">
                                     <AlertTriangle size={10} /> Danger
                                   </span>
                                 ) : opp.lead <= 15 ? (
                                   <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 uppercase bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/20">
                                     <AlertTriangle size={10} /> Guarded
                                   </span>
                                 ) : (
                                   <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase bg-green-900/20 px-2 py-1 rounded border border-green-500/20">
                                     <ShieldCheck size={10} /> Safe
                                   </span>
                                 )}
                               </div>
                             )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* --- BROWSE ALL SECTION --- */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col overflow-hidden">
            <button 
              onClick={() => setShowAllTowns(!showAllTowns)}
              className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between hover:bg-slate-900 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Search className="text-slate-400" size={18} />
                <h3 className="text-white font-bold">Browse All Tracked Towns</h3>
                <span className="bg-slate-700 text-slate-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{allOpportunities.length} Total</span>
              </div>
              {showAllTowns ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            </button>
            
            {showAllTowns && (
              <div className="animate-fade-in flex-1 flex flex-col bg-slate-900/20">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search town to pin..." 
                        value={townSearch}
                        onChange={(e) => setTownSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600"
                      />
                   </div>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                   {filteredOther.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        {townSearch ? "No matching towns found." : "No other towns tracked."}
                      </div>
                   ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900 text-slate-600 text-[10px] uppercase font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-3 w-10"></th>
                            <th className="p-3">Town</th>
                            <th className="p-3 text-center">{oppMode === 'ATTACK' ? 'Gap' : 'Lead'}</th>
                            <th className="p-3 text-right">{oppMode === 'ATTACK' ? 'AB' : 'Player'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredOther.map((opp, idx) => {
                            const canAfford = !opp.isMayor && currentAB >= opp.cost;
                            
                            return (
                              <tr key={idx} className={`transition-colors group ${canAfford ? 'bg-green-500/5' : 'hover:bg-slate-700/20'}`}>
                                <td className="p-3">
                                  <button 
                                    onClick={() => togglePin(opp.townName)} 
                                    className={`transition-colors ${opp.isPinned ? 'text-blue-400' : 'text-slate-600 hover:text-blue-400'}`}
                                  >
                                    <Pin size={14} className={opp.isPinned ? 'fill-blue-400/20' : ''} />
                                  </button>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-300 font-bold text-xs">{opp.townName}</span>
                                    {opp.isMayor && <Crown size={10} className="text-yellow-500" />}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{opp.mayor} ({opp.mayorParcels})</div>
                                </td>
                                <td className="p-3 text-center">
                                  {opp.isMayor ? (
                                    <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-tighter">Owned</span>
                                  ) : (
                                    <span className={`font-mono text-xs ${canAfford ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                                      +{opp.distance}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono text-xs">
                                  {opp.isMayor ? (
                                    <span className="text-slate-600">—</span>
                                  ) : (
                                    <span className={canAfford ? 'text-green-500/70 font-bold' : 'text-blue-500/70'}>
                                      {opp.cost.toLocaleString()}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
