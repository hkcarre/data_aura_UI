import React, { useState } from 'react';
import { marketplaceAgents } from '../mockData';
import type { AgentMarketItem } from '../types';
import { Search, ShieldCheck, Zap, Server, CheckCircle, Cpu, FileCheck } from 'lucide-react';

interface AgentMarketplaceProps {
  onNotify: (message: string) => void;
}

export const AgentMarketplace: React.FC<AgentMarketplaceProps> = ({ onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArtf, setFilterArtf] = useState(false);
  const [deployingAgent, setDeployingAgent] = useState<AgentMarketItem | null>(null);
  const [deployStep, setDeployStep] = useState(0);

  const filteredAgents = marketplaceAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArtf = !filterArtf || agent.artfCompatible;
    return matchesSearch && matchesArtf;
  });

  const startDeployment = (agent: AgentMarketItem) => {
    setDeployingAgent(agent);
    setDeployStep(0);
    
    // Simulate container deployment steps
    const steps = [
      'Initialising host sandbox environment...',
      'Pulling secure agent container image from registry...',
      'Binding standardized AAMP & ARTF communication interfaces...',
      'Verifying trust credentials & data compliance keys...',
      'Establishing secure local context database...',
      'Agent service is fully deployed and active!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setDeployStep(currentStep);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setDeployingAgent(null);
          onNotify(`Deployed ${agent.name} successfully to your Data Aura container.`);
        }, 1200);
      }
    }, 1000);
  };

  const deployStepsList = [
    'Initialising host environment',
    'Pulling container image',
    'Binding AAMP/ARTF interfaces',
    'Verifying trust credentials',
    'Establishing local database',
    'Agent active & verified'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full flex items-center gap-1">
              <Cpu size={12} className="animate-spin" /> ARTF 1.0 Framework
            </span>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white mt-2">
            AI Agent Marketplace
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deploy specialized, containerized agent services to run inside your trusted Data Aura environment.
          </p>
        </div>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-9 pr-4 py-1.5 w-full text-sm"
            />
          </div>
          <button
            onClick={() => setFilterArtf(!filterArtf)}
            className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap w-full sm:w-auto justify-center ${
              filterArtf 
                ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-500/15' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={14} />
            {filterArtf ? 'ARTF ONLY' : 'Filter ARTF Compatible'}
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="glass-panel glass-panel-hover rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group">
            {/* Top background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-all duration-300" />
            
            <div>
              {/* Badge & Provider */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs text-slate-500 font-medium">{agent.provider}</span>
                {agent.artfCompatible ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1 glow-emerald">
                    <Zap size={10} /> ARTF COMPATIBLE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-slate-500 rounded">
                    Standard API
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors duration-200">
                {agent.name}
              </h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed min-h-[48px]">
                {agent.description}
              </p>

              {/* Specs */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                {/* Inputs */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Inputs:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.inputs.map((inp, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-slate-950 text-slate-300 rounded text-[10px] border border-slate-800">
                        {inp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Outputs */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Outputs:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.outputs.map((out, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-slate-950 text-slate-300 rounded text-[10px] border border-slate-800">
                        {out}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Compliance Certs:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.certifications.map((cert, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-slate-950 text-slate-400 rounded text-[10px] border border-slate-800 flex items-center gap-0.5">
                        <FileCheck size={10} className="text-slate-500" /> {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Deploy Action */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Cost</div>
                <div className="text-sm font-semibold text-slate-200">{agent.cost}</div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right mr-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Trust Score</div>
                  <div className={`text-sm font-bold ${
                    agent.trustScore >= 97 ? 'text-emerald-400' : 'text-indigo-400'
                  }`}>
                    {agent.trustScore}%
                  </div>
                </div>
                
                <button
                  onClick={() => startDeployment(agent)}
                  className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-violet-500/20 active:scale-95 transition-all duration-150 flex items-center gap-1"
                >
                  <Server size={12} /> Deploy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deploying Container Modal */}
      {deployingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-xl p-6 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto glow-violet">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-violet-600/10 rounded-lg border border-violet-500/20 text-violet-400">
                <Cpu className="animate-spin" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Deploying Agent Container</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{deployingAgent.name} v1.0.0</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Data Aura is hosting this microservices container in isolation, exposing only the specific schema nodes approved by user consent ledgers.
            </p>

            {/* Steps Container */}
            <div className="space-y-3 bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 font-mono text-xs">
              {deployStepsList.map((step, idx) => {
                const isCurrent = idx === deployStep;
                const isPassed = idx < deployStep;
                
                return (
                  <div key={idx} className="flex items-start gap-2.5">
                    {isPassed ? (
                      <CheckCircle size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={`${
                      isPassed ? 'text-slate-400' : isCurrent ? 'text-violet-400 font-semibold' : 'text-slate-600'
                    }`}>
                      {step} {isPassed && '...OK'} {isCurrent && '...'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                disabled
                className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed border border-slate-700"
              >
                Deploying in Progress...
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
