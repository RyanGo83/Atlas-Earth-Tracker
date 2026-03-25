import React, { useState } from 'react';
import { RentTracker } from './components/RentTracker';
import { RivalTracker } from './components/RivalTracker';
import { TownTracker } from './components/TownTracker';
import { StateTracker } from './components/StateTracker';
import { CountryTracker } from './components/CountryTracker';
import { EarthTracker } from './components/EarthTracker';
import { MiniGameTracker } from './components/MiniGameTracker';
import { StrategyTab } from './components/StrategyTab';
import { ROITracker } from './components/ROITracker';
import { Download, Upload, User, X, Save } from 'lucide-react';

// --- TYPES ---
export enum Tab {
  RENT = 'RENT',
  RIVAL = 'RIVAL',
  TOWN = 'TOWN',
  STATE = 'STATE',
  COUNTRY = 'COUNTRY',
  EARTH = 'EARTH',
  MINIGAME = 'MINIGAME',
  STRATEGY = 'STRATEGY',
  ROI = 'ROI'
}

// Keys used across the app
const STORAGE_KEYS = {
  RENT: 'atlas_rent_data_v2',
  RIVAL: 'atlas_rival_data_v2',
  TOWN: 'atlas_town_data_v2',
  STATE: 'atlas_state_data_v2',
  COUNTRY: 'atlas_country_data_v2',
  EARTH: 'atlas_earth_data_v2',
  MINIGAME: 'atlas_minigame_data_v2',
  ROI: 'atlas_roi_data_v2',
  PINNED: 'atlas_pinned_towns',
  USERNAME: 'atlas_my_username',
  HOME_TOWN: 'atlas_home_town'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.RENT);
  // Used to force re-render of components after importing data
  const [refreshKey, setRefreshKey] = useState(0);

  // Profile State
  const [showProfile, setShowProfile] = useState(false);
  const [lastRestored, setLastRestored] = useState<{ time: string; file: string } | null>(() => {
    const stored = localStorage.getItem('atlas_last_restored');
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return { time: stored, file: '' }; }
  });
  const [username, setUsername] = useState(localStorage.getItem(STORAGE_KEYS.USERNAME) || 'H1PHOPANONYMOUS');
  const [homeTown, setHomeTown] = useState(localStorage.getItem(STORAGE_KEYS.HOME_TOWN) || '');

  const saveProfile = () => {
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
    localStorage.setItem(STORAGE_KEYS.HOME_TOWN, homeTown);
    setShowProfile(false);
    setRefreshKey(prev => prev + 1); // Refresh components that use username
  };

  // --- GLOBAL DATA MANAGEMENT ---
  const handleExport = () => {
    const backup: any = {
      _backupDate: new Date().toISOString()
    };
    
    // Map STORAGE_KEYS to backup object keys
    const keyMap: Record<string, string> = {
      RENT: 'rent',
      RIVAL: 'rival',
      TOWN: 'town',
      STATE: 'state',
      COUNTRY: 'country',
      EARTH: 'earth',
      MINIGAME: 'minigame',
      ROI: 'roi',
      PINNED: 'pinned',
      USERNAME: 'username',
      HOME_TOWN: 'homeTown'
    };

    Object.entries(keyMap).forEach(([storageKeyName, backupKey]) => {
      const val = localStorage.getItem((STORAGE_KEYS as any)[storageKeyName]);
      backup[backupKey] = val; // This will be null if not found, which is fine
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        if (!content) {
          alert("File is empty");
          return;
        }

        let backup: any;
        try {
          backup = JSON.parse(content);
        } catch (parseErr) {
          alert("Failed to parse JSON: " + (parseErr instanceof Error ? parseErr.message : String(parseErr)));
          return;
        }

        console.log("Importing data:", backup);
        
        // Helper to safely restore string or object data
        const restore = (key: string, data: any) => {
          if (data === undefined || data === null) return false;
          try {
            const valToStore = typeof data === 'string' ? data : JSON.stringify(data);
            localStorage.setItem(key, valToStore);
            return true;
          } catch (err) {
            console.error(`Failed to restore ${key}:`, err);
            return false;
          }
        };

        // 1. Check if it's a RAW data file (not a backup wrapper).
        // A standard backup always has at least one of these keys.
        const standardBackupKeys = ['rent', 'rival', 'town', 'state', 'minigame', 'roi', 'country', 'earth'];
        const isArray = Array.isArray(backup);
        const hasAnyStandardKey = !isArray && standardBackupKeys.some(k => backup[k] !== undefined);

        if (!hasAnyStandardKey) {
          console.log("Identifying raw data file...");
          let identified = false;
          
          if (!isArray) {
            if (backup.common !== undefined || backup.rare !== undefined) {
              if (restore(STORAGE_KEYS.RENT, backup)) { identified = true; alert("Imported: Raw Rent Data"); }
            } else if (backup.towns) {
              if (restore(STORAGE_KEYS.TOWN, backup)) { identified = true; alert("Imported: Raw Town Data"); }
            } else if (backup.states) {
              if (restore(STORAGE_KEYS.STATE, backup)) { identified = true; alert("Imported: Raw State Data"); }
            } else if (backup.rivals) {
              if (restore(STORAGE_KEYS.RIVAL, backup)) { identified = true; alert("Imported: Raw Rival Data"); }
            } else if (backup.countries) {
              if (restore(STORAGE_KEYS.COUNTRY, backup)) { identified = true; alert("Imported: Raw Country Data"); }
            } else if (backup.regions) {
              if (restore(STORAGE_KEYS.EARTH, backup)) { identified = true; alert("Imported: Raw Earth Data"); }
            } else if (backup.purchases) {
              if (restore(STORAGE_KEYS.ROI, backup)) { identified = true; alert("Imported: Raw ROI Data"); }
            }
          } else if (backup.length > 0 && (backup[0].game || backup[0].winnings !== undefined)) {
            if (restore(STORAGE_KEYS.MINIGAME, backup)) { identified = true; alert("Imported: Raw MiniGame Data"); }
          }
          
          if (identified) {
            const restoreInfo = { time: new Date().toLocaleString(), file: file.name };
            localStorage.setItem('atlas_last_restored', JSON.stringify(restoreInfo));
            window.location.reload();
            return;
          }
        }

        // 2. Standard Backup Import
        let importedCount = 0;
        const results: string[] = [];

        const sections = [
          { key: STORAGE_KEYS.RENT, data: backup.rent, label: "Rent" },
          { key: STORAGE_KEYS.RIVAL, data: backup.rival, label: "Rivals" },
          { key: STORAGE_KEYS.TOWN, data: backup.town, label: "Towns" },
          { key: STORAGE_KEYS.STATE, data: backup.state, label: "States" },
          { key: STORAGE_KEYS.COUNTRY, data: backup.country || backup.countries, label: "Country" },
          { key: STORAGE_KEYS.EARTH, data: backup.earth || backup.regions, label: "Earth" },
          { key: STORAGE_KEYS.MINIGAME, data: backup.minigame || backup.minigames, label: "MiniGames" },
          { key: STORAGE_KEYS.ROI, data: backup.roi, label: "ROI" },
          { key: STORAGE_KEYS.PINNED, data: backup.pinned || backup.pinnedTowns, label: "Pinned Towns" },
          { key: STORAGE_KEYS.USERNAME, data: backup.username, label: "Username" },
          { key: STORAGE_KEYS.HOME_TOWN, data: backup.homeTown || backup.hometown, label: "Home Town" }
        ];

        sections.forEach(s => {
          if (restore(s.key, s.data)) {
            importedCount++;
            results.push(s.label);
          }
        });
        
        if (importedCount > 0) {
          const restoreInfo = { time: new Date().toLocaleString(), file: file.name };
          localStorage.setItem('atlas_last_restored', JSON.stringify(restoreInfo));
          alert(`Successfully imported ${importedCount} sections: ${results.join(", ")}.\n\nThe app will now reload to apply your data.`);
          window.location.reload();
        } else {
          alert("No recognizable data found in this file. Make sure it's a valid Atlas Earth Tracker backup.");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("An unexpected error occurred during import.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  // Helper to render the active component
  const renderContent = () => {
    switch (activeTab) {
      case Tab.RENT: return <RentTracker key={refreshKey} />;
      case Tab.RIVAL: return <RivalTracker key={refreshKey} />;
      case Tab.TOWN: return <TownTracker key={refreshKey} />;
      case Tab.STATE: return <StateTracker key={refreshKey} />;
      case Tab.COUNTRY: return <CountryTracker key={refreshKey} />;
      case Tab.EARTH: return <EarthTracker key={refreshKey} />;
      case Tab.MINIGAME: return <MiniGameTracker key={refreshKey} />;
      case Tab.STRATEGY: return <StrategyTab key={refreshKey} />;
      case Tab.ROI: return <ROITracker key={refreshKey} />;
      default: return <RentTracker key={refreshKey} />;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header / Nav Section */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold text-white">Atlas Earth Tracker</h1>
          
          {/* Global Actions */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2 relative items-center">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border transition-colors text-sm ${
                  showProfile 
                    ? 'bg-slate-600 text-white border-slate-500' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-700'
                }`}
              >
                <User size={16} /> Profile
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-green-400 px-4 py-2 rounded-lg font-bold border border-green-400/30 transition-colors text-sm"
              >
                <Download size={16} /> Backup All
              </button>
              <label className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-blue-400 px-4 py-2 rounded-lg font-bold border border-blue-400/30 cursor-pointer transition-colors text-sm">
                <Upload size={16} /> Restore
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
            {lastRestored && (
              <span className="text-[10px] text-slate-500">
                Last restored: {lastRestored.time}{lastRestored.file ? ` — ${lastRestored.file}` : ''}
              </span>
            )}

            {/* Profile Settings Dropdown/Modal */}
            {showProfile && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <User size={18} className="text-blue-400" /> Profile Settings
                  </h3>
                  <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Home Town</label>
                    <input 
                      type="text" 
                      value={homeTown}
                      onChange={(e) => setHomeTown(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                      placeholder="Enter home town"
                    />
                  </div>
                  <button 
                    onClick={saveProfile}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Save size={18} /> Save Profile
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to CLEAR ALL DATA? This cannot be undone.")) {
                        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
                        alert("All data cleared.");
                        window.location.reload();
                      }
                    }}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-bold border border-red-500/30 transition-colors text-sm"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Tabs */}
<nav className="bg-slate-800/60 p-4 rounded-xl backdrop-blur-sm border border-slate-700">
  <div className="flex flex-wrap items-center gap-2">
    {/* Group 1: My Stats & Mini Games */}
    <NavButton 
      isActive={activeTab === Tab.RENT} 
      onClick={() => setActiveTab(Tab.RENT)} 
      label="💰 My Stats" 
      activeColor="bg-green-500 text-white"
    />
    <NavButton 
      isActive={activeTab === Tab.MINIGAME} 
      onClick={() => setActiveTab(Tab.MINIGAME)} 
      label="🎮 Mini Games" 
      activeColor="bg-yellow-500 text-black"
    />

    {/* Divider */}
    <span className="text-slate-600 font-bold text-lg select-none">|</span>

    {/* Group 2: Rivals */}
    <NavButton 
      isActive={activeTab === Tab.RIVAL} 
      onClick={() => setActiveTab(Tab.RIVAL)} 
      label="🏆 Rivals" 
      activeColor="bg-blue-500 text-white"
    />

    {/* Divider */}
    <span className="text-slate-600 font-bold text-lg select-none">|</span>

    {/* Group 3: Strategy & ROI */}
    <NavButton 
      isActive={activeTab === Tab.STRATEGY} 
      onClick={() => setActiveTab(Tab.STRATEGY)} 
      label="🧠 Strategy" 
      activeColor="bg-red-500 text-white"
    />
    <NavButton 
      isActive={activeTab === Tab.ROI} 
      onClick={() => setActiveTab(Tab.ROI)} 
      label="📈 ROI" 
      activeColor="bg-cyan-500 text-white"
    />

    {/* Divider */}
    <span className="text-slate-600 font-bold text-lg select-none">|</span>

    {/* Group 4: Location Trackers */}
    <NavButton 
      isActive={activeTab === Tab.TOWN} 
      onClick={() => setActiveTab(Tab.TOWN)} 
      label="📍 Town" 
      activeColor="bg-purple-500 text-white"
    />
    <NavButton 
      isActive={activeTab === Tab.STATE} 
      onClick={() => setActiveTab(Tab.STATE)} 
      label="🗺️ State" 
      activeColor="bg-orange-500 text-white"
    />
    <NavButton 
      isActive={activeTab === Tab.COUNTRY} 
      onClick={() => setActiveTab(Tab.COUNTRY)} 
      label="🌐 Country" 
      activeColor="bg-emerald-500 text-white"
    />
    <NavButton 
      isActive={activeTab === Tab.EARTH} 
      onClick={() => setActiveTab(Tab.EARTH)} 
      label="🌍 Earth" 
      activeColor="bg-cyan-500 text-white"
    />
  </div>
</nav>
      </header>

      {/* Main Content Area - key prop forces re-render on restore */}
      <main className="animate-fade-in" key={refreshKey}>
        {renderContent()}
      </main>
      
      <footer className="mt-12 text-center text-slate-500 text-sm">
        <p>Atlas Earth Tracker • React V2 Refactor</p>
      </footer>
    </div>
  );
};

// --- HELPER COMPONENT: Navigation Button ---
interface NavButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  activeColor: string;
}

const NavButton: React.FC<NavButtonProps> = ({ isActive, onClick, label, activeColor }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:-translate-y-0.5 ${
        isActive 
          ? `${activeColor} shadow-lg` 
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
};

export default App;
