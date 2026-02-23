
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CreditCard, DollarSign, TrendingUp, TrendingDown, Calendar, Trash2, 
  PlusCircle, Zap, ShieldCheck, History, Info, PieChart, ShoppingBag, Clock, RefreshCw, Pencil, Save, X, ChevronDown
} from 'lucide-react';

// --- CONSTANTS & TYPES ---
const STORAGE_KEY = 'atlas_roi_data_v2';
const RENT_STORAGE_KEY = 'atlas_rent_data_v2';

interface Purchase {
  id: string;
  name: string;
  cost: number;
  ab: number;
  date: string;
  type: 'PACK' | 'SUBSCRIPTION' | 'OTHER';
}

interface ROIData {
  purchases: Purchase[];
}

const PACK_OPTIONS = [
  { ab: 110, cost: 4.99 },
  { ab: 990, cost: 39.99 },
  { ab: 2550, cost: 99.99 },
  { ab: 5150, cost: 199.99 },
  { ab: 12900, cost: 499.99 },
  { ab: 26000, cost: 999.99 },
  { ab: 54000, cost: 1999.00 },
  { ab: 140000, cost: 4999.99 },
  { ab: 290000, cost: 9999.99 },
  { ab: 1490000, cost: 49999.99 },
  { ab: 3200000, cost: 99999.99 }
];

const EXPLORER_CLUB_PRICE = 50.00;
const SEASON_PASS_PRE_PRICE = 9.99;
const SEASON_PASS_STD_PRICE = 14.99;

export const ROITracker: React.FC = () => {
  const [data, setData] = useState<ROIData>({ purchases: [] });
  const [rentData, setRentData] = useState<any>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [showPurchaseGrid, setShowPurchaseGrid] = useState(true);
  const isInitialized = useRef(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Ensure all purchases have valid IDs
        if (parsed.purchases) {
          parsed.purchases = parsed.purchases.map((p: any, idx: number) => ({
            ...p,
            id: p.id ? String(p.id) : `legacy-${Date.now()}-${idx}`
          }));
        }
        setData(parsed);
      } catch (e) {
        console.error("Failed to load ROI data", e);
      }
    }
    isInitialized.current = true;

    const savedRent = localStorage.getItem(RENT_STORAGE_KEY);
    if (savedRent) {
      try {
        setRentData(JSON.parse(savedRent));
      } catch (e) {
        console.error("Failed to load rent data for ROI", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const addPurchase = (name: string, cost: number, ab: number, type: Purchase['type']) => {
    const newPurchase: Purchase = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      cost,
      ab,
      date: new Date().toISOString().split('T')[0],
      type
    };
    setData(prev => ({
      ...prev,
      purchases: [newPurchase, ...prev.purchases]
    }));
  };

  const updatePurchase = (updated: Purchase) => {
    setData(prev => ({
      ...prev,
      purchases: prev.purchases.map(p => p.id === updated.id ? updated : p)
    }));
    setEditingPurchase(null);
  };

  const removePurchase = (e: React.MouseEvent, id: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Using window.confirm explicitly
    const confirmed = window.confirm("Are you sure you want to delete this purchase record?");
    if (confirmed) {
      setData(prev => {
        const targetId = String(id);
        const filtered = prev.purchases.filter(p => String(p.id) !== targetId);
        return {
          ...prev,
          purchases: filtered
        };
      });
      if (editingPurchase?.id === String(id)) {
        setEditingPurchase(null);
      }
    }
  };

  const startEditing = (p: Purchase) => {
    setEditingPurchase(p);
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stats = useMemo(() => {
    const totalInvested = data.purchases.reduce((sum, p) => sum + p.cost, 0);
    const totalABPurchased = data.purchases.reduce((sum, p) => sum + p.ab, 0);
    const totalEarned = rentData?.totalAccrued || 0;
    
    // Reinvested calculation synced with RentTracker formula
    const reinvested = Math.max(0, (rentData?.totalAccrued || 0) - (rentData?.currentBalance || 0) - (rentData?.cashedOut || 0));
    
    // Net Profit now subtracts reinvested amounts as requested
    const netProfit = totalEarned - totalInvested - reinvested;
    const roiPercentage = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    
    const packSpend = data.purchases.filter(p => p.type === 'PACK').reduce((sum, p) => sum + p.cost, 0);
    const subSpend = data.purchases.filter(p => p.type === 'SUBSCRIPTION').reduce((sum, p) => sum + p.cost, 0);
    const otherSpend = data.purchases.filter(p => p.type === 'OTHER').reduce((sum, p) => sum + p.cost, 0);

    return {
      totalInvested,
      totalEarned,
      reinvested,
      netProfit,
      roiPercentage,
      totalABPurchased,
      breakdown: {
        packs: packSpend,
        subs: subSpend,
        other: otherSpend
      }
    };
  }, [data, rentData]);

  return (
    <div className="space-y-6">
      {/* --- DASHBOARD SUMMARY --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
            <CreditCard size={12} className="text-blue-500" /> External Invest
          </div>
          <div className="text-white text-xl font-mono font-bold leading-none">
            ${stats.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Out-of-Pocket Cash</div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
            <DollarSign size={12} className="text-green-500" /> Total Earnings
          </div>
          <div className="text-green-400 text-xl font-mono font-bold leading-none">
            ${stats.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Lifetime Accrued</div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
            <RefreshCw size={12} className="text-orange-500" /> Reinvested
          </div>
          <div className="text-orange-400 text-xl font-mono font-bold leading-none">
            ${stats.reinvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Converted to AB</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-md transition-colors ${stats.netProfit >= 0 ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
            {stats.netProfit >= 0 ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
            Net Position
          </div>
          <div className={`text-xl font-mono font-bold leading-none ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Earnings - Invest - Reinvest</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-md ${stats.roiPercentage >= 0 ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-orange-900/10 border-orange-500/30'}`}>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">
            <PieChart size={12} className="text-cyan-400" /> ROI %
          </div>
          <div className={`text-xl font-mono font-bold leading-none ${stats.roiPercentage >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
            {stats.roiPercentage.toFixed(2)}%
          </div>
          <div className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Realized Return</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* --- PACK PURCHASES GRID --- */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <button 
              onClick={() => setShowPurchaseGrid(!showPurchaseGrid)}
              className="w-full text-left flex items-center justify-between mb-4 border-b border-slate-700 pb-2 group"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-green-400" /> Purchase Atlas Bucks
              </h3>
              <div className={`text-slate-500 group-hover:text-white transition-transform duration-300 ${showPurchaseGrid ? 'rotate-180' : ''}`}>
                <ChevronDown size={20} />
              </div>
            </button>
            {showPurchaseGrid && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
                {PACK_OPTIONS.map((pack) => (
                  <button
                    key={pack.ab}
                    type="button"
                    onClick={() => addPurchase(`${pack.ab} AB Pack`, pack.cost, pack.ab, 'PACK')}
                    className="bg-slate-900 hover:bg-slate-700 border border-slate-600 p-3 rounded-lg flex flex-col items-center transition-all group active:scale-95"
                  >
                    <span className="text-green-400 font-bold text-sm">{pack.ab.toLocaleString()} AB</span>
                    <span className="text-slate-500 text-xs font-mono font-bold group-hover:text-white">${pack.cost.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --- SUBSCRIPTION QUICK ACTIONS --- */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-purple-400" /> Subscription Management
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => addPurchase(`Atlas Explorer Club (Month)`, EXPLORER_CLUB_PRICE, 0, 'SUBSCRIPTION')}
                  className="flex-1 bg-gradient-to-br from-purple-900/50 to-slate-900 border border-purple-500/30 p-4 rounded-xl hover:border-purple-500 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-purple-400 font-bold text-sm uppercase tracking-wider">Atlas Explorer Club</div>
                    <div className="text-white text-[10px]">Standard Monthly Log</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">$50.00</div>
                    <PlusCircle size={16} className="text-purple-400 ml-auto mt-1 group-hover:scale-125 transition-transform" />
                  </div>
                </button>

                <div className="flex-1 bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Sub Spend</div>
                  <div className="text-purple-400 text-xl font-mono font-bold">${stats.breakdown.subs.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => addPurchase(`Season Pass (Pre-order)`, SEASON_PASS_PRE_PRICE, 0, 'SUBSCRIPTION')}
                  className="bg-slate-900 border border-slate-700 hover:border-blue-500/50 p-4 rounded-xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="text-blue-400 font-bold text-xs uppercase tracking-wider">Season Pass</div>
                      <div className="text-slate-500 text-[9px] font-bold">PRE-ORDER PRICE</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono font-bold">$9.99</div>
                    <PlusCircle size={14} className="text-blue-500 ml-auto mt-0.5 group-hover:scale-110 transition-transform" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => addPurchase(`Season Pass (Standard)`, SEASON_PASS_STD_PRICE, 0, 'SUBSCRIPTION')}
                  className="bg-slate-900 border border-slate-700 hover:border-orange-500/50 p-4 rounded-xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <div className="text-orange-400 font-bold text-xs uppercase tracking-wider">Season Pass</div>
                      <div className="text-slate-500 text-[9px] font-bold">MONTHLY PRICE</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono font-bold">$14.99</div>
                    <PlusCircle size={14} className="text-orange-500 ml-auto mt-0.5 group-hover:scale-110 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          {/* --- MANUAL ENTRY / EDIT FORM --- */}
          <div className={`p-6 rounded-xl border shadow-lg transition-all duration-300 ${editingPurchase ? 'bg-slate-800 border-orange-500/50 ring-1 ring-orange-500/20' : 'bg-slate-800 border-slate-700'}`}>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editingPurchase ? <Pencil size={18} className="text-orange-400" /> : <Zap size={18} className="text-yellow-400" />}
                {editingPurchase ? 'Edit Purchase' : 'Manual Entry'}
              </div>
              {editingPurchase && (
                <button 
                  onClick={() => setEditingPurchase(null)}
                  className="text-[10px] text-slate-500 hover:text-white uppercase font-bold flex items-center gap-1 bg-slate-900 px-2 py-1 rounded"
                >
                  <X size={12} /> Cancel
                </button>
              )}
            </h3>
            <div className="grid grid-cols-1 gap-4">
               <ManualEntryForm 
                onAdd={addPurchase} 
                onUpdate={updatePurchase}
                editingPurchase={editingPurchase}
               />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* --- INVESTMENT HISTORY --- */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              <History size={18} className="text-slate-400" /> Investment History
            </h3>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {data.purchases.length === 0 ? (
                <div className="text-center py-20 text-slate-500 flex flex-col items-center">
                  <History size={48} className="opacity-10 mb-2" />
                  <p className="text-sm">No purchases recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.purchases.map((p) => (
                    <div 
                      key={p.id} 
                      className={`p-3 rounded-lg border flex items-center justify-between group transition-all ${editingPurchase?.id === p.id ? 'bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/20' : 'bg-slate-900/50 border-slate-700 hover:bg-slate-900'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${p.type === 'PACK' ? 'bg-green-500/10 text-green-500' : p.type === 'SUBSCRIPTION' ? 'bg-purple-500/10 text-purple-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {p.type === 'PACK' ? <ShoppingBag size={16} /> : p.type === 'SUBSCRIPTION' ? <ShieldCheck size={16} /> : <Zap size={16} />}
                        </div>
                        <div>
                          <div className="text-white text-sm font-bold">{p.name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                            <Calendar size={10} /> {p.date}
                            {p.ab > 0 && <span className="text-green-500">+{p.ab.toLocaleString()} AB</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-4">
                        <div className="text-right mr-2">
                          <div className="text-white font-mono font-bold">${p.cost.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => startEditing(p)}
                            className="text-slate-600 hover:text-blue-400 p-1.5 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => removePurchase(e, p.id)}
                            className="text-slate-600 hover:text-red-500 p-1.5 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
               <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Investment Breakdown</span>
               </div>
               <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-slate-900 p-2 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-500 uppercase">Packs</div>
                    <div className="text-green-400 font-mono">${stats.breakdown.packs.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-500 uppercase">Subs</div>
                    <div className="text-purple-400 font-mono">${stats.breakdown.subs.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-500 uppercase">Other</div>
                    <div className="text-yellow-400 font-mono">${stats.breakdown.other.toFixed(2)}</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManualEntryForm: React.FC<{ 
  onAdd: (name: string, cost: number, ab: number, type: Purchase['type']) => void,
  onUpdate: (updated: Purchase) => void,
  editingPurchase: Purchase | null 
}> = ({ onAdd, onUpdate, editingPurchase }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [ab, setAb] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (editingPurchase) {
      setName(editingPurchase.name);
      setCost(editingPurchase.cost.toString());
      setAb(editingPurchase.ab.toString());
      setDate(editingPurchase.date);
    } else {
      setName('');
      setCost('');
      setAb('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingPurchase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost) return;

    if (editingPurchase) {
      onUpdate({
        ...editingPurchase,
        name,
        cost: parseFloat(cost),
        ab: parseInt(ab) || 0,
        date
      });
    } else {
      onAdd(name, parseFloat(cost), parseInt(ab) || 0, 'OTHER');
      setName('');
      setCost('');
      setAb('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Item Name</label>
          <input 
            type="text" placeholder="e.g. In-game Purchase" value={name} onChange={e => setName(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs outline-none focus:border-yellow-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date</label>
          <input 
            type="date" value={date} onChange={e => setDate(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs outline-none focus:border-yellow-500 transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cost ($)</label>
          <input 
            type="number" step="0.01" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs outline-none focus:border-yellow-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">AB Received (Optional)</label>
          <input 
            type="number" placeholder="0" value={ab} onChange={e => setAb(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs outline-none focus:border-yellow-500 transition-colors"
          />
        </div>
      </div>
      <button 
        type="submit"
        className={`w-full font-bold py-2.5 rounded text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${editingPurchase ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-yellow-400 border border-yellow-400/20'}`}
      >
        {editingPurchase ? <Save size={16} /> : <PlusCircle size={16} />}
        {editingPurchase ? 'Update Purchase Record' : 'Log Manual Purchase'}
      </button>
    </form>
  );
}
