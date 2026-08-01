import React from 'react';
import { motion } from 'framer-motion';
import { WorkflowNode } from './championChallengerMock';
import { ShieldCheck, ShieldAlert, Cpu, Layers, ChevronRight, Zap, AlertTriangle } from 'lucide-react';

interface StageRailProps {
  nodes: WorkflowNode[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

export const StageRail: React.FC<StageRailProps> = ({ nodes, selectedNodeId, onSelectNode }) => {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % nodes.length;
      onSelectNode(nodes[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + nodes.length) % nodes.length;
      onSelectNode(nodes[prevIndex].id);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-2 select-none">
      <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-500">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-gray-700">
          <Layers size={14} className="text-blue-600" /> Workflow Stages ({nodes.length})
        </span>
        <span className="text-[10px] font-mono text-gray-500">100k+ Traces</span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 scrollbar-thin scrollbar-thumb-gray-200">
        {nodes.map((node, index) => {
          const isSelected = node.id === selectedNodeId;

          return (
            <motion.div
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className={`relative group p-3.5 rounded-xl border transition-all cursor-pointer outline-none ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-500 shadow-sm shadow-blue-500/10'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              {/* Active Glow Bar indicator */}
              {isSelected && (
                <motion.div
                  layoutId="activeStageGlow"
                  className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r bg-blue-600 shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Node Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-5 h-5 rounded-md text-[10px] font-bold font-mono flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 group-hover:text-gray-900'
                    }`}
                  >
                    {node.order}
                  </span>
                  <span className="text-xs font-bold text-gray-900 truncate">{node.name.replace(/^\d+\s*/, '')}</span>
                </div>

                <span
                  className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold border ${
                    node.type === 'decision'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {node.type}
                </span>
              </div>

              {/* Primary Stage Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-2">
                <div>
                  <span className="text-gray-500 text-[10px] block font-sans">Input → Output</span>
                  <span className="text-gray-900 font-bold">
                    {(node.inputCount / 1000).toFixed(1)}k → {(node.outputCount / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-[10px] block font-sans">Dropped</span>
                  <span className={`font-bold ${node.dropPct > 10 ? 'text-red-600' : 'text-gray-700'}`}>
                    {node.droppedCount.toLocaleString()} ({node.dropPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Secondary Metrics Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <Zap size={11} className="text-amber-500" />
                  <span>{node.avgLatencyMs}ms</span>
                </span>
                {node.ruleCount > 0 && (
                  <span className="flex items-center gap-1 text-purple-700 font-semibold">
                    <ShieldAlert size={11} />
                    <span>{node.ruleCount} Rules</span>
                  </span>
                )}
                <span className="text-emerald-700 font-bold font-mono">
                  +{node.bestChallengerDeltaPct}% Chal
                </span>
              </div>

              {/* Hover Tooltip (Detailed Metrics) */}
              <div className="absolute left-full top-0 ml-3 z-30 hidden group-hover:block w-56 p-3 rounded-xl bg-gray-900 text-white border border-gray-700 shadow-2xl pointer-events-none animate-fadeIn">
                <div className="text-xs font-bold text-sky-400 mb-1">{node.name}</div>
                <div className="space-y-1 text-[11px] font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Entering:</span>
                    <span>{node.inputCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Passed:</span>
                    <span className="text-emerald-400">{node.outputCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dropped:</span>
                    <span className="text-rose-400">{node.droppedCount.toLocaleString()} ({node.dropPct}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Error Rate:</span>
                    <span>{node.errorPct}%</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 mt-1 text-purple-300 font-bold">
                    <span>Best Challenger:</span>
                    <span>+{node.bestChallengerDeltaPct}% Yield</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
