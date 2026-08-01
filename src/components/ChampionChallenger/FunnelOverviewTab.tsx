import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Trophy,
  Eye,
  Zap,
  Layers,
  TrendingDown,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDown,
  Filter,
} from 'lucide-react';
import {
  DYNAMIC_FUNNEL_STAGES,
  DYNAMIC_REQUESTS,
  CandidateModel,
  DynamicRequestItem,
} from './championChallengerMock';

interface FunnelOverviewTabProps {
  candidates: CandidateModel[];
  onSelectRequest: (request: DynamicRequestItem) => void;
}

// Enhanced Interactive MUI-Style SVG Funnel Component
interface SvgFunnelProps {
  candidate: CandidateModel;
  stages: { id: string; name: string; nodeType: string; value: number; maxVal: number; drop: number; dropReason?: string }[];
  height?: number;
  width?: number;
  selectedStageIndex: number | null;
  onSelectStage: (stageIndex: number) => void;
}

const InteractiveSvgFunnelChart: React.FC<SvgFunnelProps> = ({
  candidate,
  stages,
  height = 340,
  width = 280,
  selectedStageIndex,
  onSelectStage,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const stageCount = stages.length;
  const paddingY = 10;
  const availableHeight = height - (stageCount - 1) * paddingY;
  const stageHeight = availableHeight / stageCount;
  const svgWidth = width;

  const activeIdx = hoveredIndex !== null ? hoveredIndex : selectedStageIndex;

  return (
    <div className="flex flex-col items-center p-5 rounded-2xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md w-full max-w-md mx-auto">
      {/* Header Badge */}
      <div className="flex items-center justify-between w-full mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: candidate.color }} />
          <div>
            <span className="font-bold text-xs block text-gray-900">
              {candidate.name}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              Click stage to inspect payload
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
          {((stages[stages.length - 1].value / stages[0].value) * 100).toFixed(0)}% End Yield
        </span>
      </div>

      {/* SVG Tapering Funnel */}
      <div className="relative w-full flex justify-center py-1">
        <svg width={svgWidth} height={height} className="overflow-visible select-none">
          <defs>
            <linearGradient id={`grad-active-${candidate.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={candidate.color} stopOpacity={1} />
              <stop offset="100%" stopColor={candidate.color} stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id={`grad-normal-${candidate.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={candidate.color} stopOpacity={0.85} />
              <stop offset="100%" stopColor={candidate.color} stopOpacity={0.65} />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {stages.map((stage, idx) => {
            const nextVal = idx < stages.length - 1 ? stages[idx + 1].value : stage.value;
            const maxVal = stages[0].value || 10;

            const topRatio = stage.value / maxVal;
            const botRatio = nextVal / maxVal;

            const topWidth = Math.max(70, topRatio * (svgWidth - 40));
            const botWidth = Math.max(50, botRatio * (svgWidth - 40));

            const yTop = idx * (stageHeight + paddingY);
            const yBot = yTop + stageHeight;

            const xTopLeft = (svgWidth - topWidth) / 2;
            const xTopRight = (svgWidth + topWidth) / 2;
            const xBotRight = (svgWidth + botWidth) / 2;
            const xBotLeft = (svgWidth - botWidth) / 2;

            const points = `${xTopLeft},${yTop} ${xTopRight},${yTop} ${xBotRight},${yBot} ${xBotLeft},${yBot}`;
            const isSelected = selectedStageIndex === idx;
            const isHovered = hoveredIndex === idx;
            const isActive = isSelected || isHovered;

            return (
              <g
                key={idx}
                onClick={() => onSelectStage(idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Stage Polygon */}
                <polygon
                  points={points}
                  fill={`url(#grad-${isActive ? 'active' : 'normal'}-${candidate.id})`}
                  stroke={isActive ? '#0f172a' : 'rgba(255,255,255,0.6)'}
                  strokeWidth={isActive ? 2.5 : 1}
                  filter={isActive ? 'url(#shadow)' : undefined}
                  className="transition-all duration-200 hover:brightness-105"
                />

                {/* Stage Text Inside Funnel Section */}
                <text
                  x={svgWidth / 2}
                  y={yTop + stageHeight / 2 + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {stage.value} out ({((stage.value / maxVal) * 100).toFixed(0)}%)
                </text>

                {/* Drop Indicator Icon between stages */}
                {idx < stages.length - 1 && stage.drop > 0 && (
                  <g transform={`translate(${xBotRight + 6}, ${yBot - 2})`}>
                    <rect x="0" y="-8" width="54" height="16" rx="4" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1" />
                    <text x="27" y="3" textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="700" fontFamily="monospace">
                      -{stage.drop} drop
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stage Labels Footnote */}
      <div className="w-full mt-4 pt-3 border-t border-gray-100 space-y-1 text-[11px]">
        {stages.map((s, idx) => (
          <div
            key={idx}
            onClick={() => onSelectStage(idx)}
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              selectedStageIndex === idx
                ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-xs'
                : hoveredIndex === idx
                ? 'bg-gray-100 text-gray-900 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 truncate max-w-[170px]">
              <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-[9px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="truncate">{s.name}</span>
            </div>
            <span className="font-mono font-bold" style={{ color: candidate.color }}>
              {s.value} out
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FunnelOverviewTab: React.FC<FunnelOverviewTabProps> = ({ candidates, onSelectRequest }) => {
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);

  const activeStage = DYNAMIC_FUNNEL_STAGES[selectedStageIndex] || DYNAMIC_FUNNEL_STAGES[0];

  // Compute drop distribution data dynamically for active candidates
  const dropDistributionData = candidates.map((cand) => {
    let totalDrops = 0;
    DYNAMIC_FUNNEL_STAGES.forEach((stage) => {
      const metric = stage.metrics[cand.id];
      if (metric) totalDrops += metric.drop;
    });
    return {
      name: cand.name,
      value: Math.max(1, totalDrops),
      color: cand.color,
    };
  });

  const grandTotalDrops = dropDistributionData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      {/* KPI Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Requests */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Total Requests</div>
          <div className="flex items-baseline gap-1.5 font-bold text-gray-900 text-xl font-mono">
            {candidates.map((cand, idx) => (
              <React.Fragment key={cand.id}>
                {idx > 0 && <span className="text-xs text-gray-400 font-sans">/</span>}
                <span style={{ color: cand.color }}>10</span>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-gray-100 font-medium">
            {candidates.map((cand) => (
              <span key={cand.id} style={{ color: cand.color }}>
                {cand.version}
              </span>
            ))}
          </div>
        </div>

        {/* Overall Completion Rate */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Completion Rate</div>
          <div className="flex items-baseline gap-1.5 font-bold text-gray-900 text-sm font-mono">
            {candidates.map((cand, idx) => {
              const completed = DYNAMIC_REQUESTS.filter(
                (r) => r.results[cand.id]?.status === 'Completed'
              ).length;
              const pct = (completed / DYNAMIC_REQUESTS.length) * 100;
              return (
                <React.Fragment key={cand.id}>
                  {idx > 0 && <span className="text-xs text-gray-400 font-sans">/</span>}
                  <span style={{ color: cand.color }}>{pct.toFixed(0)}%</span>
                </React.Fragment>
              );
            })}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100 font-mono">
            {candidates.length} Candidate Models
          </div>
        </div>

        {/* Total Dropped */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Total Dropped</div>
          <div className="flex items-baseline gap-1.5 font-bold text-gray-900 text-sm font-mono">
            {candidates.map((cand, idx) => {
              const dropped = DYNAMIC_REQUESTS.filter(
                (r) => r.results[cand.id]?.status === 'Dropped'
              ).length;
              return (
                <React.Fragment key={cand.id}>
                  {idx > 0 && <span className="text-xs text-gray-400 font-sans">/</span>}
                  <span style={{ color: cand.color }}>{dropped}</span>
                </React.Fragment>
              );
            })}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 font-mono">
            Dropped Count
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Avg Response Time</div>
          <div className="flex items-baseline gap-1.5 font-bold text-gray-900 text-xs font-mono">
            {candidates.map((cand, idx) => {
              const times = DYNAMIC_REQUESTS.map((r) => r.results[cand.id]?.responseTime || 450);
              const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
              return (
                <React.Fragment key={cand.id}>
                  {idx > 0 && <span className="text-xs text-gray-400 font-sans">/</span>}
                  <span style={{ color: cand.color }}>{avgTime}ms</span>
                </React.Fragment>
              );
            })}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <Zap size={12} />
            <span>Fastest: Challenger B (398ms)</span>
          </div>
        </div>

        {/* Total Executions */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Total Executions</div>
          <div className="text-2xl font-bold text-gray-900 font-mono">
            {candidates.length * 10}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100 font-mono">
            {candidates.length} x 10 Batch Executions
          </div>
        </div>
      </div>

      {/* MUI-STYLE TRUE VISUAL SVG FUNNEL CHARTS SECTION */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                Interactive Visual Funnel Charts (MUI Style)
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                Click SVG Stages to Inspect
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Select any stage on the SVG funnel chart to view node payload schemas, drop reasons, and conversion analytics
            </p>
          </div>
        </div>

        {/* Layout Adaptation: Single Candidate vs Multi Candidates */}
        {candidates.length === 1 ? (
          /* RICH 2-COLUMN LAYOUT WHEN ONLY 1 CANDIDATE IS SELECTED */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
            {/* Left: Featured Funnel SVG */}
            <div className="lg:col-span-5 flex justify-center">
              {(() => {
                const cand = candidates[0];
                const funnelStagesData = DYNAMIC_FUNNEL_STAGES.map((s) => ({
                  id: s.id,
                  name: s.stage_name,
                  nodeType: s.node_type,
                  value: s.metrics[cand.id]?.out || 5,
                  maxVal: 10,
                  drop: s.metrics[cand.id]?.drop || 0,
                  dropReason: s.id === 'stage-2' ? 'High Risk Score thresholds exceeded' : undefined,
                }));

                return (
                  <InteractiveSvgFunnelChart
                    candidate={cand}
                    stages={funnelStagesData}
                    height={330}
                    width={320}
                    selectedStageIndex={selectedStageIndex}
                    onSelectStage={setSelectedStageIndex}
                  />
                );
              })()}
            </div>

            {/* Right: Active Stage Detailed Deep-Dive Panel */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-4 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                    {selectedStageIndex + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{activeStage.stage_name}</h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white border border-gray-300 rounded text-gray-600 font-bold">
                      {activeStage.node_type}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-blue-700 block">
                    {activeStage.metrics[candidates[0].id]?.out || 0} / 10 Retained
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Drop Rate: {activeStage.metrics[candidates[0].id]?.dropPct || 0}%
                  </span>
                </div>
              </div>

              {/* Node Payload Preview */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <Info size={14} className="text-blue-600" />
                  <span>Stage Input Schema & Parameters</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-gray-900 text-sky-300 text-xs font-mono overflow-x-auto border border-gray-800">
                  {JSON.stringify(
                    {
                      node_id: `node-${selectedStageIndex + 1}`,
                      stage_name: activeStage.stage_name,
                      type: activeStage.node_type,
                      throughput: '10 requests/batch',
                      pass_count: activeStage.metrics[candidates[0].id]?.out,
                      drop_count: activeStage.metrics[candidates[0].id]?.drop,
                      drop_threshold: '0.75 risk_score',
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              {/* Drop Logs if drops exist */}
              {activeStage.metrics[candidates[0].id]?.drop > 0 && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle size={14} className="text-red-600" />
                    <span>Drop Reason Trace ({activeStage.metrics[candidates[0].id]?.drop} dropped)</span>
                  </div>
                  <p className="text-[11px] text-red-700 font-mono">
                    ⚠️ Threshold Violation: High Risk Score / Rule condition unsatisfied at node step {selectedStageIndex + 1}.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* RESPONSIVE GRID FOR MULTIPLE CANDIDATES */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-2">
            {candidates.map((cand) => {
              const funnelStagesData = DYNAMIC_FUNNEL_STAGES.map((s) => ({
                id: s.id,
                name: s.stage_name,
                nodeType: s.node_type,
                value: s.metrics[cand.id]?.out || 5,
                maxVal: 10,
                drop: s.metrics[cand.id]?.drop || 0,
              }));

              return (
                <InteractiveSvgFunnelChart
                  key={cand.id}
                  candidate={cand}
                  stages={funnelStagesData}
                  height={290}
                  width={250}
                  selectedStageIndex={selectedStageIndex}
                  onSelectStage={setSelectedStageIndex}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Table & Drop Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Column */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Candidate Performance Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-2.5 px-2">Candidate Model</th>
                  <th className="py-2.5 px-2 text-center">Completed</th>
                  <th className="py-2.5 px-2 text-center">Dropped</th>
                  <th className="py-2.5 px-2 text-right">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
                {candidates.map((cand) => {
                  const completed = DYNAMIC_REQUESTS.filter(
                    (r) => r.results[cand.id]?.status === 'Completed'
                  ).length;
                  const dropped = DYNAMIC_REQUESTS.filter(
                    (r) => r.results[cand.id]?.status === 'Dropped'
                  ).length;

                  return (
                    <tr key={cand.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-2 font-sans font-bold flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cand.color }} />
                        <span style={{ color: cand.color }}>{cand.name.split(' ')[0]} {cand.version}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-700">{completed} ({completed * 10}%)</td>
                      <td className="py-2.5 px-2 text-center text-red-600 font-medium">{dropped}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-gray-900">
                        {cand.id === 'chall_b' ? '398ms' : cand.id === 'champ' ? '480ms' : '640ms'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donut Chart Column */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Drop Distribution Across Models</h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dropDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dropDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-gray-500">Total Drops</span>
                <span className="text-xl font-bold text-gray-900">{grandTotalDrops}</span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 text-xs max-h-36 overflow-y-auto">
              {dropDistributionData.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-700 font-medium text-[11px] truncate max-w-[110px]">
                      {d.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">{d.value} Drops</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Request Execution Matrix Table */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Request Execution Matrix ({candidates.length} Candidate Models)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Side-by-side status and response time breakdown for each incoming request
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-gray-100 text-gray-700 border border-gray-200">
            {DYNAMIC_REQUESTS.length} Requests Sampled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                <th className="py-3 px-2">Request ID</th>
                {candidates.map((cand) => (
                  <th key={cand.id} className="py-3 px-2" style={{ color: cand.color }}>
                    {cand.version} Status / RT
                  </th>
                ))}
                <th className="py-3 px-2 text-center">Winning Candidate</th>
                <th className="py-3 px-2 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
              {DYNAMIC_REQUESTS.map((req) => {
                const winnerCand = candidates.find((c) => c.id === req.winnerCandidateId) || candidates[0];

                return (
                  <tr
                    key={req.id}
                    onClick={() => onSelectRequest(req)}
                    className="hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <td className="py-3 px-2 font-bold text-blue-600">{req.request_id}</td>
                    {candidates.map((cand) => {
                      const res = req.results[cand.id];
                      return (
                        <td key={cand.id} className="py-3 px-2">
                          {res?.status === 'Completed' ? (
                            <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                              Completed ({res.responseTime}ms)
                            </span>
                          ) : (
                            <span className="text-red-700 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200 text-[11px]">
                              Dropped ({res?.responseTime || 200}ms)
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 text-center">
                      <span
                        style={{ backgroundColor: `${winnerCand.color}15`, color: winnerCand.color, borderColor: `${winnerCand.color}40` }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-sans font-bold border"
                      >
                        <Trophy size={11} /> {winnerCand.version}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRequest(req);
                        }}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all border border-gray-200"
                        title="View Payload Details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
