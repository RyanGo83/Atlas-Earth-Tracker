
import React, { useState, useEffect, useRef } from 'react';
import { Trash2, ChevronDown, ChevronUp, Trophy, Calendar, Medal, Gamepad2, History } from 'lucide-react';

interface GameEntry {
  id: number;
  game: string;
  date: string;
  rank: number;
  winnings: number;
}

const STORAGE_KEY = 'atlas_minigame_data_v2';

export const MiniGameTracker: React.FC = () => {
  const [data, setData] = useState<GameEntry[]>([]);
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});

  // Form Inputs
  const [game, setGame] = useState('🎳 Bowling');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rank, setRank] = useState('');
  const [winnings, setWinnings] = useState('');
  const isInitialized = useRef(false);

  // --- LOAD/SAVE ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setData(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  // --- ACTIONS ---
  const addEntry = () => {
    if (!date || !rank) return;
    const newEntry: GameEntry = {
      id: Date.now(),
      game,
      date,
      rank: parseInt(rank),
      winnings: parseInt(winnings) || 0
    };
    setData(prev => [...prev, newEntry]);
    setRank('');
    setWinnings('');
  };

  const deleteEntry = (id: number) => {
    if (window.confirm("Delete this result?")) {
      setData(prev => prev.filter(e => e.id !== id));
    }
  };

  const toggleExpand = (gameName: string) => {
    setExpandedGames(prev => ({ ...prev, [gameName]: !prev[gameName] }));
  };

  // --- STATS ---
  const totalWinnings = data.reduce((acc, curr) => acc + (curr.winnings || 0), 0);
  const bestWin = data.length > 0 ? Math.max(...data.map(d => d.winnings || 0)) : 0;

  // --- GROUPING & SORTING ---
  const uniqueGames = Array.from(new Set(data.map(d => d.game))).sort();

  return (
    <div className="space-y-6">
      
      {/* --- STATS DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
                  <Medal size={24} />
               </div>
               <div>
                  <div className="text-slate-400 text-xs font-bold uppercase">Total Won</div>
                  <div className="text-white text-xl font-bold font-mono text-green-400">+{totalWinnings} AB</div>
               </div>
            </div>
         </div>
         
         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                  <Gamepad2 size={24} />
               </div>
               <div>
                  <div className="text-slate-400 text-xs font-bold uppercase">Games Played</div>
                  <div className="text-white text-xl font-bold font-mono">{data.length}</div>
               </div>
            </div>
         </div>

         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-400">
                  <Trophy size={24} />
               </div>
               <div>
                  <div className="text-slate-400 text-xs font-bold uppercase">Best Payout</div>
                  <div className="text-white text-xl font-bold font-mono">{bestWin} AB</div>
               </div>
            </div>
         </div>
      </div>

      {/* Input Section */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
           <Gamepad2 className="text-purple-500" />
           <h2 className="text-xl font-bold text-white">Add Tournament Result</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-1">
             <label className="block text-slate-400 text-sm font-bold mb-1">Game</label>
             <select value={game} onChange={e => setGame(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white">
                <option>🎳 Bowling</option>
                <option>🎣 Fishing</option>
                <option>⛳ Golf</option>
                <option>🏎️ Racer</option>
                <option>🚢 Warship</option>
                <option>✊ Rock Paper Scissors</option>
             </select>
          </div>
          <div className="md:col-span-1">
             <label className="block text-slate-400 text-sm font-bold mb-1">Date</label>
             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
          </div>
          <div className="md:col-span-1">
             <label className="block text-slate-400 text-sm font-bold mb-1">Rank</label>
             <input type="number" placeholder="#" value={rank} onChange={e => setRank(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
          </div>
          <div className="md:col-span-1">
             <label className="block text-slate-400 text-sm font-bold mb-1">Winnings (AB)</label>
             <input type="number" placeholder="AB" value={winnings} onChange={e => setWinnings(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
          </div>
          <div className="md:col-span-1">
             <button onClick={addEntry} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold p-2 rounded transition-colors shadow-lg">ADD RESULT</button>
          </div>
        </div>
      </div>

      {/* Game Sections */}
      <div className="space-y-6">
         {uniqueGames.length === 0 && (
            <div className="text-center p-8 text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
               No mini-game data recorded yet. Add your first result above!
            </div>
         )}

         {/* Fixed: Explicitly typed gameName as string to avoid inference errors */}
         {uniqueGames.map((gameName: string) => {
            const entries = data.filter(d => d.game === gameName);
            // Best Result: Lowest Rank (primary), then Highest Winnings (secondary)
            const bestEntry = [...entries].sort((a,b) => (a.rank - b.rank) || (b.winnings - a.winnings))[0];
            
            // History: Sorted by Rank Ascending (1st is best), then Date Descending (Newest first)
            const history = [...entries].sort((a,b) => {
               const rankDiff = a.rank - b.rank;
               if (rankDiff !== 0) return rankDiff;
               return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            
            const isExpanded = expandedGames[gameName];

            return (
               <div key={gameName} className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden transition-all duration-300">
                  {/* Header / Top Result Summary */}
                  <div 
                     className="p-4 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
                     onClick={() => toggleExpand(gameName)}
                  >
                     <div className="flex items-center gap-4 flex-1">
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-600 shadow-inner w-14 h-14 flex items-center justify-center">
                           {/* Extract Icon from string if possible, or just first char */}
                           <span className="text-2xl">{gameName.split(' ')[0]}</span>
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-white">{gameName.substring(2).trim() || gameName}</h3>
                           <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
                              <span className="text-yellow-400 font-bold flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded">
                                 <Trophy size={12} /> Best Rank: #{bestEntry.rank}
                              </span>
                              <span className="text-green-400 font-bold flex items-center gap-1 bg-green-400/10 px-2 py-0.5 rounded">
                                 Top Payout: {bestEntry.winnings} AB
                              </span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="text-right hidden md:block mr-4">
                           <div className="text-slate-500 text-xs uppercase font-bold">Latest Entry</div>
                           <div className="text-slate-300 text-sm">{history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date}</div>
                        </div>
                        <button className={`p-2 rounded-full bg-slate-700 text-slate-300 hover:text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                           <ChevronDown size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Expanded History Table */}
                  {isExpanded && (
                     <div className="border-t border-slate-700 bg-slate-900/50 p-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-4 px-2">
                           <h4 className="text-slate-400 font-bold text-sm uppercase flex items-center gap-2"><History size={16}/> Full History (Sorted by Rank)</h4>
                           <span className="text-slate-500 text-xs">{entries.length} records</span>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-700">
                           <table className="w-full text-left text-sm">
                              <thead className="bg-slate-800 text-slate-400 font-bold">
                                 <tr>
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Winnings</th>
                                    <th className="p-3 text-right">Actions</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700 bg-slate-800/40">
                                 {history.map(entry => (
                                    <tr key={entry.id} className="hover:bg-slate-700/50 transition-colors">
                                       <td className="p-3">
                                          <span className={`${entry.rank === bestEntry.rank ? 'text-yellow-400 font-bold' : 'text-blue-400'}`}>
                                             #{entry.rank}
                                          </span>
                                       </td>
                                       <td className="p-3 text-slate-300">{entry.date}</td>
                                       <td className="p-3 text-green-400 font-mono">{entry.winnings} AB</td>
                                       <td className="p-3 text-right">
                                          <button 
                                             onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} 
                                             className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded"
                                             title="Delete Entry"
                                          >
                                             <Trash2 size={14} />
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
               </div>
            );
         })}
      </div>
    </div>
  );
};
