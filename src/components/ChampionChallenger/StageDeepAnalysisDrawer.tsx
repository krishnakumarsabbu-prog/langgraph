import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WorkflowNode,
  CHAMPION_MODEL,
  CHALLENGER_MODELS,
  BUSINESS_RULE_IMPACTS,
  REQUEST_DIFF_SAMPLES,
  RequestDiffSample,
} from './championChallengerMock';
import { X, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface StageDeepAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: WorkflowNode;
}

export const StageDeepAnalysisDrawer: React.FC<StageDeepAnalysisDrawerProps> = ({
  isOpen,
  onClose,
  selectedNode,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<RequestDiffSample | null>(REQUEST_DIFF_SAMPLES[0]);

  if (!isOpen) return null;

  const bestChallenger = CHALLENGER_MODELS.find((c) => c.id === selectedNode.bestChallengerId) || CHALLENGER_MODELS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          {/* Backdrop Overlay Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Sliding Right Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-4xl h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col z-10 overflow-hidden text-gray-900 select-none"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 border border-blue-200">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">{selectedNode.name} — Deep Comparison</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Root-cause fallout breakdown, rule-level contribution, and execution trace diffs
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Stat Comparison Header Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Champion Stat Card */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 font-sans">{CHAMPION_MODEL.name}</span>
                    <span className="text-[10px] font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-800 font-bold">
                      Baseline
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-gray-500 text-[10px] block">Passed Requests</span>
                      <span className="text-gray-900 font-bold text-sm">
                        {selectedNode.outputCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Dropped</span>
                      <span className="text-red-600 font-bold text-sm">
                        {selectedNode.droppedCount.toLocaleString()} ({selectedNode.dropPct}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Latency</span>
                      <span className="text-gray-800 font-bold">{selectedNode.avgLatencyMs} ms</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Errors</span>
                      <span className="text-gray-800 font-bold">{selectedNode.errorPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Best Challenger Stat Card */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 font-sans">{bestChallenger.name}</span>
                    <span className="text-[10px] font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-bold">
                      Best Challenger
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-gray-500 text-[10px] block">Passed Requests</span>
                      <span className="text-emerald-700 font-bold text-sm">
                        {(selectedNode.outputCount * (1 + selectedNode.bestChallengerDeltaPct / 100)).toFixed(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Dropped</span>
                      <span className="text-gray-700 font-bold text-sm">
                        {(selectedNode.droppedCount * 0.85).toFixed(0)} (13.9%)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Latency</span>
                      <span className="text-emerald-700 font-bold">39 ms (-3ms)</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Errors</span>
                      <span className="text-emerald-700 font-bold">0.10%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Rule Impact Section */}
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Business Rule Impact Matrix</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Fallout contribution of business rules executed at this node
                    </p>
                  </div>
                  <span className="text-xs font-mono text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                    {BUSINESS_RULE_IMPACTS.length} Active Rules
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 font-sans">
                        <th className="py-2.5 px-3">Rule Name</th>
                        <th className="py-2.5 px-3 text-center">Champion Drops</th>
                        <th className="py-2.5 px-3 text-center">Best Challenger Drops</th>
                        <th className="py-2.5 px-3 text-right">Impact (Δ Drops)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {BUSINESS_RULE_IMPACTS.map((rule) => {
                        const isImproved = rule.deltaDrops < 0;
                        return (
                          <tr key={rule.ruleId} className="hover:bg-gray-50 transition-all">
                            <td className="py-3 px-3">
                              <span className="text-gray-900 font-bold block">{rule.ruleName}</span>
                              <span className="text-[10px] text-gray-500">{rule.ruleId} • {rule.category}</span>
                            </td>
                            <td className="py-3 px-3 text-center text-gray-800 font-bold">{rule.championDrops.toLocaleString()}</td>
                            <td className="py-3 px-3 text-center text-gray-800 font-bold">{rule.bestChallengerDrops.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] ${
                                  isImproved
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {rule.deltaDrops > 0 ? `+${rule.deltaDrops}` : rule.deltaDrops}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Rule Contribution Bar Chart Visualizer */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <span className="text-xs font-semibold text-gray-800 block font-sans">
                    Rule Contribution to Total Node Drops
                  </span>
                  <div className="space-y-2 text-xs font-mono">
                    {BUSINESS_RULE_IMPACTS.map((rule) => {
                      const pct = Math.round((rule.championDrops / 12500) * 100);
                      return (
                        <div key={rule.ruleId} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-600">{rule.ruleName}</span>
                            <span className="text-gray-900 font-bold">{rule.championDrops} drops ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Request Diff Explorer */}
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Request Execution Path Diff Explorer</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sample request execution traces where Champion and Challenger paths diverge
                    </p>
                  </div>
                  <span className="text-xs font-mono text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {REQUEST_DIFF_SAMPLES.length} Samples
                  </span>
                </div>

                {/* Request Trace Samples Cards */}
                <div className="space-y-3">
                  {REQUEST_DIFF_SAMPLES.map((req) => (
                    <div
                      key={req.requestId}
                      onClick={() => setSelectedRequest(req)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedRequest?.requestId === req.requestId
                          ? 'bg-blue-50/50 border-blue-400 shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold text-blue-700">{req.requestId}</span>
                          <span className="text-[10px] text-gray-500">{req.sessionId} • {req.timestamp}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Passed in Challenger A
                        </span>
                      </div>

                      {/* Path Diff */}
                      <div className="space-y-2 text-xs font-mono mt-3 bg-white p-3 rounded-lg border border-gray-200">
                        <div className="text-red-600 font-semibold flex items-center gap-2">
                          <XCircle size={14} />
                          <span>Champion: {req.championPath}</span>
                        </div>
                        <div className="text-emerald-700 font-semibold flex items-center gap-2">
                          <CheckCircle2 size={14} />
                          <span>Challenger: {req.challengerPath}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-600 mt-2">
                        <span>Confidence Delta: <strong className="text-emerald-700">+{req.confidenceDelta}</strong></span>
                        <span>Latency Delta: <strong className="text-emerald-700">{req.latencyDeltaMs}ms</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
