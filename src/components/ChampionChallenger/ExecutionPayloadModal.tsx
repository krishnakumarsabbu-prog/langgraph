import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, Copy, Check, ChevronDown, ChevronRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { RequestComparisonItem, StepNodeExecution } from './championChallengerMock';

interface ExecutionPayloadModalProps {
  request: RequestComparisonItem | null;
  onClose: () => void;
}

export const ExecutionPayloadModal: React.FC<ExecutionPayloadModalProps> = ({ request, onClose }) => {
  const [copiedInput, setCopiedInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'champion' | 'challenger' | 'diff'>('overview');
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={14} />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <XCircle size={14} />
        Dropped {dropReason ? `(${dropReason})` : ''}
      </span>
    );
  };

  const renderStepNode = (node: StepNodeExecution, index: number, isChampion: boolean) => {
    const isExpanded = !!expandedNodes[`${isChampion ? 'champ' : 'chall'}-${index}`];
    const key = `${isChampion ? 'champ' : 'chall'}-${index}`;

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
                <span className="text-blue-700 font-semibold">Winner: {request.winner}</span>
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

        {/* Status Bar */}
        <div className="px-6 py-2.5 bg-gray-100/70 border-b border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-700">Champion:</span>
              {renderStatusBadge(request.champion_status, request.champion_drop_reason)}
              <span className="text-gray-500 font-mono">({request.champion_response_time}ms)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-700">Challenger:</span>
              {renderStatusBadge(request.challenger_status, request.challenger_drop_reason)}
              <span className="text-gray-500 font-mono">({request.challenger_response_time}ms)</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 bg-gray-50">
          {[
            { id: 'overview', label: 'Input Request Payload' },
            { id: 'champion', label: `Champion Execution (${request.champion_executions.length} steps)` },
            { id: 'challenger', label: `Challenger Execution (${request.challenger_executions.length} steps)` },
            { id: 'diff', label: 'Side-by-Side Path Diff' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-gray-200 border-b-transparent shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
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

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs mb-2">
                    <ShieldCheck size={16} />
                    <span>Champion Path Traversal</span>
                  </div>
                  <div className="font-mono text-xs text-gray-900 p-2.5 rounded-lg bg-white border border-blue-200 font-medium">
                    {request.champion_path}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs mb-2">
                    <Zap size={16} />
                    <span>Challenger Path Traversal</span>
                  </div>
                  <div className="font-mono text-xs text-gray-900 p-2.5 rounded-lg bg-white border border-emerald-200 font-medium">
                    {request.challenger_path}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'champion' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-700">Champion Execution Node Trace</h3>
                <span className="text-xs text-gray-500 font-mono">Total Time: {request.champion_response_time}ms</span>
              </div>

              {request.champion_executions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs bg-white rounded-xl border border-gray-200">
                  No step details available for this sample mock item.
                </div>
              ) : (
                request.champion_executions.map((node, index) => renderStepNode(node, index, true))
              )}
            </div>
          )}

          {activeTab === 'challenger' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-emerald-700">Challenger Execution Node Trace</h3>
                <span className="text-xs text-gray-500 font-mono">Total Time: {request.challenger_response_time}ms</span>
              </div>

              {request.challenger_executions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs bg-white rounded-xl border border-gray-200">
                  No step details available for this sample mock item.
                </div>
              ) : (
                request.challenger_executions.map((node, index) => renderStepNode(node, index, false))
              )}
            </div>
          )}

          {activeTab === 'diff' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <span>Champion Execution Steps</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-mono">
                    {request.champion_status}
                  </span>
                </h3>
                <div className="space-y-2">
                  {request.champion_executions.map((node, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white border border-gray-200 text-xs shadow-xs">
                      <div className="flex justify-between text-gray-900 font-medium">
                        <span>{idx + 1}. {node.node_name}</span>
                        <span className="text-gray-500 font-mono">{node.duration_ms}ms</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 font-mono">{node.node_id} • {node.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <span>Challenger Execution Steps</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                    {request.challenger_status}
                  </span>
                </h3>
                <div className="space-y-2">
                  {request.challenger_executions.map((node, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs shadow-xs ${
                        node.status === 'completed'
                          ? 'bg-white border-gray-200'
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}
                    >
                      <div className="flex justify-between font-medium text-gray-900">
                        <span>{idx + 1}. {node.node_name}</span>
                        <span className="text-gray-500 font-mono">{node.duration_ms}ms</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 font-mono">
                        {node.node_id} • {node.status}
                        {node.drop_reason && <div className="text-red-700 mt-1 font-sans font-medium">Drop: {node.drop_reason}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
