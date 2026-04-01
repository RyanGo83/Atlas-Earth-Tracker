
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ComposedChart, Bar
} from 'recharts';
import { AlertTriangle, TrendingUp, Wallet, Settings2, History as HistoryIcon, Clock, Calendar, Landmark, Coins, LayoutDashboard, Activity, User, Save, Check } from 'lucide-react';

// --- TYPES & INTERFACES ---
interface WalletHistoryItem {
  date: string;
  atlasBucks: number;
  diamonds: number;
  currentBalance: number;
  totalAccrued: number; 
  totalParcels?: number;
  passports?: number; 
}

interface RentData {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  atlasBucks: number;
  diamonds: number;
  badgeCount: number;
  boostAdHours: number;
  srbHoursMonth: number;
  currentBalance: number;
  cashedOut: number;
  reinvested: number;
  totalAccrued: number;
  _lastUpdated?: string;
  history?: WalletHistoryItem[];
}

type ChartMode = 'WALLET' | 'PORTFOLIO';
type TimeRange = 'WTD' | 'MTD' | 'YTD' | 'ALL';

// --- CONSTANTS ---
const STORAGE_KEY = 'atlas_rent_data_v2';
const USER_KEY = 'atlas_my_username';
const RATES = { common: 0.0000000011, rare: 0.0000000016, epic: 0.0000000022, legendary: 0.0000000044 };
const TIER_LIMITS = [150, 220, 290, 365, 435, 545, 625, 730, 875, 1100, 1500, 1721];

interface InputCardProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  colorClass: string;
}

const InputCard: React.FC<InputCardProps> = ({ label, value, onChange, colorClass }) => (
  <div className={`p-4 rounded-lg border-2 ${colorClass} bg-opacity-10 bg-slate-800 transition-all focus-within:ring-2 focus-within:ring-blue-500/50`}>
    <label className="block text-sm font-bold mb-2 text-slate-300">{label}</label>
    <input 
      type="number" 
      value={value === 0 ? '' : value} 
      placeholder="0"
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onWheel={(e) => e.currentTarget.blur()}
      className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-blue-500 focus:outline-none font-mono"
    />
  </div>
);

export const RentTracker: React.FC = () => {
  const [data, setData] = useState<RentData>({
    common: 0, rare: 0, epic: 0, legendary: 0,
    atlasBucks: 0, diamonds: 0,
    badgeCount: 0, boostAdHours: 0, srbHoursMonth: 0,
    currentBalance: 0, cashedOut: 0, reinvested: 0, totalAccrued: 0,
    history: []
  });

  const [chartMode, setChartMode] = useState<ChartMode>('WALLET');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [calculatedStats, setCalculatedStats] = useState<any>({});
  const isInitialized = useRef(false);
  
  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.history) parsed.history = [];
        
        parsed.history = parsed.history.map((h: any) => ({
          ...h,
          totalAccrued: h.totalAccrued !== undefined ? h.totalAccrued : (h.currentBalance || 0),
          totalParcels: h.totalParcels !== undefined ? h.totalParcels : 0,
          passports: h.passports !== undefined ? h.passports : 0
        }));

        const today = new Date().toISOString().split('T')[0];
        const hasToday = parsed.history.some((h: any) => h.date === today);
        const hasData = (parsed.common + parsed.rare + parsed.epic + parsed.legendary) > 0 || parsed.totalAccrued > 0;
        
        if (!hasToday && hasData) {
          parsed.history.push({
            date: today,
            atlasBucks: parsed.atlasBucks || 0,
            diamonds: parsed.diamonds || 0,
            currentBalance: parsed.currentBalance || 0,
            totalAccrued: parsed.totalAccrued || 0,
            totalParcels: (parsed.common || 0) + (parsed.rare || 0) + (parsed.epic || 0) + (parsed.legendary || 0),
            passports: parsed.badgeCount || 0
          });
        }

        setData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load rent data", e);
      }
    }
    isInitialized.current = true;
  }, []);

  const getBadgeMultiplier = (count: number) => {
    if (count === 0) return { level: 0, boost: 0, mult: 1.00 };
    if (count <= 10) return { level: 1, boost: 5, mult: 1.05 };
    if (count <= 30) return { level: 2, boost: 10, mult: 1.10 };
    if (count <= 60) return { level: 3, boost: 15, mult: 1.15 };
    if (count <= 100) return { level: 4, boost: 20, mult: 1.20 };
    return { level: 5, boost: 25, mult: 1.25 };
  };

  const getAdBoostMultiplier = (parcels: number) => {
    if (parcels <= 150) return 30;
    if (parcels <= 220) return 20;
    if (parcels <= 290) return 15;
    if (parcels <= 365) return 12;
    if (parcels <= 435) return 10;
    if (parcels <= 545) return 8;
    if (parcels <= 625) return 7;
    if (parcels <= 730) return 6;
    if (parcels <= 875) return 5;
    if (parcels <= 1100) return 4;
    if (parcels <= 1500) return 3;
    return 2; 
  };

  const calculateAll = useCallback(() => {
    const totalParcels = data.common + data.rare + data.epic + data.legendary;
    const badgeInfo = getBadgeMultiplier(data.badgeCount);
    const adMult = getAdBoostMultiplier(totalParcels);

    const basePerSec = 
      (data.common * RATES.common) + 
      (data.rare * RATES.rare) + 
      (data.epic * RATES.epic) + 
      (data.legendary * RATES.legendary);

    const boostedPerSec = basePerSec * badgeInfo.mult * adMult;
    const normalPerSec = basePerSec * badgeInfo.mult;
    const srbPerSec = basePerSec * badgeInfo.mult * 50;

    const normalHours = 24 - data.boostAdHours;
    const dailyIncomeNormal = (normalPerSec * normalHours * 3600) + (boostedPerSec * data.boostAdHours * 3600);
    
    const srbDays = data.srbHoursMonth / 24;
    const normalDays = 30 - srbDays;
    const srbDailyIncome = (normalPerSec * normalHours * 3600) + (srbPerSec * data.boostAdHours * 3600);

    const monthlyIncome = (dailyIncomeNormal * normalDays) + (srbDailyIncome * srbDays);
    const avgDailyIncome = monthlyIncome / 30;

    let nextTierInfo = null;
    for (const limit of TIER_LIMITS) {
        if (totalParcels <= limit) {
            nextTierInfo = { limit, remaining: limit - totalParcels };
            break;
        }
    }

    setCalculatedStats({
      totalParcels,
      badgeInfo,
      adMult,
      dailyIncomeNormal,
      srbDailyIncome,
      avgDailyIncome,
      monthlyIncome,
      yearlyIncome: avgDailyIncome * 365,
      hourlyTotal: avgDailyIncome / 24,
      nextTierInfo
    });
  }, [data]);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, _lastUpdated: new Date().toISOString() }));
    }
    calculateAll();
  }, [data, calculateAll]);

  const updateField = (field: keyof RentData, value: number) => {
    setData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (['atlasBucks', 'diamonds', 'currentBalance', 'totalAccrued', 'common', 'rare', 'epic', 'legendary', 'badgeCount'].includes(field)) {
        const today = new Date().toISOString().split('T')[0];
        let history = [...(prev.history || [])];
        const lastIdx = history.length - 1;
        const totalParcelsCount = newData.common + newData.rare + newData.epic + newData.legendary;

        if (lastIdx >= 0 && history[lastIdx].date === today) {
           history[lastIdx] = {
             ...history[lastIdx],
             atlasBucks: field === 'atlasBucks' ? value : prev.atlasBucks,
             diamonds: field === 'diamonds' ? value : prev.diamonds,
             currentBalance: field === 'currentBalance' ? value : prev.currentBalance,
             totalAccrued: field === 'totalAccrued' ? value : prev.totalAccrued,
             totalParcels: totalParcelsCount,
             passports: newData.badgeCount
           };
        } else {
           history.push({
             date: today,
             atlasBucks: field === 'atlasBucks' ? value : prev.atlasBucks,
             diamonds: field === 'diamonds' ? value : prev.diamonds,
             currentBalance: field === 'currentBalance' ? value : prev.currentBalance,
             totalAccrued: field === 'totalAccrued' ? value : prev.totalAccrued,
             totalParcels: totalParcelsCount,
             passports: newData.badgeCount
           });
        }
        newData.history = history;
      }
      return newData;
    });
  };

  // Filtered History based on time range
  const filteredHistory = useMemo(() => {
    if (!data.history || data.history.length === 0) return [];
    if (timeRange === 'ALL') return data.history;

    const now = new Date();
    if (timeRange === 'WTD') {
      const firstOfWeek = new Date(now);
      firstOfWeek.setDate(now.getDate() - now.getDay());
      firstOfWeek.setHours(0, 0, 0, 0);
      return data.history.filter(h => new Date(h.date) >= firstOfWeek);
    }
    if (timeRange === 'MTD') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return data.history.filter(h => new Date(h.date) >= firstOfMonth);
    }
    if (timeRange === 'YTD') {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      return data.history.filter(h => new Date(h.date) >= firstOfYear);
    }

    return data.history;
  }, [data.history, timeRange]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-4 rounded-xl shadow-md border border-slate-700">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-green-400" />
            <div>
              <h2 className="text-xl font-bold text-white">💰 Rent Calculator</h2>
              <p className="text-slate-400 text-xs">Real-time earnings estimation based on current tier and boosts.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center group hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
              <Clock size={12} className="text-green-500/70" /> Hourly Income
            </div>
            <div className="text-green-400 text-xl font-mono font-bold leading-none group-hover:scale-105 transition-transform">${(calculatedStats.hourlyTotal || 0).toFixed(6)}</div>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center group hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
              <Calendar size={12} className="text-green-500/70" /> Daily (Avg)
            </div>
            <div className="text-green-400 text-xl font-mono font-bold leading-none group-hover:scale-105 transition-transform">${(calculatedStats.avgDailyIncome || 0).toFixed(4)}</div>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center group hover:border-blue-500/30 transition-colors">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
              <Landmark size={12} className="text-blue-500/70" /> Monthly
            </div>
            <div className="text-blue-400 text-xl font-mono font-bold leading-none group-hover:scale-105 transition-transform">${(calculatedStats.monthlyIncome || 0).toFixed(2)}</div>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center group hover:border-yellow-500/30 transition-colors">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
              <Coins size={12} className="text-yellow-500/70" /> Yearly
            </div>
            <div className="text-yellow-400 text-xl font-mono font-bold leading-none group-hover:scale-105 transition-transform">${(calculatedStats.yearlyIncome || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              <Activity size={18} className="text-orange-400" /> Parcel Inventory
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InputCard label="Common" value={data.common} onChange={(v) => updateField('common', v)} colorClass="border-green-500" />
              <InputCard label="Rare" value={data.rare} onChange={(v) => updateField('rare', v)} colorClass="border-blue-500" />
              <InputCard label="Epic" value={data.epic} onChange={(v) => updateField('epic', v)} colorClass="border-purple-500" />
              <InputCard label="Legendary" value={data.legendary} onChange={(v) => updateField('legendary', v)} colorClass="border-yellow-500" />
            </div>
            <div className="mt-4 flex flex-col items-center justify-center p-3 bg-slate-900 rounded-lg border border-slate-600">
              <div className="flex items-baseline gap-2">
                 <span className="text-slate-400 text-sm font-bold">Total Parcels: </span>
                 <span className="text-white text-xl font-bold font-mono">{calculatedStats.totalParcels || 0}</span>
              </div>
              {calculatedStats.nextTierInfo && (
                  <div className={`text-xs font-bold mt-2 flex items-center gap-1.5 transition-all duration-300 px-3 py-1.5 rounded-lg
                      ${calculatedStats.nextTierInfo.remaining <= 5 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' 
                        : 'bg-slate-800 text-slate-500'}`}
                  >
                      {calculatedStats.nextTierInfo.remaining <= 5 && <AlertTriangle size={14} />}
                      {calculatedStats.nextTierInfo.remaining} parcels remaining until next tier drop ({calculatedStats.nextTierInfo.limit})
                  </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              <Wallet size={18} className="text-green-400" /> Wallet Resources
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <InputCard label="Atlas Bucks (AB)" value={data.atlasBucks} onChange={(v) => updateField('atlasBucks', v)} colorClass="border-green-500" />
                  <div className="mt-2 text-right text-xs text-green-400 font-mono">
                     Purchasing Power: {Math.floor((data.atlasBucks || 0) / 100)} Parcels
                  </div>
               </div>
               <div>
                  <InputCard label="Diamonds" value={data.diamonds} onChange={(v) => updateField('diamonds', v)} colorClass="border-cyan-400" />
                  <div className="mt-2 text-right text-xs text-cyan-400 font-mono">
                     Wheel Spins: {Math.floor((data.diamonds || 0) / 2)}
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              <Settings2 size={18} className="text-slate-400" /> Boost Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputCard label="Badges" value={data.badgeCount} onChange={(v) => updateField('badgeCount', v)} colorClass="border-slate-500" />
              <div className="p-3 bg-slate-900 rounded border border-slate-600 flex flex-col justify-center items-center">
                <span className="text-slate-400 text-xs uppercase font-bold">Passport Level</span>
                <span className="text-blue-400 font-bold text-lg">Lvl {calculatedStats.badgeInfo?.level || 0}</span>
                <span className="text-green-400 text-sm font-bold">+{calculatedStats.badgeInfo?.boost || 0}%</span>
              </div>
              <div className="p-3 bg-slate-900 rounded border border-slate-600 flex flex-col justify-center items-center">
                <span className="text-slate-400 text-xs uppercase font-bold">Ad Boost</span>
                <span className="text-yellow-400 font-bold text-2xl font-mono">{calculatedStats.adMult || 30}x</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <InputCard label="Ad Hours/Day" value={data.boostAdHours} onChange={(v) => updateField('boostAdHours', v)} colorClass="border-slate-500" />
              <InputCard label="SRB Hours/Month" value={data.srbHoursMonth} onChange={(v) => updateField('srbHoursMonth', v)} colorClass="border-slate-500" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Balance Management</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <InputCard label="Total Accrued" value={data.totalAccrued} onChange={(v) => updateField('totalAccrued', v)} colorClass="border-slate-500" />
              <InputCard label="Current Balance" value={data.currentBalance} onChange={(v) => updateField('currentBalance', v)} colorClass="border-yellow-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 rounded border border-slate-600">
                <label className="block text-xs font-bold text-slate-400 mb-1">Est. Reinvested</label>
                <div className="text-white font-mono font-bold">
                   ${Math.max(0, data.totalAccrued - data.currentBalance - data.cashedOut).toFixed(2)}
                </div>
              </div>
               <InputCard label="Cashed Out ($)" value={data.cashedOut} onChange={(v) => updateField('cashedOut', v)} colorClass="border-slate-500" />
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
               <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {chartMode === 'WALLET' ? <HistoryIcon size={20} className="text-purple-400" /> : <LayoutDashboard size={20} className="text-orange-400" />}
                    {chartMode === 'WALLET' ? 'Wallet History' : 'Portfolio Growth'}
                  </h3>
                  <p className="text-xs text-slate-500">Historical snapshots of your {chartMode === 'WALLET' ? 'liquid resources' : 'total holdings'}.</p>
               </div>
               
               {/* Mode Switcher */}
               <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 self-end md:self-auto">
                 <button 
                  onClick={() => setChartMode('WALLET')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${chartMode === 'WALLET' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Wallet
                 </button>
                 <button 
                  onClick={() => setChartMode('PORTFOLIO')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${chartMode === 'PORTFOLIO' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   Portfolio
                 </button>
               </div>
            </div>

            {/* Range Toggles (YTD & ALL only) */}
            <div className="flex items-center gap-3 mb-4 bg-slate-900/50 p-2 rounded-xl border border-slate-700 w-fit ml-auto">
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Range</span>
               <div className="flex gap-1 pr-1">
                 {(['YTD', 'ALL'] as TimeRange[]).map((range) => (
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
            
            <div className="h-80 w-full min-w-0">
              {(filteredHistory.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl space-y-2">
                      <HistoryIcon size={32} className="opacity-20" />
                      <p className="text-sm">No history found for this range.</p>
                  </div>
              ) : (
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartMode === 'WALLET' ? (
                          <LineChart data={filteredHistory}>
                            <XAxis 
                                dataKey="date" 
                                stroke="#475569" 
                                fontSize={10} 
                                tickFormatter={(str) => {
                                  const parts = str.split('-');
                                  return parts.length > 2 ? `${parts[1]}/${parts[2]}` : str;
                                }}
                                tickMargin={10}
                            />
                            <YAxis 
                                yAxisId="left" 
                                stroke="#facc15" 
                                fontSize={10} 
                                tickFormatter={(val) => `$${val}`}
                                domain={['auto', 'auto']}
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                stroke="#4ade80" 
                                fontSize={10} 
                                domain={['auto', 'auto']}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                                itemStyle={{ padding: '2px 0' }}
                                formatter={(value: number, name: string) => {
                                    if (name === "Current Balance") return [`$${value.toFixed(4)}`, "Balance"];
                                    return [Math.floor(value), name];
                                }}
                                labelFormatter={(label) => <span className="text-slate-400 font-bold">Date: {label}</span>}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Line 
                                yAxisId="left" 
                                type="monotone" 
                                dataKey="currentBalance" 
                                name="Current Balance" 
                                stroke="#facc15" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: '#0f172a', stroke: '#facc15', strokeWidth: 2 }} 
                                activeDot={{ r: 6, strokeWidth: 0 }} 
                            />
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="atlasBucks" 
                                name="Atlas Bucks" 
                                stroke="#4ade80" 
                                strokeWidth={2} 
                                dot={{ r: 2, fill: '#4ade80' }} 
                            />
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="diamonds" 
                                name="Diamonds" 
                                stroke="#22d3ee" 
                                strokeWidth={2} 
                                dot={{ r: 2, fill: '#22d3ee' }} 
                            />
                          </LineChart>
                        ) : (
                          <ComposedChart data={filteredHistory}>
                            <XAxis 
                                dataKey="date" 
                                stroke="#475569" 
                                fontSize={10} 
                                tickFormatter={(str) => {
                                  const parts = str.split('-');
                                  return parts.length > 2 ? `${parts[1]}/${parts[2]}` : str;
                                }}
                                tickMargin={10}
                            />
                            <YAxis 
                                yAxisId="left" 
                                stroke="#f97316" 
                                fontSize={10} 
                                name="Parcels"
                                domain={['auto', 'auto']}
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                stroke="#facc15" 
                                fontSize={10} 
                                tickFormatter={(val) => `$${val}`}
                                name="Earnings"
                                domain={['auto', 'auto']}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                                itemStyle={{ padding: '2px 0' }}
                                formatter={(value: number, name: string) => {
                                    if (name === "Total Accrued") return [`$${value.toFixed(2)}`, "Total Accrued"];
                                    return [Math.floor(value), name];
                                }}
                                labelFormatter={(label) => <span className="text-slate-400 font-bold">Date: {label}</span>}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Bar 
                                yAxisId="left" 
                                dataKey="totalParcels" 
                                name="My Parcels" 
                                fill="#f97316" 
                                fillOpacity={0.4}
                                radius={[4, 4, 0, 0]}
                            />
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="totalAccrued" 
                                name="Total Accrued ($)" 
                                stroke="#facc15" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: '#0f172a', stroke: '#facc15', strokeWidth: 2 }} 
                                activeDot={{ r: 6, strokeWidth: 0 }} 
                                connectNulls
                            />
                            <Line 
                                yAxisId="left" 
                                type="stepAfter" 
                                dataKey="passports" 
                                name="Passports" 
                                stroke="#a855f7" 
                                strokeWidth={2} 
                                dot={{ r: 2, fill: '#a855f7' }} 
                                connectNulls
                            />
                          </ComposedChart>
                        )}
                    </ResponsiveContainer>
                  </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                   <tr>
                      <th className="p-3">Earning Scenario</th>
                      <th className="p-3 text-right">Estimated Income</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                   <tr><td className="p-3">Normal Boosted Day</td><td className="p-3 text-right font-mono text-green-400 font-bold">${(calculatedStats.dailyIncomeNormal||0).toFixed(5)}</td></tr>
                   <tr><td className="p-3">Super Rent Boost Day</td><td className="p-3 text-right font-mono text-yellow-400 font-bold">${(calculatedStats.srbDailyIncome||0).toFixed(5)}</td></tr>
                   <tr><td className="p-3 text-slate-400">Projected Lifetime (1 Yr)</td><td className="p-3 text-right font-mono text-white font-bold">${(data.totalAccrued + (calculatedStats.yearlyIncome||0)).toFixed(2)}</td></tr>
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}
