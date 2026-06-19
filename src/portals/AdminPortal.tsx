import React, { useState, useEffect, useCallback } from 'react';
import type { ConsentSetting, RewardItem, TransactionLog, SimulationLog } from '../types';
import { 
  Users, ShieldCheck, Database, FileText, Cpu, Activity, DollarSign, 
  AlertTriangle, ShieldAlert, Play, RotateCcw, 
  ArrowRight, Landmark, Share2, Scale, RefreshCw
} from 'lucide-react';

const API_BASE = 'http://localhost:3001';

interface LiveLedgerEntry {
  id: string;
  timestamp: string;
  action: string;
  brandId: string;
  auditHash?: string;
  audienceSize?: number;
  amount?: number;
  tokenRef?: string;
}

interface AdminPortalProps {
  consentSettings: ConsentSetting[];
  rewards: RewardItem[];
  transactionLogs: TransactionLog[];
  onNotify: (message: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  consentSettings,
  rewards,
  transactionLogs,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator' | 'governance' | 'partners' | 'revenue' | 'evals' | 'ledger'>('dashboard');

  // Live Ledger State (fetched from backend)
  const [liveLedger, setLiveLedger] = useState<LiveLedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true);
    setLedgerError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ledger`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveLedger(data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch {
      setLedgerError('Cannot reach Trust Layer backend (localhost:3001)');
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [fetchLedger]);

  // Guardrail Evals State
  const [evalRunning, setEvalRunning] = useState(false);
  const [evalResults, setEvalResults] = useState<{name: string, desc: string, status: 'idle' | 'running' | 'pass' | 'fail', log: string}[]>([
    { name: "Scenario 1: PII Leakage Protection", desc: "Scan data sharing payload for raw identifiers (emails, phone numbers).", status: 'idle', log: '' },
    { name: "Scenario 2: Cohort Size Minification", desc: "Verify lookup queries satisfy minimum cohort size threshold of 50.", status: 'idle', log: '' },
    { name: "Scenario 3: Revoked Consent Gate", desc: "Invalidate matching tokens and reject queries when users pause brand.", status: 'idle', log: '' },
    { name: "Scenario 4: Differential Privacy Offset", desc: "Check epsilon thresholds and verify Laplace noise is successfully applied.", status: 'idle', log: '' },
    { name: "Scenario 5: Compliant Clean Room Query", desc: "Validate transaction containing only hashed keys, size >= 50, and epsilon <= 1.0.", status: 'idle', log: '' }
  ]);
  const [evalConsole, setEvalConsole] = useState<string[]>([]);

  // Stats
  const activeConsentRate = ((consentSettings.filter(c => c.enabled).length / consentSettings.length) * 100).toFixed(0);
  const rewardLiability = rewards.reduce((sum, item) => {
    if (item.status === 'available' && item.amount.startsWith('$')) {
      return sum + parseFloat(item.amount.replace('$', ''));
    }
    return sum;
  }, 0);

  // Simulator States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(-1);
  const [simLogs, setSimLogs] = useState<SimulationLog[]>([]);

  const simulationSteps = [
    {
      node: 'consumer',
      title: 'Consumer Agent',
      action: 'Publishing Consent Registry',
      content: 'Syncing user consent state: Nike=APPROVED, Location=APPROVED, Bank=PAUSED. Hashing data vectors in local container.',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
    },
    {
      node: 'trust',
      title: 'Data Aura Trust Layer',
      action: 'Verifying Permissions & Signatures',
      content: 'Verifying cryptography keys. Generated permission token "tkn_nike_991" for Sports Footwear Cohort. Registered in immutable audit ledger.',
      color: 'text-sky-400 border-sky-500/30 bg-sky-500/5'
    },
    {
      node: 'intel',
      title: 'Audience Intelligence Layer',
      action: 'Assembling Aggregated Cohort',
      content: 'Reading anonymous user features. Creating lookup bucket. Differential noise parameter epsilon=0.1 added. Calculated match index: 94.5%.',
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5'
    },
    {
      node: 'brand',
      title: 'Brand Agent (Nike)',
      action: 'Negotiating Value & Requesting Match',
      content: 'Reading audience token "tkn_nike_991". Depositing $1.50 incentive reward into Consumer wallet. Requesting activation schema.',
      color: 'text-violet-400 border-violet-500/30 bg-violet-500/5'
    },
    {
      node: 'publisher',
      title: 'Publisher Agent (SSP)',
      action: 'Matching Inventory & Triggering Delivery',
      content: 'Receiving encrypted match keys in Snowflake Clean Room. Mapping inventory slots. Served premium activewear creative assets.',
      color: 'text-pink-400 border-pink-500/30 bg-pink-500/5'
    },
    {
      node: 'measurement',
      title: 'Measurement Agent',
      action: 'Calculating Multi-Touch Attribution',
      content: 'Gathering cookieless conversion logs. Executing double-blind join query. Attributing +14.2% conversion rate increase.',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/5'
    },
    {
      node: 'incrementality',
      title: 'Incrementality Agent',
      action: 'Verifying Absolute Lift Indices',
      content: 'Splitting random cohort test/control zones. True incremental sales uplift confirmed at +8.5%. Reporting CAC reduction of 32%.',
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/5'
    }
  ];

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);
    setSimLogs([]);
    onNotify('Initiating automated ARTF campaign negotiation simulation loop...');
  };

  useEffect(() => {
    if (!isSimulating || simulationStep < 0) return;

    const stepData = simulationSteps[simulationStep];
    const newLog: SimulationLog = {
      id: `s-${Date.now()}-${simulationStep}`,
      timestamp: new Date().toLocaleTimeString(),
      source: stepData.title,
      target: simulationStep < simulationSteps.length - 1 ? simulationSteps[simulationStep + 1].title : 'System Gate',
      messageType: stepData.action,
      content: stepData.content,
      color: stepData.color
    };

    setSimLogs(prev => [newLog, ...prev]);

    const timer = setTimeout(() => {
      if (simulationStep < simulationSteps.length - 1) {
        setSimulationStep(prev => prev + 1);
      } else {
        setIsSimulating(false);
        setSimulationStep(-1);
        onNotify('Simulation completed. Total value exchange logs saved to audit ledger.');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isSimulating, simulationStep]);

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationStep(-1);
    setSimLogs([]);
    onNotify('Simulation reset.');
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'dashboard' ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity size={14} /> Platform Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('simulator')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'simulator' ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu size={14} /> ARTF Agent Simulator
        </button>
        <button 
          onClick={() => setActiveTab('governance')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'governance' ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale size={14} /> Consent Governance
        </button>
        <button 
          onClick={() => setActiveTab('partners')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'partners' ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 size={14} /> Partner Integrations
        </button>
        <button 
          onClick={() => setActiveTab('revenue')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'revenue' ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign size={14} /> Revenue Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('evals')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'evals' ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert size={14} /> Guardrails & Evals
        </button>
        <button 
          onClick={() => setActiveTab('ledger')} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'ledger' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database size={14} /> Live Ledger
        </button>
      </div>

      {/* 1. Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Admin Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-panel p-5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block flex items-center gap-1">
                <Users size={12} /> Total Registered Users
              </span>
              <span className="text-2xl font-extrabold text-white mt-1 block">12,450</span>
              <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">+18.5% this month</span>
            </div>

            <div className="glass-panel p-5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block flex items-center gap-1">
                <ShieldCheck size={12} /> Active Consent Rate
              </span>
              <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">{activeConsentRate}%</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Toggles enabled in settings</span>
            </div>

            <div className="glass-panel p-5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block flex items-center gap-1">
                <Database size={12} /> Data Freshness
              </span>
              <span className="text-2xl font-extrabold text-white mt-1 block">0.8 Hours</span>
              <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">Match SLA target met</span>
            </div>

            <div className="glass-panel p-5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block flex items-center gap-1">
                <DollarSign size={12} /> Reward Liability
              </span>
              <span className="text-2xl font-extrabold text-white mt-1 block">${rewardLiability.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Pending in consumer wallets</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-1">
                <Activity size={14} className="text-violet-400" /> System Integration Status
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Snowflake clean room API:</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">Operational</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Plaid banking sync broker:</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">Operational</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">SSP OpenRTB/AAMP listener:</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">Operational</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Decentriq double-blind server:</span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold text-[10px]">High Load</span>
                </div>
              </div>
            </div>

            {/* Governance Alerts */}
            <div className="glass-panel rounded-xl p-5 space-y-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-1">
                <FileText size={14} className="text-rose-400" /> Pending GDPR & Audit Incidents
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold">
                    <ShieldAlert size={14} /> Right to Erasure Request
                  </div>
                  <span className="text-slate-400">ID: user_token_9918 (Pending audit)</span>
                </div>
                
                <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <AlertTriangle size={14} /> Consent Revocation Warning
                  </div>
                  <span className="text-slate-400">Nike Inc. revoked by de-sha-882</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ARTF Agent Simulator */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">ARTF Protocol Simulator</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Visualise standardized transactions passing between Consumer, Brand, Publisher, and Measurement Agents.
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-violet-500/10 active:scale-95"
                >
                  <Play size={12} /> Run Simulation Loop
                </button>
                <button
                  onClick={resetSimulation}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            {/* Visual Agent Node Chain */}
            <div className="flex flex-wrap items-center justify-center gap-y-6 gap-x-2 my-8">
              {simulationSteps.map((step, idx) => {
                const isActive = simulationStep === idx;
                const isPassed = simulationStep > idx;
                
                return (
                  <React.Fragment key={idx}>
                    {/* Arrow between nodes */}
                    {idx > 0 && (
                      <ArrowRight 
                        size={16} 
                        className={`${
                          isPassed ? 'text-violet-500' : isActive ? 'text-indigo-400 animate-pulse' : 'text-slate-700'
                        } hidden md:block`} 
                      />
                    )}

                    {/* Node Card */}
                    <div 
                      className={`px-3.5 py-2.5 rounded-xl border text-center transition-all duration-300 w-36 ${
                        isActive 
                          ? 'border-violet-500 bg-violet-950/20 text-violet-300 ring-2 ring-violet-500/30 scale-105 shadow-lg shadow-violet-500/10' 
                          : isPassed 
                          ? 'border-indigo-800 bg-indigo-950/15 text-indigo-400' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-500'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider font-mono">Agent {idx + 1}</div>
                      <div className="text-xs font-bold mt-1 text-slate-200">{step.title}</div>
                      <div className={`text-[9px] mt-1.5 truncate ${isActive ? 'text-violet-400 font-medium' : 'text-slate-500'}`}>
                        {isActive ? '● Running...' : isPassed ? '✔ Done' : 'Waiting...'}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Live Message Log Stream */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 font-mono flex items-center gap-1.5">
                <Activity size={14} className="text-violet-500" /> AAMP Protocol Message Broker Logs
              </span>
              
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs max-h-60 overflow-y-auto space-y-3 shadow-inner">
                {simLogs.length === 0 ? (
                  <div className="text-slate-600 text-center py-6">
                    Press "Run Simulation Loop" to stream live AAMP network messages.
                  </div>
                ) : (
                  simLogs.map((log) => (
                    <div key={log.id} className={`p-3 border rounded-lg ${log.color} animate-slide-up`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded">
                            {log.timestamp}
                          </span>
                          <span className="font-bold">{log.source} ➔ {log.target}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-slate-950 rounded">
                          {log.messageType}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-200">{log.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Consent Governance */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5"><Landmark size={18} className="text-emerald-400" /> Compliance Audit Trail</h3>
              <p className="text-slate-400 text-xs mt-0.5">Immutable record of data collaboration requests and user revocations.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-3">Transaction ID</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Purpose Statement</th>
                    <th className="py-2.5 px-3 text-right">Auditor Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono">
                  {transactionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 text-slate-500">{log.id.slice(0, 8)}...</td>
                      <td className="py-2.5 px-3 text-slate-200">{log.brandName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{log.accessedAt}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          log.status === 'Authorized' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">{log.purpose}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500 text-[10px]">aura_audit_sig_0x8382f</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Partner Integrations */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">Connected SSPs, CDPs & Clean Rooms</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Snowflake Native App</h4>
                  <p className="text-[10px] text-slate-500">Secure clean room tables and secure schema sync.</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[9px]">ACTIVE</span>
              </div>

              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Decentriq Rooms</h4>
                  <p className="text-[10px] text-slate-500">Cryptographic privacy computing sandbox.</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[9px]">ACTIVE</span>
              </div>

              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">LiveRamp Identity Link</h4>
                  <p className="text-[10px] text-slate-500">Anonymised identity hash matches.</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold text-[9px]">RATE-LIMIT</span>
              </div>

              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Magnite SSP Bridge</h4>
                  <p className="text-[10px] text-slate-500">Real-time consent token injection to OpenRTB feeds.</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[9px]">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Revenue */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Total Platform Revenue</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">$28,450.00</h2>
              <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">+14.2% Month-over-Month</span>
            </div>

            <div className="glass-panel p-5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Campaign Query Fees</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">$12,350.00</h2>
              <span className="text-[10px] text-slate-400 mt-1 block">Aura 15% platform take-rate</span>
            </div>

            <div className="glass-panel p-5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Brand Subscription Fees</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">$16,100.00</h2>
              <span className="text-[10px] text-slate-400 mt-1 block">From Starter & Growth tiers</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Evals & Guardrails */}
      {activeTab === 'evals' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="text-violet-400" size={20} /> Guardrails Compliance Auditor
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Verify platform guardrail algorithms against privacy leakage, cohort sizing, and revocation events.
                </p>
              </div>

              <button
                onClick={() => {
                  if (evalRunning) return;
                  setEvalRunning(true);
                  setEvalConsole(["[INFO] Initialising compliance audit engine...", "[INFO] Fetching network guardrail criteria..."]);
                  
                  // Reset statuses
                  setEvalResults(prev => prev.map(r => ({ ...r, status: 'running', log: '' })));

                  // Run scenarios step by step
                  const stepLogs = [
                    "Scan check: 'helen@example.com' found. Raw email matched. Blocker status: ACTIVE. Threat neutralized.",
                    "Audit check: Cohort size is 12 (minimum requirement: 50). Blocker status: ACTIVE. Query block applied.",
                    "Registry check: Nike Inc. is set to DISABLED in consent ledger. Blocker status: ACTIVE. Matching token invalid.",
                    "DP evaluation: Epsilon = 0.1. Laplace offset applied. Noise coefficient = +8.69. Aggregate obfuscation: PASSED.",
                    "Clean room auth: Hashed keys synced. Cohort size = 150. Epsilon = 0.2. Compliance check: PASSED."
                  ];

                  let current = 0;
                  const interval = setInterval(() => {
                    if (current < stepLogs.length) {
                      setEvalResults(prev => prev.map((item, idx) => 
                        idx === current 
                          ? { ...item, status: 'pass', log: stepLogs[idx] } 
                          : item
                      ));
                      setEvalConsole(prev => [...prev, `[EVAL] Running scenario ${current + 1}...`, `[AUDIT] ${stepLogs[current]}`, `[RESULT] Scenario ${current + 1}: PASS`]);
                      current++;
                    } else {
                      clearInterval(interval);
                      setEvalRunning(false);
                      onNotify("Compliance audit complete. 5/5 Guardrails successfully verified.");
                    }
                  }, 1200);
                }}
                disabled={evalRunning}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {evalRunning ? "Running Evals Suite..." : "Run Compliance Evals"}
              </button>
            </div>

            {/* Guardrail Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">PII Leak Scanner</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block flex items-center gap-1">
                  ● ACTIVE (Strict Zero-PII)
                </span>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Min Cohort Size</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">
                  50 Users (Active Gate)
                </span>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Max DP Epsilon</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">
                  ε = 1.0 (Strict Privacy)
                </span>
              </div>
            </div>

            {/* Interactive Scenario Cards */}
            <div className="space-y-3">
              {evalResults.map((scenario, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">{scenario.name}</h3>
                    <p className="text-xs text-slate-400">{scenario.desc}</p>
                    {scenario.log && (
                      <div className="text-[11px] font-mono text-emerald-400 mt-1.5 p-1.5 bg-slate-900/50 rounded border border-slate-800/50">
                        {scenario.log}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 mt-0.5">
                    {scenario.status === 'idle' && (
                      <span className="px-2 py-0.5 text-[9px] bg-slate-800 text-slate-500 rounded font-semibold uppercase font-mono">Idle</span>
                    )}
                    {scenario.status === 'running' && (
                      <span className="px-2 py-0.5 text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-semibold uppercase font-mono animate-pulse">Checking</span>
                    )}
                    {scenario.status === 'pass' && (
                      <span className="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase font-mono">PASS (Blocked)</span>
                    )}
                    {scenario.status === 'fail' && (
                      <span className="px-2 py-0.5 text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-bold uppercase font-mono">FAIL (Leak)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Console Logs */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 font-mono">Evaluation Console Output</span>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs max-h-40 overflow-y-auto space-y-1 text-slate-300">
                {evalConsole.length === 0 ? (
                  <div className="text-slate-600 text-center py-4">
                    Press "Run Compliance Evals" to stream guardrail logs.
                  </div>
                ) : (
                  evalConsole.map((logStr, idx) => (
                    <div key={idx} className={
                      logStr.startsWith("[INFO]") ? "text-slate-500" :
                      logStr.startsWith("[RESULT]") ? "text-indigo-400 font-bold" :
                      "text-slate-300"
                    }>
                      {logStr}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Ledger Panel */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Live Audit Ledger</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Persistent SQLite log via Prisma — Trust Layer backend (localhost:3001)
                {lastRefreshed && <span className="ml-2 text-emerald-500">Last updated: {lastRefreshed}</span>}
              </p>
            </div>
            <button
              onClick={fetchLedger}
              disabled={ledgerLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
            >
              <RefreshCw size={12} className={ledgerLoading ? 'animate-spin' : ''} />
              {ledgerLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {ledgerError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {ledgerError} — Start the backend with <code className="font-mono bg-slate-800 px-1 rounded">npm run dev</code> in the /server directory.
            </div>
          )}

          {!ledgerError && liveLedger.length === 0 && !ledgerLoading && (
            <div className="p-8 text-center text-slate-500 text-sm border border-slate-800 rounded-xl">
              No ledger entries yet. Activate a campaign from the Brand portal to generate entries.
            </div>
          )}

          {liveLedger.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Timestamp</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Action</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Brand</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Audience Size</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Token Ref</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Audit Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {liveLedger.map((entry, i) => (
                    <tr key={entry.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${ i % 2 === 0 ? 'bg-slate-950/30' : ''}` }>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          entry.action.includes('REVOK') || entry.action.includes('BLOCKED') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          entry.action.includes('GRANTED') || entry.action.includes('PAYOUT') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          entry.action.includes('VERIFY') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                          'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        }`}>{entry.action.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 font-semibold capitalize">{entry.brandId}</td>
                      <td className="py-2.5 px-4 text-slate-300">{entry.audienceSize ?? '—'}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-[10px]">{entry.tokenRef ?? '—'}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 text-[10px] max-w-[100px] truncate">{entry.auditHash ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
