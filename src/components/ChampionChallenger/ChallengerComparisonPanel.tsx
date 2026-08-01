import React from 'react';
import { motion } from 'framer-motion';
import { WorkflowNode, CHAMPION_MODEL, CHALLENGER_MODELS } from './championChallengerMock';
import { Trophy, Zap, Award } from 'lucide-react';

interface ChallengerComparisonPanelProps {
  selectedNode: WorkflowNode;
}

export const ChallengerComparisonPanel: React.FC<ChallengerComparisonPanelProps> = ({ selectedNode }) => {
  return (
    <div className="w-full flex flex-col space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" /> Challenger Benchmarks
          </h3>
          <span className="text-[10px] text-gray-500 font-mono">
            Node: <span className="text-blue-700 font-bold">{selectedNode.name}</span>
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200">
          {CHALLENGER_MODELS.length} Active Candidates
        </span>
      </div>

      {/* Top Winner Card */}
      {(() => {
        const topWinner = CHALLENGER_MODELS.find((c) => c.id === selectedNode.bestChallengerId) || CHALLENGER_MODELS[0];
        return (
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1 font-mono">
                <Award size={13} /> Top Performing Challenger
              </span>
              <span className="text-xs font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {topWinner.winProbabilityPct}% Win Prob
              </span>
            </div>
            <div className="text-xs font-bold text-gray-900 truncate mb-1">{topWinner.name}</div>
            <div className="flex items-baseline justify-between text-xs font-mono">
              <span className="text-gray-600">Output Gain:</span>
              <span className="text-emerald-700 font-bold">
                +{(selectedNode.outputCount * (selectedNode.bestChallengerDeltaPct / 100)).toFixed(0)} requests (+{selectedNode.bestChallengerDeltaPct}%)
              </span>
            </div>
          </div>
        );
      })()}

      {/* Champion Baseline Reference Row */}
      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 font-mono text-xs space-y-1">
        <div className="flex items-center justify-between text-blue-900 font-bold">
          <span className="flex items-center gap-1.5 font-sans">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            {CHAMPION_MODEL.name}
          </span>
          <span className="text-[10px] uppercase px-1.5 py-0.5 bg-blue-100 rounded text-blue-800">Baseline</span>
        </div>
        <div className="flex justify-between text-gray-700 text-[11px] pt-1">
          <span>Out: {selectedNode.outputCount.toLocaleString()}</span>
          <span>Drop: {selectedNode.dropPct}%</span>
          <span>Latency: {selectedNode.avgLatencyMs}ms</span>
        </div>
      </div>

      {/* Candidates List (Clean scrollable list supporting 20+ candidates) */}
      <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-360px)] pr-1 scrollbar-thin scrollbar-thumb-gray-200">
        {CHALLENGER_MODELS.map((challenger) => {
          const isWinner = challenger.id === selectedNode.bestChallengerId;
          const isPositive = challenger.outputDelta >= 0;

          return (
            <motion.div
              key={challenger.id}
              whileHover={{ scale: 1.01 }}
              className={`p-3 rounded-xl border transition-all ${
                isWinner
                  ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              {/* Card Title Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 truncate max-w-[200px]">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: challenger.color }} />
                  <span className="text-xs font-bold text-gray-900 truncate">{challenger.name}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-gray-200 bg-gray-100 text-gray-700`}>
                  {challenger.version}
                </span>
              </div>

              {/* Primary Stats Grid */}
              <div className="grid grid-cols-4 gap-1 text-[11px] font-mono my-2 text-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                <div>
                  <span className="text-[9px] text-gray-500 block font-sans">Out</span>
                  <span className="text-gray-900 font-bold">{challenger.outputCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block font-sans">Δ Output</span>
                  <span className={`font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {isPositive ? `+${challenger.outputDelta}` : challenger.outputDelta}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block font-sans">Drop %</span>
                  <span className="text-gray-800 font-bold">{challenger.dropPct}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block font-sans">Confidence</span>
                  <span className="text-blue-700 font-bold">{(challenger.confidenceScore * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Sparkline & Latency / Error Deltas */}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-600 pt-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                    <Zap size={10} /> {challenger.latencyDeltaMs > 0 ? `+${challenger.latencyDeltaMs}` : challenger.latencyDeltaMs}ms
                  </span>
                  <span>p={challenger.pValue}</span>
                </div>

                {/* Mini SVG Sparkline */}
                <div className="flex items-center gap-1">
                  <svg width="45" height="14" className="overflow-visible">
                    <polyline
                      fill="none"
                      stroke={challenger.color}
                      strokeWidth="1.5"
                      points={challenger.sparklineData.map((val, i) => `${i * 8},${14 - (val / 100) * 12}`).join(' ')}
                    />
                  </svg>
                  <span className="text-[9px] font-bold text-gray-700">CI {challenger.ciRange}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
