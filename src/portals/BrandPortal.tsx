import React, { useState } from 'react';
import type { ConsentSetting, BrandConsent, TransactionLog } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { 
  Briefcase, Plus, BarChart3, Database, ShieldAlert, CheckSquare, 
  DollarSign, Sparkles, Send, RefreshCcw, Award, CheckCircle
} from 'lucide-react';

interface BrandPortalProps {
  consentSettings: ConsentSetting[];
  brands: BrandConsent[];
  setTransactionLogs: React.Dispatch<React.SetStateAction<TransactionLog[]>>;
  onNotify: (message: string) => void;
}

export const BrandPortal: React.FC<BrandPortalProps> = ({
  consentSettings,
  brands,
  setTransactionLogs,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder' | 'insights' | 'cleanroom' | 'measurement' | 'pricing'>('dashboard');

  // Verify Nike status for audience builder scaling
  const nikeConsent = brands.find(b => b.id === 'nike')?.enabled ?? false;
  const uberConsent = brands.find(b => b.id === 'uber')?.enabled ?? false;
  const starbucksConsent = brands.find(b => b.id === 'starbucks')?.enabled ?? false;

  // Granular settings count
  const activeCategoriesCount = consentSettings.filter(c => c.enabled).length;

  // Dynamic audience calculation based on consent settings
  const baseAudienceSize = 250000;
  const consentFactor = (activeCategoriesCount / consentSettings.length) * 0.7 + 0.3; // between 30% and 100%
  const brandConsentFactor = (nikeConsent ? 0.4 : 0.05) + (uberConsent ? 0.3 : 0.05) + (starbucksConsent ? 0.3 : 0.05);
  
  const estimatedAudienceSize = Math.floor(baseAudienceSize * consentFactor * brandConsentFactor);

  // Audience builder states
  const [selectedCategory, setSelectedCategory] = useState('apparel');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedIntent, setSelectedIntent] = useState('high');
  const [segmentName, setSegmentName] = useState('High Intent Athletic Shoppers');
  const [incentiveOffer, setIncentiveOffer] = useState('$1.50 Payout / User');
  const [activating, setActivating] = useState(false);

  // Compliance checklist states
  const [complianceChecked, setComplianceChecked] = useState({
    differentialPrivacy: true,
    noPiiExport: true,
    minimumCohortEnabled: true,
    purposeDeclared: true
  });

  const handleActivateCampaign = async () => {
    setActivating(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/v1/aamp/audience/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: 'nike',
          targetCategory: selectedCategory,
          requestedEpsilon: 0.1
        })
      });

      const data = await response.json();
      
      setActivating(false);

      if (!response.ok) {
        onNotify(`Campaign Blocked: ${data.error} (${data.reason})`);
        return;
      }

      onNotify(`Campaign "${segmentName}" activated. Token [${data.cohortToken}] issued. Audience Size: ${data.audienceSize}`);
      
      // Log transaction in user's audit logs
      const logEntry: TransactionLog = {
        id: `t-brand-${Date.now()}`,
        brandName: 'Brand Campaign (AltaStata Runtime)',
        dataProduct: `${segmentName} Cohort (Size: ${data.audienceSize}, DP Noise: ${data.noiseApplied})`,
        accessedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        purpose: `Targeted advertisement: incentive match ${incentiveOffer}`,
        rewardPaid: incentiveOffer.split(' ')[0],
        status: 'Audited via Ledger'
      };
      setTransactionLogs(prev => [logEntry, ...prev]);

    } catch (error) {
      setActivating(false);
      onNotify('Failed to connect to Data Aura Trust Layer backend.');
    }
  };

  // Recharts sample data
  const affinityData = [
    { name: 'Activewear', affinity: 95, size: 45000 },
    { name: 'Coffee & Snacks', affinity: 82, size: 60000 },
    { name: 'Ridesharing', affinity: 74, size: 38000 },
    { name: 'E-commerce', affinity: 89, size: 72000 },
    { name: 'Travel & Flights', affinity: 45, size: 15000 },
    { name: 'Music Streams', affinity: 78, size: 55000 },
  ];

  const conversionLiftData = [
    { day: 'Day 1', Control: 1.8, Test: 2.9 },
    { day: 'Day 3', Control: 2.0, Test: 3.4 },
    { day: 'Day 5', Control: 1.9, Test: 3.8 },
    { day: 'Day 7', Control: 2.1, Test: 4.5 },
    { day: 'Day 9', Control: 2.2, Test: 5.1 },
    { day: 'Day 12', Control: 2.0, Test: 5.4 },
    { day: 'Day 15', Control: 2.3, Test: 5.9 },
  ];

  const mmmAllocationData = [
    { budget: '$0K', StandardROAS: 1.0, ConsentedROAS: 1.0 },
    { budget: '$20K', StandardROAS: 1.8, ConsentedROAS: 2.6 },
    { budget: '$40K', StandardROAS: 2.2, ConsentedROAS: 3.5 },
    { budget: '$60K', StandardROAS: 2.3, ConsentedROAS: 4.2 },
    { budget: '$80K', StandardROAS: 2.1, ConsentedROAS: 4.6 },
    { budget: '$100K', StandardROAS: 1.9, ConsentedROAS: 4.8 },
  ];

  return (
    <div className="space-y-6">
      {/* Brand Portal Nav */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase size={14} /> Brand Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('builder')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'builder' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus size={14} /> Audience Builder
        </button>
        <button 
          onClick={() => setActiveTab('insights')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'insights' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 size={14} /> Insight Explorer
        </button>
        <button 
          onClick={() => setActiveTab('cleanroom')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'cleanroom' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database size={14} /> Snowflake Clean Room
        </button>
        <button 
          onClick={() => setActiveTab('measurement')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'measurement' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award size={14} /> Measurement Hub
        </button>
        <button 
          onClick={() => setActiveTab('pricing')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'pricing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign size={14} /> Pricing & Subscription
        </button>
      </div>

      {/* 1. Brand Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-panel p-5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Active Audiences</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">4 Segments</span>
              <span className="text-[10px] text-emerald-400 mt-1 block font-semibold flex items-center gap-0.5">
                ● 140,500 active profiles
              </span>
            </div>

            <div className="glass-panel p-5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Consented ROAS</span>
              <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">4.8x Average</span>
              <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">
                +110% vs legacy cookie targeting
              </span>
            </div>

            <div className="glass-panel p-5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">CAC Reduction</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">-32.4%</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Reduced ad waste in DSPs</span>
            </div>

            <div className="glass-panel p-5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Data Collaboration Cost</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">$1,450.00</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Incentives paid to consumer wallets</span>
            </div>
          </div>

          {/* Quick Info Alerts */}
          <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded flex items-center gap-1 w-fit">
                <Sparkles size={10} /> ARTF COLLABORATION STRATEGY
              </span>
              <h4 className="text-sm font-semibold text-slate-200">Unlock Premium Retail Media Signals</h4>
              <p className="text-xs text-slate-400 max-w-2xl leading-normal">
                By setting up a joint Snowflake clean room collaboration with consumer agents, you access validated SKU histories directly. You eliminate waste by targeting verified buyers rather than probabilistic device graphs.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('builder')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap self-start md:self-auto"
            >
              Build Consented Audience
            </button>
          </div>

          {/* Active Campaigns Table */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">Active Consented Campaigns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-3">Campaign Segment</th>
                    <th className="py-2.5 px-3">Core Constraint</th>
                    <th className="py-2.5 px-3">Est. Reach</th>
                    <th className="py-2.5 px-3">Wallet Incentive</th>
                    <th className="py-2.5 px-3">Impressions</th>
                    <th className="py-2.5 px-3">Uplift Index</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  <tr>
                    <td className="py-3 px-3 font-semibold">Sports Footwear Intent Cohort</td>
                    <td className="py-3 px-3 text-slate-400">Nike Consent + Purchase History</td>
                    <td className="py-3 px-3 font-mono">45,000 Users</td>
                    <td className="py-3 px-3 text-emerald-400">$1.50 / User</td>
                    <td className="py-3 px-3 font-mono">180,400</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold font-mono">+12.4%</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">Active</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold">Commuters Mobility Segment</td>
                    <td className="py-3 px-3 text-slate-400">Uber Consent + Location Data</td>
                    <td className="py-3 px-3 font-mono">32,500 Users</td>
                    <td className="py-3 px-3 text-emerald-400">$0.80 / User</td>
                    <td className="py-3 px-3 font-mono">120,500</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold font-mono">+8.9%</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">Active</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold">Breakfast Affinity Coffee Shoppers</td>
                    <td className="py-3 px-3 text-slate-400">Starbucks Consent + Purchase History</td>
                    <td className="py-3 px-3 font-mono">60,000 Users</td>
                    <td className="py-3 px-3 text-emerald-400">$0.60 / User</td>
                    <td className="py-3 px-3 font-mono">240,100</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold font-mono">+15.1%</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">Active</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold">Premium Travel High-Spend Cohort</td>
                    <td className="py-3 px-3 text-slate-400">Delta Consent + Bank Metadata</td>
                    <td className="py-3 px-3 font-mono">3,000 Users</td>
                    <td className="py-3 px-3 text-emerald-400">$3.00 / User</td>
                    <td className="py-3 px-3 font-mono">0</td>
                    <td className="py-3 px-3 text-slate-500 font-mono">0.0%</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-semibold text-[10px]">Low Consent</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Audience Builder */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="glass-panel rounded-xl p-5 space-y-5 lg:col-span-2">
            <div>
              <h3 className="text-lg font-bold text-white">Create Consented Cohort Segment</h3>
              <p className="text-slate-400 text-xs mt-0.5">Build segments based on granular user authorization signals.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Segment Name</label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="glass-input w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Category Focus</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="glass-input w-full text-sm"
                  >
                    <option value="apparel">Athletic & Sports Apparel</option>
                    <option value="delivery">Mobility & Food Delivery</option>
                    <option value="beverage">Coffee, Dining & Beverage</option>
                    <option value="travel">Premium Travel & Lodging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Incentive Wallet Multiplier</label>
                  <select
                    value={incentiveOffer}
                    onChange={(e) => setIncentiveOffer(e.target.value)}
                    className="glass-input w-full text-sm"
                  >
                    <option value="$0.50 Payout / User">$0.50 Payout (Low multiplier)</option>
                    <option value="$0.80 Payout / User">$0.80 Payout (Standard multiplier)</option>
                    <option value="$1.50 Payout / User">$1.50 Payout (Recommended for apparel)</option>
                    <option value="$3.00 Payout / User">$3.00 Payout (High intent vault request)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Location Node Constraint</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="glass-input w-full text-sm"
                  >
                    <option value="all">National Cohort Coverage</option>
                    <option value="urban">Major Metro Nodes Only</option>
                    <option value="retail">Within 5mi of Brand Retail Store</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Intent Threshold</label>
                  <select
                    value={selectedIntent}
                    onChange={(e) => setSelectedIntent(e.target.value)}
                    className="glass-input w-full text-sm"
                  >
                    <option value="all">All consenting users (Broad reach)</option>
                    <option value="medium">Past 30-day shoppers</option>
                    <option value="high">Active 7-day cart abandoners</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Compliance checklist wrapper */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckSquare size={14} className="text-indigo-400" /> Compliance Checklist
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={complianceChecked.differentialPrivacy}
                    onChange={(e) => setComplianceChecked({...complianceChecked, differentialPrivacy: e.target.checked})}
                    className="accent-indigo-600 rounded bg-slate-900 border-slate-800" 
                  />
                  Inject Differential Noise (Privacy Safe)
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={complianceChecked.noPiiExport}
                    onChange={(e) => setComplianceChecked({...complianceChecked, noPiiExport: e.target.checked})}
                    className="accent-indigo-600 rounded bg-slate-900 border-slate-800" 
                  />
                  No PII Export (Zero Raw identifiers)
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={complianceChecked.minimumCohortEnabled}
                    onChange={(e) => setComplianceChecked({...complianceChecked, minimumCohortEnabled: e.target.checked})}
                    className="accent-indigo-600 rounded bg-slate-900 border-slate-800" 
                  />
                  Enforce Minimum Cohort &gt; 50 users
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={complianceChecked.purposeDeclared}
                    onChange={(e) => setComplianceChecked({...complianceChecked, purposeDeclared: e.target.checked})}
                    className="accent-indigo-600 rounded bg-slate-900 border-slate-800" 
                  />
                  Declare targeted offer marketing purpose
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleActivateCampaign}
                disabled={activating || !complianceChecked.noPiiExport || !complianceChecked.purposeDeclared}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-semibold rounded-lg text-xs transition-all duration-150 flex items-center gap-1.5 shadow-md shadow-indigo-500/10 active:scale-95"
              >
                {activating ? (
                  <>
                    <RefreshCcw size={14} className="animate-spin" /> Verifying Permission Tokens...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Activate Campaign in Clean Room
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Estimated Reach Panel */}
          <div className="glass-panel rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Target Reach Estimator</h3>
              
              <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Estimated Audience Size</span>
                <span className={`text-3xl font-extrabold ${
                  estimatedAudienceSize < 10000 ? 'text-rose-400' : 'text-emerald-400'
                } mt-1 block font-mono`}>
                  {estimatedAudienceSize.toLocaleString()} Users
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Matched through active ledger tokens</span>
              </div>

              {/* Dynamic consent warning */}
              {!nikeConsent && selectedCategory === 'apparel' && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 space-y-1">
                  <span className="font-bold block flex items-center gap-1">
                    <ShieldAlert size={14} /> Brand Block Active
                  </span>
                  Nike Inc. is currently PAUSED or BLOCKED in the primary consumer's consent dashboard. Increase your wallet incentive offer to encourage consumer opt-in negotiations.
                </div>
              )}

              {nikeConsent && selectedCategory === 'apparel' && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 space-y-1 flex items-start gap-1.5">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-emerald-200">Consent Verified</span>
                    Nike Inc. is whitelisted by consumer agents. Standard cohort extraction tokens have been issued.
                  </div>
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-400">
                  <span>Target Category:</span>
                  <span className="text-white capitalize">{selectedCategory}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-400">
                  <span>Consent Coverage Ratio:</span>
                  <span className="text-white">{(consentFactor * 100).toFixed(0)}% of network</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-400">
                  <span>Est. Media CPM:</span>
                  <span className="text-white">$8.50 (consented premium)</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-800 pt-3">
              Data Aura Trust Core checks client permission signatures before exposing segment matching keys. Real-time updates push to publishers via anonymised SSP tokens.
            </div>
          </div>
        </div>
      )}

      {/* 3. Insight Explorer */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Category Affinity */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300">Category Affinity Indices</h3>
                <p className="text-xs text-slate-500 mt-0.5">Core interest index scores of consented profiles (100 = average index).</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={affinityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="affinity" fill="#6366f1" radius={[4, 4, 0, 0]} name="Affinity Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Purchase Signals & Cohort Size */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300">Consented Cohort Size by Vertical</h3>
                <p className="text-xs text-slate-500 mt-0.5">Representing total addressable users granting category permissions.</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={affinityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="size" fill="#10b981" radius={[0, 4, 4, 0]} name="Profiles Size" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. Snowflake Clean Room */}
      {activeTab === 'cleanroom' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                    SNOWFLAKE NATIVE CLEAN ROOM
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-500">Node Connected</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">Double-Blind Collaboration Chamber</h2>
                <p className="text-slate-400 text-xs mt-0.5">Run queries on joint datasets without revealing raw identity fields.</p>
              </div>
              <button 
                onClick={() => onNotify('Refreshing Snowflake secure schema cache...')}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCcw size={12} /> Sync Schema
              </button>
            </div>

            {/* Diagram of Clean Room */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center my-6">
              <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Brand CRM Data</span>
                <div className="text-xs font-semibold text-slate-200">12,500 Customer Hashes</div>
                <div className="text-[10px] text-slate-500 font-mono">schema: brand_crm.users</div>
              </div>
              
              <div className="flex items-center justify-center text-slate-500">
                <div className="px-3 py-1 border border-slate-800 rounded bg-slate-950 font-mono text-[10px] text-indigo-400">
                  JOIN MATCH KEYS
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Data Aura Consent Profiles</span>
                <div className="text-xs font-semibold text-slate-200">Consented Lifestyle & SKU Index</div>
                <div className="text-[10px] text-slate-500 font-mono">schema: aura_consent.active_cohorts</div>
              </div>
            </div>

            {/* SQL Terminal Simulator */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 font-mono">Secure SQL Editor</span>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-indigo-300 space-y-2 select-all leading-relaxed">
                <div>
                  <span className="text-slate-500">-- Compute purchase lift indices on double-blind joint cohort</span>
                </div>
                <div>
                  <span className="text-indigo-400">SELECT</span> c.cohort_name, <span className="text-indigo-400">COUNT</span>(c.user_token) <span className="text-indigo-400">as</span> total_matched, <span className="text-indigo-400">AVG</span>(t.amount) <span className="text-indigo-400">as</span> avg_order_val
                </div>
                <div>
                  <span className="text-indigo-400">FROM</span> aura_consent.active_cohorts c
                </div>
                <div>
                  <span className="text-indigo-400">JOIN</span> brand_crm.users u <span className="text-indigo-400">ON</span> c.match_key_hash = u.hashed_email
                </div>
                <div>
                  <span className="text-indigo-400">WHERE</span> c.brand_id = <span className="text-emerald-400">'nike'</span> <span className="text-indigo-400">AND</span> c.consent_status = <span className="text-emerald-400">'AUTHORIZED'</span>
                </div>
                <div>
                  <span className="text-indigo-400">GROUP BY</span> c.cohort_name;
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 leading-normal">
              Note: clean room queries run inside isolated Snowflake virtual warehouses. Data Aura trust guards intercept queries to ensure differential privacy limits are satisfied. No raw customer attributes escape the container.
            </div>
          </div>
        </div>
      )}

      {/* 5. Measurement Hub */}
      {activeTab === 'measurement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Conversion Lift (Control vs Test) */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300">Conversion Rate Lift %</h3>
                <p className="text-xs text-slate-500 mt-0.5">Test (Consented Customer Cohorts) vs Control (Legacy Non-Consent Targeting).</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={conversionLiftData}>
                    <defs>
                      <linearGradient id="colorTest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorControl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Conversion %', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10 } }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="Test" stroke="#10b981" fillOpacity={1} fill="url(#colorTest)" name="Consented Segment (Test)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Control" stroke="#6366f1" fillOpacity={1} fill="url(#colorControl)" name="Legacy Cookieless (Control)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Spend Efficiency (MMM Optimization Curves) */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300">ROAS Spend Decay Curve (MMM Modeling)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculated ROAS curve showing saturation thresholds.</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mmmAllocationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="budget" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="ConsentedROAS" stroke="#8b5cf6" name="Aura Consented Channel" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="StandardROAS" stroke="#64748b" name="Legacy Media DSP" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. Pricing & Subscription */}
      {activeTab === 'pricing' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Pricing & Platform Subscriptions</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Choose the volume tier that aligns with your active media spend and clean room requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="glass-panel p-6 rounded-xl space-y-4 relative flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-300">Starter Pilot</h3>
                <div className="text-3xl font-extrabold text-white">$490 <span className="text-xs text-slate-500">/ Month</span></div>
                <p className="text-xs text-slate-400">Ideal for testing clean room matches on single CRM segment.</p>
                <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-300">
                  <div>✔ 1 Active Consented Segment</div>
                  <div>✔ Direct SSP activation token exports</div>
                  <div>✔ Basic Measurement uplift reporting</div>
                  <div>✘ Snowflake clean room API query module</div>
                </div>
              </div>
              <button 
                onClick={() => onNotify('Starter Pilot checkout initialized...')}
                className="w-full py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-lg text-xs font-semibold text-slate-300"
              >
                Select Starter Plan
              </button>
            </div>

            {/* Tier 2 */}
            <div className="glass-panel p-6 rounded-xl space-y-4 border-indigo-500/20 relative flex flex-col justify-between glow-indigo">
              <div className="absolute top-0 right-4 -translate-y-1/2 bg-indigo-600 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                Recommended
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-indigo-400">Growth Brand</h3>
                <div className="text-3xl font-extrabold text-white">$1,990 <span className="text-xs text-slate-500">/ Month</span></div>
                <p className="text-xs text-slate-400">Best for brands scaling multiple clean room activation channels.</p>
                <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-300">
                  <div>✔ 5 Active Consented Segments</div>
                  <div>✔ Full Snowflake & Decentriq clean room modules</div>
                  <div>✔ Real-time AAMP agent query updates</div>
                  <div>✔ Incrementality & multi-touch measurement</div>
                </div>
              </div>
              <button
                onClick={() => onNotify('Growth Plan checkout initialized...')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-md shadow-indigo-500/20"
              >
                Upgrade to Growth
              </button>
            </div>

            {/* Tier 3 */}
            <div className="glass-panel p-6 rounded-xl space-y-4 relative flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-300">Enterprise Suite</h3>
                <div className="text-3xl font-extrabold text-white">Custom <span className="text-xs text-slate-500">/ Volume</span></div>
                <p className="text-xs text-slate-400">For retail networks running specialized agent services.</p>
                <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-300">
                  <div>✔ Unlimited Consented Segments</div>
                  <div>✔ Deploy custom marketplace containers</div>
                  <div>✔ SLA Match Rate guarantees & API endpoints</div>
                  <div>✔ 24/7 compliance auditing support</div>
                </div>
              </div>
              <button 
                onClick={() => onNotify('Enterprise Sales request dispatched...')}
                className="w-full py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-lg text-xs font-semibold text-slate-300"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
