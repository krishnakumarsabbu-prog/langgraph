import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, Copy, Check, ChevronDown, ChevronRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { CandidateModel, DynamicRequestItem, StepNodeExecution } from './championChallengerMock';

interface ExecutionPayloadModalProps {
  request: DynamicRequestItem | null;
  candidates: CandidateModel[];
  onClose: () => void;
}

export const ExecutionPayloadModal: React.FC<ExecutionPayloadModalProps> = ({ request, candidates, onClose }) => {
  const [copiedInput, setCopiedInput] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  if (!request) return null;

  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInput(true);
    setTimeout(() => setCopiedInput(false), 2000);
  };

  const renderStatusBadge = (status: 'Completed' | 'Dropped' | 'Failed', dropReason?: string) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <XCircle size={12} />
        Dropped {dropReason ? `(${dropReason})` : ''}
      </span>
    );
  };

  const renderStepNode = (node: StepNodeExecution, index: number, prefix: string) => {
    const key = `${prefix}-${index}`;
    const isExpanded = !!expandedNodes[key];

    return (
      <div
        key={key}
        className={`rounded-xl border transition-all ${
          node.status === 'completed'
            ? 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
            : 'bg-red-50/50 border-red-200 hover:border-red-300'
        }`}
      >
        <div
          onClick={() => toggleNodeExpand(key)}
          className="flex items-center justify-between p-4 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">
              {index + 1}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{node.node_name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                  {node.node_type}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{node.node_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
              <Clock size={12} />
              <span>{node.duration_ms}ms</span>
            </div>
            {node.status === 'completed' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Completed
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Dropped
              </span>
            )}
            {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 border-t border-gray-200 bg-gray-50/70 space-y-3">
            {node.drop_reason && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                ⚠️ Drop Reason: {node.drop_reason}
              </div>
            )}
            <div>
              <div className="text-xs font-mono text-gray-600 mb-1 font-semibold">Input Payload:</div>
              <pre className="p-3 rounded-lg bg-gray-900 text-sky-300 text-xs font-mono overflow-x-auto border border-gray-800">
                {JSON.stringify(node.input_payload, null, 2)}
              </pre>
            </div>
            {node.output_payload && (
              <div>
                <div className="text-xs font-mono text-gray-600 mb-1 font-semibold">Output Payload:</div>
                <pre className="p-3 rounded-lg bg-gray-900 text-emerald-400 text-xs font-mono overflow-x-auto border border-gray-800">
                  {JSON.stringify(node.output_payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const winningCand = candidates.find((c) => c.id === request.winnerCandidateId) || candidates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 font-mono">{request.request_id}</h2>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-gray-200 text-gray-700">
                  Session: {request.session_id}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>Timestamp: {request.timestamp}</span>
                <span>•</span>
                <span style={{ color: winningCand.color }} className="font-bold">
                  Winner: {winningCand.name}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Status Bar across Active Candidates */}
        <div className="px-6 py-2.5 bg-gray-100/70 border-b border-gray-200 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex flex-wrap items-center gap-4">
            {candidates.map((cand) => {
              const res = request.results[cand.id];
              return (
                <div key={cand.id} className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: cand.color }}>
                    {cand.version}:
                  </span>
                  {renderStatusBadge(res?.status || 'Completed', res?.dropReason)}
                  <span className="text-gray-500 font-mono">({res?.responseTime || 400}ms)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Candidate Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 border-gray-200 border-b-transparent shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100'
            }`}
          >
            Input Request Payload
          </button>

          {candidates.map((cand) => {
            const execCount = request.results[cand.id]?.executions?.length || 5;
            return (
              <button
                key={cand.id}
                onClick={() => setActiveTab(cand.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-t border-x whitespace-nowrap ${
                  activeTab === cand.id
                    ? 'bg-white text-blue-600 border-gray-200 border-b-transparent shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100'
                }`}
                style={{ color: activeTab === cand.id ? cand.color : undefined }}
              >
                {cand.name.split(' ')[0]} {cand.version} ({execCount} steps)
              </button>
            );
          })}

          <button
            onClick={() => setActiveTab('diff')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'diff'
                ? 'bg-white text-blue-600 border-gray-200 border-b-transparent shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100'
            }`}
          >
            Multi-Path Diff
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50/30">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Global Execution Input Payload</h3>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(request.input_payload, null, 2))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-700 hover:bg-gray-100 transition-all border border-gray-300 shadow-xs"
                >
                  {copiedInput ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedInput ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-sky-300 text-xs font-mono leading-relaxed overflow-x-auto shadow-inner">
                {JSON.stringify(request.input_payload, null, 2)}
              </pre>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {candidates.map((cand) => {
                  const res = request.results[cand.id];
                  return (
                    <div
                      key={cand.id}
                      className={`p-4 rounded-xl border ${cand.bgColor} ${cand.borderColor}`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs mb-2" style={{ color: cand.color }}>
                        <Zap size={16} />
                        <span>{cand.name} Traversal</span>
                      </div>
                      <div className="font-mono text-xs text-gray-900 p-2.5 rounded-lg bg-white border border-gray-200 font-medium">
                        {res?.path || 'S1 → D1 → S2 → D2 → S3'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'diff' && (
            <div className="space-y-3">
              {(() => {
                const targetCand = candidates.find((c) => c.id === activeTab) || candidates[0];
                const res = request.results[targetCand.id];
                const executions = res?.executions && res.executions.length > 0
                  ? res.executions
                  : [
                      { step_id: '1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 40, input_payload: {}, output_payload: { valid: true } },
                      { step_id: '2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'completed', duration_ms: 100, input_payload: {}, output_payload: { pass: true } },
                      { step_id: '3', node_id: 's2', node_name: 'Data Enrichment', node_type: 'service', status: 'completed', duration_ms: 180, input_payload: {}, output_payload: { enriched: true } },
                      { step_id: '4', node_id: 'd2', node_name: 'Fraud Check', node_type: 'decision', status: 'completed', duration_ms: 70, input_payload: {}, output_payload: { approved: true } },
                      { step_id: '5', node_id: 's3', node_name: 'Final Processing', node_type: 'service', status: 'completed', duration_ms: 50, input_payload: {}, output_payload: { status: 'SUCCESS' } },
                    ];

                return (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold" style={{ color: targetCand.color }}>
                        {targetCand.name} Execution Node Trace
                      </h3>
                      <span className="text-xs text-gray-500 font-mono">
                        Total Latency: {res?.responseTime || 420}ms
                      </span>
                    </div>
                    {executions.map((node: any, index: number) =>
                      renderStepNode(node, index, targetCand.id)
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'diff' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {candidates.map((cand) => {
                const res = request.results[cand.id];
                return (
                  <div key={cand.id} className="p-4 rounded-xl bg-white border border-gray-200 space-y-2">
                    <h4 className="text-xs font-bold" style={{ color: cand.color }}>
                      {cand.name}
                    </h4>
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800">
                      {res?.path || 'S1 → D1 → S2 → D2 → S3'}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Status: {res?.status || 'Completed'} ({res?.responseTime || 400}ms)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 text-gray-800 transition-all border border-gray-300 shadow-xs"
          >
            Close Payload View
          </button>
        </div>
      </div>
    </div>
  );
};
