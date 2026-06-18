import React, { useState } from 'react';
import type { ConsentSetting, BrandConsent, RewardItem, TransactionLog } from '../types';
import { 
  Shield, ToggleLeft, ToggleRight, Wallet, History, Settings, 
  HelpCircle, CheckCircle, RefreshCw, ArrowRight, 
  Trash2, Bell, Lock, Database, AlertCircle
} from 'lucide-react';

interface ConsumerPortalProps {
  consentSettings: ConsentSetting[];
  setConsentSettings: React.Dispatch<React.SetStateAction<ConsentSetting[]>>;
  brands: BrandConsent[];
  setBrands: React.Dispatch<React.SetStateAction<BrandConsent[]>>;
  rewards: RewardItem[];
  setRewards: React.Dispatch<React.SetStateAction<RewardItem[]>>;
  transactionLogs: TransactionLog[];
  setTransactionLogs: React.Dispatch<React.SetStateAction<TransactionLog[]>>;
  onNotify: (message: string) => void;
}

export const ConsumerPortal: React.FC<ConsumerPortalProps> = ({
  consentSettings,
  setConsentSettings,
  brands,
  setBrands,
  rewards,
  setRewards,
  transactionLogs,
  setTransactionLogs,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'landing' | 'dashboard' | 'wallet' | 'profile' | 'logs' | 'settings' | 'trust'>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deletingData, setDeletingData] = useState(false);

  // Stats calculation
  const totalEarned = rewards.reduce((sum, item) => {
    if (item.status === 'claimed' && item.amount.startsWith('$')) {
      return sum + parseFloat(item.amount.replace('$', ''));
    }
    return sum;
  }, 0);
  
  const pendingEarned = rewards.reduce((sum, item) => {
    if (item.status === 'available' && item.amount.startsWith('$')) {
      return sum + parseFloat(item.amount.replace('$', ''));
    }
    return sum;
  }, 0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsLoggedIn(true);
      setActiveTab('dashboard');
      onNotify('Logged in successfully as consumer.');
    }
  };

  const toggleCategory = (id: string) => {
    setConsentSettings(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.enabled;
        
        // Log transaction
        const logEntry: TransactionLog = {
          id: `t-${Date.now()}`,
          brandName: 'System Gate',
          dataProduct: `${item.name} sharing ${nextState ? 'enabled' : 'paused'}`,
          accessedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          purpose: 'User consent policy revision',
          rewardPaid: '$0.00',
          status: nextState ? 'Authorized' : 'Revoked'
        };
        setTransactionLogs(prevLogs => [logEntry, ...prevLogs]);
        
        onNotify(`${item.name} sharing is now ${nextState ? 'ACTIVE' : 'PAUSED'}.`);
        return { ...item, enabled: nextState };
      }
      return item;
    }));
  };

  const toggleBrand = (id: string) => {
    setBrands(prev => prev.map(brand => {
      if (brand.id === id) {
        const nextState = !brand.enabled;
        
        // Log transaction
        const logEntry: TransactionLog = {
          id: `t-${Date.now()}`,
          brandName: brand.name,
          dataProduct: `${brand.category} Access`,
          accessedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          purpose: nextState ? 'Data sharing permission reactivated' : 'Revocation of data sharing',
          rewardPaid: '$0.00',
          status: nextState ? 'Authorized' : 'Revoked'
        };
        setTransactionLogs(prevLogs => [logEntry, ...prevLogs]);

        onNotify(`Access for ${brand.name} has been ${nextState ? 'ENABLED' : 'REVOKED'}.`);
        return { ...brand, enabled: nextState, lastAccessed: nextState ? new Date().toISOString().replace('T', ' ').slice(0, 16) : brand.lastAccessed };
      }
      return brand;
    }));
  };

  const claimReward = (id: string) => {
    setRewards(prev => prev.map(reward => {
      if (reward.id === id) {
        onNotify(`Claimed ${reward.title}! Payout is being processed.`);
        return { ...reward, status: 'claimed' };
      }
      return reward;
    }));
  };

  const handleDeleteDataRequest = () => {
    setDeletingData(true);
    setTimeout(() => {
      setDeletingData(false);
      setIsLoggedIn(false);
      setActiveTab('landing');
      
      // Reset consents
      setConsentSettings(prev => prev.map(c => ({ ...c, enabled: false })));
      setBrands(prev => prev.map(b => ({ ...b, enabled: false })));
      onNotify('GDPR Data Purge complete. All personal files and vectors deleted.');
    }, 2000);
  };

  const [connectedSources, setConnectedSources] = useState({
    bank: false,
    retailer: true,
    browser: false,
    receipts: false
  });

  const toggleSource = (source: keyof typeof connectedSources, name: string) => {
    const nextVal = !connectedSources[source];
    setConnectedSources(prev => ({ ...prev, [source]: nextVal }));
    onNotify(`${name} source is now ${nextVal ? 'CONNECTED' : 'DISCONNECTED'}.`);
  };

  if (!isLoggedIn && activeTab !== 'landing') {
    setActiveTab('landing');
  }

  return (
    <div className="space-y-6">
      {/* Consumer Navigation */}
      {isLoggedIn && (
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={14} /> Consent Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database size={14} /> Data Sources
          </button>
          <button 
            onClick={() => setActiveTab('wallet')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'wallet' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet size={14} /> Rewards Wallet
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'logs' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={14} /> Transparency Log
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings size={14} /> Preference Centre
          </button>
          <button 
            onClick={() => setActiveTab('trust')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'trust' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle size={14} /> Trust Hub
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">ID: de-sha-882</span>
            <button 
              onClick={() => { setIsLoggedIn(false); setActiveTab('landing'); onNotify('Logged out.'); }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* 1. Landing Page */}
      {activeTab === 'landing' && (
        <div className="max-w-4xl mx-auto py-8 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
              <Shield size={14} /> Data Autonomy & Trust Layer
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display text-white max-w-2xl mx-auto leading-tight">
              Your Data Has Value. <br />
              <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                Control It. Share It. Benefit From It.
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed">
              Data Aura is an agentic data workspace. Control your digital profile, choose which brands can connect, and earn rewards instantly when your cohorts are accessed.
            </p>
            {!isLoggedIn ? (
              <div className="pt-4 flex justify-center gap-4">
                <a 
                  href="#login-form" 
                  onClick={() => {
                    // Quick scroll to login element or set up state
                    const el = document.getElementById('login-form');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-all duration-200 shadow-lg shadow-emerald-500/15"
                >
                  Get Started
                </a>
                <button 
                  onClick={() => setActiveTab('trust')}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-lg text-sm transition-all duration-200"
                >
                  How it Works
                </button>
              </div>
            ) : (
              <div className="pt-4">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-all duration-200 flex items-center gap-1.5 mx-auto"
                >
                  Enter Consent Dashboard <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-xl space-y-3">
              <div className="p-2 w-10 h-10 bg-emerald-600/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Strict Privacy</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                We never expose itemized records. Brands query high-level aggregated customer segments through secure data rooms.
              </p>
            </div>
            
            <div className="glass-panel p-6 rounded-xl space-y-3">
              <div className="p-2 w-10 h-10 bg-indigo-600/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                <Wallet size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Direct Monetisation</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                When a brand accesses demographic signals you permit, you earn cashback and gift vouchers deposited straight to your wallet.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-xl space-y-3">
              <div className="p-2 w-10 h-10 bg-violet-600/10 rounded-lg text-violet-400 border border-violet-500/20">
                <ToggleRight size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Full Consent Ledger</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Revoke or grant access at any time. Pause specific data types or block brands entirely. Decisions take effect immediately.
              </p>
            </div>
          </div>

          {/* Login Section */}
          {!isLoggedIn && (
            <div id="login-form" className="glass-panel max-w-md mx-auto rounded-xl p-8 border border-slate-800 glow-emerald">
              <h3 className="text-xl font-bold text-white text-center">Access Data Aura</h3>
              <p className="text-slate-400 text-xs text-center mt-1 mb-6">Create a demo profile to start managing your data credentials.</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="glass-input w-full text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input w-full text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm shadow-md transition-all duration-150 active:scale-[0.98]"
                  >
                    Agree & Log In
                  </button>
                </div>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  GDPR & CCPA Compliant Verification
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Consent Dashboard */}
      {isLoggedIn && activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: General Stats */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-slate-800/80 pb-2">Consent Summary</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Active Toggles</span>
                  <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                    {consentSettings.filter(c => c.enabled).length} / {consentSettings.length}
                  </span>
                </div>
                <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Approved Brands</span>
                  <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                    {brands.filter(b => b.enabled).length} / {brands.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-400">
                  <span>Data Trust Registry:</span>
                  <span className="text-emerald-400 font-mono font-semibold">Active & Audited</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-400">
                  <span>Last Ledger Hash:</span>
                  <span className="text-slate-500 font-mono text-[10px]">0x3e8a...ef89</span>
                </div>
              </div>
            </div>

            {/* Right: Wallet Balance Quick Glance */}
            <div className="glass-panel rounded-xl p-5 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white border-b border-slate-800/80 pb-2">Earnings Overview</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Rewards accumulate automatically as your permissioned cohorts are matched with campaigns.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-lg p-4">
                  <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">Unclaimed Wallet Balance</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">${pendingEarned.toFixed(2)}</div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold font-mono">Claimed Lifetime Cash</span>
                  <div className="text-2xl font-extrabold text-white mt-1">${totalEarned.toFixed(2)}</div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold font-mono">Pending Vouchers</span>
                  <div className="text-2xl font-extrabold text-indigo-400 mt-1">
                    {rewards.filter(r => r.status === 'available' && r.type === 'voucher').length} Items
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setActiveTab('wallet')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Wallet size={12} /> View Wallet & Claim Vouchers
                </button>
              </div>
            </div>
          </div>

          {/* Granular Consents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Consent Settings */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Data Category Permissions</h3>
                <p className="text-slate-400 text-xs mt-0.5">Control access by semantic information class.</p>
              </div>

              <div className="space-y-3">
                {consentSettings.map((setting) => (
                  <div key={setting.id} className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-200">{setting.name}</h4>
                        <span className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-emerald-400 rounded">
                          x{setting.rewardWeight} payout weight
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{setting.description}</p>
                    </div>
                    <button 
                      onClick={() => toggleCategory(setting.id)}
                      className={`flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                        setting.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-500'
                      }`}
                    >
                      {setting.enabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Consent Settings */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Brand Connection Registry</h3>
                <p className="text-slate-400 text-xs mt-0.5">Approve or revoke specific marketer agent access.</p>
              </div>

              <div className="space-y-3">
                {brands.map((brand) => (
                  <div key={brand.id} className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl p-1.5 bg-slate-900 rounded border border-slate-800">{brand.logo}</div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{brand.name}</h4>
                        <p className="text-[10px] text-slate-500">{brand.category}</p>
                        {brand.enabled && brand.dataShared.length > 0 && (
                          <div className="flex gap-1.5 mt-1">
                            {brand.dataShared.map((tag, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded text-[9px]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {brand.enabled ? (
                        <div className="text-right hidden sm:block">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Accessed</span>
                          <span className="text-[10px] font-mono text-slate-300 block">{brand.lastAccessed}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Blocked</span>
                      )}
                      
                      <button 
                        onClick={() => toggleBrand(brand.id)}
                        className={`transition-colors duration-200 ${
                          brand.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-500'
                        }`}
                      >
                        {brand.enabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. Connected Sources */}
      {isLoggedIn && activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-xl font-bold text-white">Connected Data Assets</h2>
            <p className="text-slate-400 text-xs mt-1">
              Connect external loyalty accounts and apps. These data sources are localized, encrypted, and compiled into cohorts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Financial Bank Source */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Open Banking Feed (Plaid Integration)</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      connectedSources.bank ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {connectedSources.bank ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Pushes merchant category transaction totals, average order value, and recurring subscriptions to your local context database.
                  </p>
                </div>
                <button
                  onClick={() => toggleSource('bank', 'Banking Plaid feed')}
                  className={`mt-4 w-full py-2 text-xs font-semibold rounded-lg border transition-all ${
                    connectedSources.bank 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                      : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
                  }`}
                >
                  {connectedSources.bank ? 'Disconnect Bank Account' : 'Connect Plaid Safe-Vault'}
                </button>
              </div>

              {/* Retail Loyalty Source */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Retailer Loyalty Cards (Kroger, Target, CVS)</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      connectedSources.retailer ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {connectedSources.retailer ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Direct APIs pulls your SKU history, redemption events, and shopping cart velocity to build premium intent signals.
                  </p>
                </div>
                <button
                  onClick={() => toggleSource('retailer', 'Retailer Loyalty API')}
                  className={`mt-4 w-full py-2 text-xs font-semibold rounded-lg border transition-all ${
                    connectedSources.retailer 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                      : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
                  }`}
                >
                  {connectedSources.retailer ? 'Disconnect Loyalty API' : 'Connect Loyalty Registry'}
                </button>
              </div>

              {/* Browser Behavior Extension */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Privacy browser extension (Local history scanner)</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      connectedSources.browser ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {connectedSources.browser ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Locally aggregates browser categories visited and computes interest nodes. No raw URLs are ever transmitted.
                  </p>
                </div>
                <button
                  onClick={() => toggleSource('browser', 'Browser extension sensor')}
                  className={`mt-4 w-full py-2 text-xs font-semibold rounded-lg border transition-all ${
                    connectedSources.browser 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                      : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
                  }`}
                >
                  {connectedSources.browser ? 'Disconnect Extension' : 'Install Sandbox Browser Extension'}
                </button>
              </div>

              {/* Receipt Upload Scan */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Email & Physical Receipt Upload (OCR Parser)</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      connectedSources.receipts ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {connectedSources.receipts ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Drag and drop shopping receipts or sync with Gmail. Extracts product brand names to feed consumer reward pools.
                  </p>
                </div>
                <button
                  onClick={() => toggleSource('receipts', 'Receipt email sync')}
                  className={`mt-4 w-full py-2 text-xs font-semibold rounded-lg border transition-all ${
                    connectedSources.receipts 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                      : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
                  }`}
                >
                  {connectedSources.receipts ? 'Unlink Email Receipt Feed' : 'Sync Gmail Invoice Inbox'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Rewards Wallet */}
      {isLoggedIn && activeTab === 'wallet' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-xl p-5 text-center flex flex-col justify-between min-h-[160px] border-emerald-500/20">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Total Earnings Available</span>
                <h2 className="text-4xl font-extrabold text-emerald-400 mt-2">${pendingEarned.toFixed(2)}</h2>
                <p className="text-[11px] text-slate-400 mt-1">Ready for withdrawal to bank or voucher</p>
              </div>
              
              <button 
                onClick={() => {
                  if (pendingEarned > 0) {
                    onNotify(`Initiating cash transfer of $${pendingEarned.toFixed(2)} to linked bank account...`);
                    // Change status of cashback items to claimed
                    setRewards(prev => prev.map(item => item.type === 'cashback' ? { ...item, status: 'claimed' } : item));
                  } else {
                    onNotify('No available balance to withdraw.');
                  }
                }}
                className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                Withdraw to Bank Account
              </button>
            </div>

            <div className="glass-panel rounded-xl p-5 text-center flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Claimed Vouchers</span>
                <h2 className="text-4xl font-extrabold text-white mt-2">
                  {rewards.filter(r => r.status === 'claimed').length} Items
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">Redeemed coupons & merchant credits</p>
              </div>
              <button 
                onClick={() => onNotify('Exporting voucher codes to registered email...')}
                className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all"
              >
                Export Voucher Codes
              </button>
            </div>

            <div className="glass-panel rounded-xl p-5 text-center flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Aura Loyalty Points</span>
                <h2 className="text-4xl font-extrabold text-indigo-400 mt-2">350 Pts</h2>
                <p className="text-[11px] text-slate-400 mt-1">Points multiplier: 1.5x active</p>
              </div>
              <button 
                onClick={() => onNotify('Opening Aura points marketplace...')}
                className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all"
              >
                Redeem for Aura Merchandise
              </button>
            </div>
          </div>

          {/* Vouchers and Rewards Catalog */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-bold text-white">Your Earned Rewards & Vouchers</h3>
            
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 rounded-lg text-emerald-400 border border-slate-800 text-lg">
                      {reward.type === 'voucher' ? '🎫' : reward.type === 'cashback' ? '💰' : '⭐'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-200">{reward.title}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">Date: {reward.date}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{reward.description}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block font-semibold">Issuer: {reward.provider}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Value</span>
                      <span className="text-sm font-bold text-slate-200">{reward.amount}</span>
                    </div>

                    {reward.status === 'available' ? (
                      <button
                        onClick={() => claimReward(reward.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Claim Reward
                      </button>
                    ) : reward.status === 'claimed' ? (
                      <span className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-800 rounded-lg flex items-center gap-1">
                        <CheckCircle size={12} className="text-emerald-400" /> Claimed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg flex items-center gap-1">
                        <RefreshCw size={12} className="animate-spin text-amber-400" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Transparency Log */}
      {isLoggedIn && activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Privacy Transparency Log</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Every request made to your data vault is cryptographically logged and permission-checked.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Brand Agent</th>
                    <th className="py-3 px-4">Data Product Queried</th>
                    <th className="py-3 px-4">Accessed At</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4 text-center">Outcome</th>
                    <th className="py-3 px-4 text-right">Reward Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                  {transactionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30">
                      <td className="py-3 px-4 font-semibold text-slate-200">{log.brandName}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">{log.dataProduct}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{log.accessedAt}</td>
                      <td className="py-3 px-4 text-slate-400">{log.purpose}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          log.status === 'Authorized' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : log.status === 'Revoked'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${
                        log.rewardPaid !== '$0.00' ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {log.rewardPaid}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Preference Centre */}
      {isLoggedIn && activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass-panel rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Preference Centre</h2>

            {/* Notification settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5"><Bell size={16} /> Notification Triggers</h3>
              
              <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Alert on brand access requests</h4>
                    <p className="text-[10px] text-slate-500">Send push notification when brand requests insight lookup.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-emerald-600 rounded bg-slate-900 border-slate-800" />
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Weekly Wallet Earnings Report</h4>
                    <p className="text-[10px] text-slate-500">Receive summary of value exchanges achieved.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-emerald-600 rounded bg-slate-900 border-slate-800" />
                </div>
              </div>
            </div>

            {/* Privacy preferences */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5"><Lock size={16} /> Privacy Standards</h3>
              <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Enforce Differential Privacy</h4>
                    <p className="text-[10px] text-slate-500">Add mathematical noise to queries to protect precise data node values.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-emerald-600 rounded bg-slate-900 border-slate-800" />
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Minimised Cohort Threshold</h4>
                    <p className="text-[10px] text-slate-500">Block analytics access unless matched in cohort size &gt; 50 users.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-emerald-600 rounded bg-slate-900 border-slate-800" />
                </div>
              </div>
            </div>

            {/* GDPR Purging */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5"><Trash2 size={16} /> GDPR Article 17: Right to Be Forgotten</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Under Article 17, you can request full erasure of your profile. This action instantly purges all identity records, deletes connected files, resets consent signals to zero, and destroys vector embeddings.
              </p>
              
              <button
                onClick={handleDeleteDataRequest}
                disabled={deletingData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-rose-500/10"
              >
                {deletingData ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Deleting Files & Ledger Tokens...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Permanently Delete My Account & Purge Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Trust Page */}
      {activeTab === 'trust' && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Trust & Compliance Architecture</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              How Data Aura guarantees user privacy, anonymisation, and clean room safety under the IAB Tech Lab Agentic Advertising specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-xl space-y-3">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={16} /> Explicit Consent System
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Consent is never pre-checked or hidden behind multi-page terms of service. You control exactly which database dimensions are matched. Disabling a toggle strips that dimension from all active campaign queries instantly.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-3">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={16} /> Clean Room Execution
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Brands do not see your email, phone, or raw transaction logs. Computation occurs inside double-blind clean rooms (like Snowflake or Decentriq). Computations only emit aggregate metrics (e.g. Conversion Lift) back to the brand.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-3">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={16} /> GDPR-First Protocol
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We operate under strict Article 6 (Lawful processing) and Article 17 (Right to erasure) specifications. The platform consent ledger logs all brand actions to ensure compliance verification audits.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-3">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={16} /> Cryptographic Proofs
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your consent records are hash-sealed in real time. We generate transient permission tokens which Brand Agents must attach to any audience request. Requests lacking a valid token are rejected by network routers.
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex gap-4 text-xs text-amber-300 leading-relaxed">
            <AlertCircle size={28} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm mb-1 text-amber-200">Anonymised Matching Policy</span>
              Data Aura never sells list databases to third parties. If a provider offers you "data enrichment lists" outside of clean room matching, they violate the Data Aura Trust standard. Report suspicious actors to the Admin Registry.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
