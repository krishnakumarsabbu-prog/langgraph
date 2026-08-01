import React from 'react';
import { MASTER_WORKFLOW_NODES, CandidateModel } from './championChallengerMock';

interface StepAnalysisTabProps {
  candidates?: CandidateModel[];
}

export const StepAnalysisTab: React.FC<StepAnalysisTabProps> = ({ candidates = [] }) => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Step-by-Step Stage Execution Comparison</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Granular stage retention and throughput comparison across {candidates.length || 6} active candidates
          </p>
        </div>

        <div className="space-y-4">
          {MASTER_WORKFLOW_NODES.map((node, idx) => (
            <div key={node.id} className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-mono font-bold flex items-center justify-center text-xs border border-blue-200">
                    0{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{node.name}</h4>
                    <span className="text-xs text-gray-500 font-mono">{node.type} • {node.ruleCount} Rules</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-gray-500">Champion: </span>
                    <span className="text-blue-700 font-bold">
                      {node.inputCount.toLocaleString()} → {node.outputCount.toLocaleString()} ({node.championConversionPct}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Best Challenger: </span>
                    <span className="text-emerald-700 font-bold">
                      +{node.bestChallengerDeltaPct}% Yield
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Comparison Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-blue-700 font-medium">
                    <span>Champion Conversion</span>
                    <span>Drop: {node.dropPct}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                    <div
                      style={{ width: `${node.championConversionPct}%` }}
                      className="h-full bg-blue-600 rounded-full transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-emerald-700 font-medium">
                    <span>Best Challenger Conversion</span>
                    <span>Drop: {(node.dropPct * 0.85).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                    <div
                      style={{ width: `${node.bestChallengerConversionPct}%` }}
                      className="h-full bg-emerald-600 rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
