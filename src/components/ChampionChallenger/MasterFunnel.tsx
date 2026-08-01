import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WorkflowNode } from './championChallengerMock';
import { Sparkles, Zap, ExternalLink } from 'lucide-react';

interface MasterFunnelProps {
  nodes: WorkflowNode[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onOpenDeepAnalysis: (nodeId: string) => void;
}

export const MasterFunnel: React.FC<MasterFunnelProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onOpenDeepAnalysis,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const maxVolume = nodes[0].inputCount || 100000;
  const svgWidth = 520;
  const totalHeight = 560;
  const paddingY = 12;
  const stageCount = nodes.length;
  const stageHeight = (totalHeight - (stageCount - 1) * paddingY) / stageCount;

  return (
    <div className="w-full flex flex-col items-center p-6 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden select-none">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-gray-200 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Interactive Master Funnel</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Hero Decision Flow
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Single Source of Truth — Output Volume Scaling & Challenger Variance Analysis
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
            <span>Champion: 59.4% End Yield</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
            <Sparkles size={13} className="text-emerald-600" />
            <span>Best Challenger: 62.2% (+2.8%)</span>
          </div>
        </div>
      </div>

      {/* Hero Master SVG Funnel (Retaining vibrant blue gradients and SVG styling) */}
      <div className="relative w-full flex justify-center z-10 py-2">
        <svg width={svgWidth} height={totalHeight} className="overflow-visible">
          <defs>
            {/* Champion Gradient */}
            <linearGradient id="champGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
            </linearGradient>

            {/* Active Highlight Gradient */}
            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.9} />
            </linearGradient>

            {/* Red Drop Pulse Filter */}
            <filter id="redPulseGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#EF4444" floodOpacity={0.5} />
            </filter>

            {/* Purple Challenger Pulse Filter */}
            <filter id="purplePulseGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8B5CF6" floodOpacity={0.5} />
            </filter>
          </defs>

          {nodes.map((node, idx) => {
            const topRatio = node.inputCount / maxVolume;
            const botRatio = node.outputCount / maxVolume;

            const topWidth = Math.max(140, topRatio * (svgWidth - 60));
            const botWidth = Math.max(100, botRatio * (svgWidth - 60));

            const yTop = idx * (stageHeight + paddingY);
            const yBot = yTop + stageHeight;

            const xTopLeft = (svgWidth - topWidth) / 2;
            const xTopRight = (svgWidth + topWidth) / 2;
            const xBotRight = (svgWidth + botWidth) / 2;
            const xBotLeft = (svgWidth - botWidth) / 2;

            const points = `${xTopLeft},${yTop} ${xTopRight},${yTop} ${xBotRight},${yBot} ${xBotLeft},${yBot}`;

            const isSelected = node.id === selectedNodeId;
            const isHovered = hoveredNodeId === node.id;
            const isHighDrop = node.dropPct > 10;
            const isHighDeviation = node.bestChallengerDeltaPct > 2.0;

            return (
              <g
                key={node.id}
                onClick={() => {
                  onSelectNode(node.id);
                  onOpenDeepAnalysis(node.id);
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer group transition-all duration-300"
              >
                {/* Stage Polygon Shape */}
                <motion.polygon
                  points={points}
                  fill={isSelected ? 'url(#activeGrad)' : 'url(#champGrad)'}
                  stroke={
                    isSelected
                      ? '#1E40AF'
                      : isHighDrop
                      ? '#DC2626'
                      : isHighDeviation
                      ? '#7C3AED'
                      : 'rgba(255,255,255,0.6)'
                  }
                  strokeWidth={isSelected ? 3 : 1.5}
                  filter={
                    isHighDrop
                      ? 'url(#redPulseGlow)'
                      : isHighDeviation
                      ? 'url(#purplePulseGlow)'
                      : undefined
                  }
                  animate={{
                    scale: isHovered || isSelected ? 1.01 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                />

                {/* Stage Center Labels (Inside Trapezoid) */}
                <text
                  x={svgWidth / 2}
                  y={yTop + stageHeight / 2 - 4}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="800"
                  fontFamily="sans-serif"
                  className="pointer-events-none drop-shadow-md select-none"
                >
                  {node.name.replace(/^\d+\s*/, '')}
                </text>

                <text
                  x={svgWidth / 2}
                  y={yTop + stageHeight / 2 + 14}
                  textAnchor="middle"
                  fill="#E0F2FE"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {node.inputCount.toLocaleString()} → {node.outputCount.toLocaleString()} ({node.championConversionPct}%)
                </text>

                {/* Left Side Pill: Drop Rate */}
                <g transform={`translate(${Math.max(10, xTopLeft - 130)}, ${yTop + stageHeight / 2 - 12})`}>
                  <rect
                    width="118"
                    height="24"
                    rx="6"
                    fill={isHighDrop ? '#FEF2F2' : '#F8FAFC'}
                    stroke={isHighDrop ? '#FCA5A5' : '#E2E8F0'}
                    strokeWidth="1"
                  />
                  <text
                    x="59"
                    y="16"
                    textAnchor="middle"
                    fill={isHighDrop ? '#DC2626' : '#475569'}
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    Drop: {node.dropPct}% ({node.droppedCount.toLocaleString()})
                  </text>
                </g>

                {/* Right Side Pill: Best Challenger Uplift */}
                <g transform={`translate(${Math.min(svgWidth - 125, xTopRight + 12)}, ${yTop + stageHeight / 2 - 12})`}>
                  <rect
                    width="120"
                    height="24"
                    rx="6"
                    fill="#ECFDF5"
                    stroke="#6EE7B7"
                    strokeWidth="1"
                  />
                  <text
                    x="60"
                    y="16"
                    textAnchor="middle"
                    fill="#047857"
                    fontSize="10"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    Best: +{node.bestChallengerDeltaPct}% Chal
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stage Click CTA Indicator */}
      <div className="w-full mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 z-10 font-mono">
        <span className="flex items-center gap-1.5 text-blue-700 font-bold">
          <Zap size={14} /> Click any funnel stage to open Deep Analysis Drawer
        </span>
        <button
          onClick={() => onOpenDeepAnalysis(selectedNodeId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
        >
          <span>Open Stage Deep-Dive</span>
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
};
