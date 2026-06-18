import { useState } from 'react';
import { ConsumerPortal } from './portals/ConsumerPortal';
import { BrandPortal } from './portals/BrandPortal';
import { AdminPortal } from './portals/AdminPortal';
import { AgentMarketplace } from './portals/AgentMarketplace';
import { defaultConsentSettings, defaultBrands, defaultRewards, defaultTransactionLogs } from './mockData';
import type { ConsentSetting, BrandConsent, RewardItem, TransactionLog } from './types';
import { Shield, Briefcase, Cpu, Sliders, Info } from 'lucide-react';

function App() {
  const [activeRole, setActiveRole] = useState<'consumer' | 'brand' | 'admin' | 'marketplace'>('consumer');
  
  // Shared States across all portals
  const [consentSettings, setConsentSettings] = useState<ConsentSetting[]>(defaultConsentSettings);
  const [brands, setBrands] = useState<BrandConsent[]>(defaultBrands);
  const [rewards, setRewards] = useState<RewardItem[]>(defaultRewards);
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>(defaultTransactionLogs);
  
  // Notification Toast State
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-950 text-slate-100">
      
      {/* Platform Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/10">
              dA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white font-display text-lg">Data Aura</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded">
                  ARTF v1.0
                </span>
              </div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mt-0.5">
                Consent & Intelligence OS
              </span>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveRole('consumer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeRole === 'consumer' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield size={14} /> Consumer
            </button>
            <button
              onClick={() => setActiveRole('brand')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeRole === 'brand' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase size={14} /> Brand UI
            </button>
            <button
              onClick={() => setActiveRole('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeRole === 'admin' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders size={14} /> Admin Control
            </button>
            <button
              onClick={() => setActiveRole('marketplace')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeRole === 'marketplace' 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu size={14} /> Agent Market
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Portal Renderer */}
        <div className="animate-fade-in">
          {activeRole === 'consumer' && (
            <ConsumerPortal
              consentSettings={consentSettings}
              setConsentSettings={setConsentSettings}
              brands={brands}
              setBrands={setBrands}
              rewards={rewards}
              setRewards={setRewards}
              transactionLogs={transactionLogs}
              setTransactionLogs={setTransactionLogs}
              onNotify={showNotification}
            />
          )}

          {activeRole === 'brand' && (
            <BrandPortal
              consentSettings={consentSettings}
              brands={brands}
              setTransactionLogs={setTransactionLogs}
              onNotify={showNotification}
            />
          )}

          {activeRole === 'admin' && (
            <AdminPortal
              consentSettings={consentSettings}
              rewards={rewards}
              transactionLogs={transactionLogs}
              onNotify={showNotification}
            />
          )}

          {activeRole === 'marketplace' && (
            <AgentMarketplace
              onNotify={showNotification}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500 mt-12 space-y-2">
        <p>© 2026 Data Aura. Built in conformity with the IAB Tech Lab Agentic Advertising specifications.</p>
        <p className="font-mono text-[9px] tracking-wider text-slate-600">
          SECURE PROTOCOL // AAMP-COMPLIANT SYSTEM LAYER // ZK-PROOF VERIFICATION
        </p>
      </footer>

      {/* Active Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 border border-indigo-500/30 rounded-xl text-xs font-medium text-slate-200 shadow-2xl animate-slide-up glow-indigo">
          <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Info size={14} />
          </div>
          <span>{notification}</span>
        </div>
      )}

    </div>
  );
}

export default App;
