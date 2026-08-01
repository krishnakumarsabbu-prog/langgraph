import React, { useState } from 'react';
import {
  MASTER_WORKFLOW_NODES,
  AVAILABLE_CANDIDATES,
  CHALLENGER_MODELS,
  CandidateModel,
  WorkflowNode,
  DynamicRequestItem,
} from './championChallengerMock';
import { StageRail } from './StageRail';
import { MasterFunnel } from './MasterFunnel';
import { ChallengerComparisonPanel } from './ChallengerComparisonPanel';
import { StageDeepAnalysisDrawer } from './StageDeepAnalysisDrawer';
import { BottomAnalyticsPanels } from './BottomAnalyticsPanels';

// Sub-Tab Components
import { RequestComparisonTab } from './RequestComparisonTab';
import { DropAnalysisTab } from './DropAnalysisTab';
import { PerformanceTab } from './PerformanceTab';
import { NodeLevelTab } from './NodeLevelTab';
import { MetricsExplorerTab } from './MetricsExplorerTab';
import { AlertsTab } from './AlertsTab';
import { StepAnalysisTab } from './StepAnalysisTab';
import { ExecutionPayloadModal } from './ExecutionPayloadModal';

import {
  Layers,
  Calendar,
  Download,
  Check,
  Plus,
  Sliders,
  BarChart2,
  ListFilter,
  Eye,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Activity,
  GitBranch,
} from 'lucide-react';

export const ChampionChallengerDashboard: React.FC = () => {
  // Candidate Selection State (Champion + 1 to N Challengers)
  const [activeCandidateIds, setActiveCandidateIds] = useState<string[]>([
    'champion',
    'chall-a',
    'chall-b',
    'chall-c',
    'chall-d',
    'chall-e',
  ]);

  // Top Tab Navigation State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'step' | 'comparison' | 'drops' | 'performance' | 'node' | 'metrics' | 'alerts'
  >('overview');

  const [nodes] = useState<WorkflowNode[]>(MASTER_WORKFLOW_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-3'); // Default to Risk Evaluation
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedRequestSet, setSelectedRequestSet] = useState<string>('prod-100k');

  // Payload Inspector Modal State
  const [selectedInspectRequest, setSelectedInspectRequest] = useState<DynamicRequestItem | null>(null);

  // Active candidate models array
  const activeCandidates: CandidateModel[] = AVAILABLE_CANDIDATES.filter((c) =>
    activeCandidateIds.includes(c.id)
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[2];

  // Dynamic Candidate Preset Selectors
  const setPreset = (preset: 'champion' | '1v1' | '1v2' | 'all') => {
    if (preset === 'champion') setActiveCandidateIds(['champion']);
    else if (preset === '1v1') setActiveCandidateIds(['champion', 'chall-a']);
    else if (preset === '1v2') setActiveCandidateIds(['champion', 'chall-a', 'chall-b']);
    else setActiveCandidateIds(['champion', 'chall-a', 'chall-b', 'chall-c', 'chall-d', 'chall-e']);
  };

  const toggleCandidate = (id: string) => {
    if (id === 'champion') return; // Champion is mandatory baseline
    if (activeCandidateIds.includes(id)) {
      if (activeCandidateIds.length <= 2) return; // Require at least Champion + 1 Challenger
      setActiveCandidateIds(activeCandidateIds.filter((item) => item !== id));
    } else {
      setActiveCandidateIds([...activeCandidateIds, id]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans select-none space-y-6">
      {/* TOP HEADER & TITLE */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-xs">
            <Layers size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Funnel Intelligence & Decision Studio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                LangGraph Decision Engine
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Enterprise Champion vs 20+ Challenger N-Way Comparative Analytics & Fallout Engine
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <select
            value={selectedRequestSet}
            onChange={(e) => setSelectedRequestSet(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer font-sans text-xs"
          >
            <option value="prod-100k">Prod Baseline (100k+ Traces)</option>
            <option value="prod-500k">High Traffic Batch (500k Traces)</option>
            <option value="staging">Staging Shadow Traffic (25k)</option>
          </select>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700">
            <Calendar size={14} className="text-gray-500" />
            <span>Jul 25 - Aug 1, 2026</span>
          </div>

          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold font-sans transition-all shadow-sm hover:scale-105 active:scale-95">
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      {/* DYNAMIC CANDIDATE MODEL MULTI-SELECT TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <Sliders size={15} className="text-blue-600" />
            <span className="font-bold text-gray-900 font-sans">Active Candidate Benchmark Selector:</span>
            <span className="text-gray-500 font-mono">({activeCandidates.length} Selected)</span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-gray-500 font-sans">Presets:</span>
            <button
              onClick={() => setPreset('1v1')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                activeCandidateIds.length === 2
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              1v1 (vs Chall A)
            </button>
            <button
              onClick={() => setPreset('1v2')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                activeCandidateIds.length === 3
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              1v2 (vs Chall A & B)
            </button>
            <button
              onClick={() => setPreset('all')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                activeCandidateIds.length === 6
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              N-Way All (1v5)
            </button>
          </div>
        </div>

        {/* Interactive Candidate Chips */}
        <div className="flex flex-wrap items-center gap-2.5">
          {AVAILABLE_CANDIDATES.map((cand) => {
            const isActive = activeCandidateIds.includes(cand.id);
            const isChamp = cand.isChampion;

            return (
              <button
                key={cand.id}
                onClick={() => toggleCandidate(cand.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-white shadow-xs font-bold'
                    : 'bg-gray-50 opacity-60 hover:opacity-100 text-gray-500 border-gray-200'
                }`}
                style={{
                  borderColor: isActive ? cand.color : '#E5E7EB',
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cand.color }}
                />
                <span className="font-sans text-gray-900">{cand.name}</span>
                {isChamp && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 uppercase font-bold">
                    Champion
                  </span>
                )}
                {isActive && <Check size={13} style={{ color: cand.color }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP NAVIGATION SUB-TABS BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200 scrollbar-none">
        {[
          { id: 'overview', label: 'Funnel Overview', icon: Layers },
          { id: 'step', label: 'Step Analysis', icon: GitBranch },
          { id: 'comparison', label: 'Request Directory', icon: ListFilter },
          { id: 'drops', label: 'Fallout Analysis', icon: AlertTriangle },
          { id: 'performance', label: 'Performance', icon: Zap },
          { id: 'node', label: 'Node Level', icon: Activity },
          { id: 'metrics', label: 'Metrics Explorer', icon: BarChart2 },
          { id: 'alerts', label: 'Alerts & Anomalies', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold font-sans transition-all border-t border-x whitespace-nowrap ${
                isActive
                  ? 'bg-white border-gray-200 text-blue-600 shadow-xs border-b-white -mb-px z-10'
                  : 'bg-gray-100/70 hover:bg-gray-100 border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN VIEWPORT BODY SWITCHER */}
      <div>
        {/* TAB 1: FUNNEL OVERVIEW (THE HERO MASTER FUNNEL 3-COLUMN PAGE!) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* COLUMN 1: STAGE RAIL (20%) */}
              <section className="lg:col-span-3">
                <StageRail
                  nodes={nodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              </section>

              {/* COLUMN 2: HERO MASTER FUNNEL (50%) */}
              <section className="lg:col-span-6">
                <MasterFunnel
                  nodes={nodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onOpenDeepAnalysis={() => setIsDrawerOpen(true)}
                />
              </section>

              {/* COLUMN 3: CHALLENGER COMPARISON PANEL (30%) */}
              <section className="lg:col-span-3">
                <ChallengerComparisonPanel selectedNode={selectedNode} />
              </section>
            </main>

            {/* BOTTOM ANALYTICS SUITE */}
            <section>
              <BottomAnalyticsPanels />
            </section>
          </div>
        )}

        {/* TAB 2: STEP ANALYSIS */}
        {activeTab === 'step' && (
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <StepAnalysisTab candidates={activeCandidates} />
          </div>
        )}

        {/* TAB 3: REQUEST DIRECTORY & COMPARISON */}
        {activeTab === 'comparison' && (
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <RequestComparisonTab
              candidates={activeCandidates}
              onSelectRequest={(req) => setSelectedInspectRequest(req)}
            />
          </div>
        )}

        {/* TAB 4: FALLOUT & DROP ANALYSIS */}
        {activeTab === 'drops' && (
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <DropAnalysisTab candidates={activeCandidates} />
          </div>
        )}

        {/* TAB 5: PERFORMANCE */}
        {activeTab === 'performance' && (
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <PerformanceTab candidates={activeCandidates} />
          </div>
        )}

        {/* TAB 6: NODE LEVEL */}
        {activeTab === 'node' && (
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <NodeLevelTab candidates={activeCandidates} />
          </div>
        )}

        {/* TAB 7: METRICS EXPLORER */}
        {activeTab === 'metrics' && (
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <MetricsExplorerTab candidates={activeCandidates} />
          </div>
        )}

        {/* TAB 8: ALERTS & ANOMALIES */}
        {activeTab === 'alerts' && (
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <AlertsTab candidates={activeCandidates} />
          </div>
        )}
      </div>

      {/* STAGE DEEP ANALYSIS DRAWER */}
      <StageDeepAnalysisDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedNode={selectedNode}
      />

      {/* INSPECT PAYLOAD MODAL */}
      <ExecutionPayloadModal
        isOpen={!!selectedInspectRequest}
        onClose={() => setSelectedInspectRequest(null)}
        request={selectedInspectRequest}
        candidates={activeCandidates}
      />
    </div>
  );
};

export default ChampionChallengerDashboard;
