import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Plus, Trash2, PanelLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { StateContextPanel } from './StateContextPanel';

export interface WorkflowConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestMapping: string;
  headers: Array<{ key: string; value: string }>;
}

interface WorkflowConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WorkflowConfig) => void;
  initialConfig: WorkflowConfig;
  initialInputs: Record<string, any>;
  workflowName: string;
  onBack: () => void;
  currentNodeId?: string;
  allNodes?: Array<{ id: string; type?: string; data: any }>;
  allEdges?: Array<{ source: string; target: string; data?: any }>;
  nodeExecutionStates?: Record<string, { status: string; logs: string[]; lastRun?: Date }>;
  onRunUpstreamNode?: (nodeId: string) => void;
}

export const WorkflowConfigModal: React.FC<WorkflowConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  initialInputs,
  workflowName,
  onBack,
  currentNodeId,
  allNodes,
  allEdges,
  nodeExecutionStates,
  onRunUpstreamNode,
}) => {
  const [config, setConfig] = useState<WorkflowConfig>(initialConfig);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'headers'>('request');
  const [showStatePanel, setShowStatePanel] = useState(true);
  const mappingRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const getFieldPaths = (obj: any, prefix = 'input'): string[] => {
    let paths: string[] = [];
    for (const key in obj) {
      const newPath = `${prefix}.${key}`;
      paths.push(newPath);
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        paths = paths.concat(getFieldPaths(obj[key], newPath));
      }
    }
    return paths;
  };

  const fieldPaths = getFieldPaths(initialInputs);

  const handleDragStart = (field: string) => setDraggedField(field);
  const handleDragEnd = () => setDraggedField(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedField) {
      const pos = (e.target as HTMLTextAreaElement).selectionStart || 0;
      const before = config.requestMapping.substring(0, pos);
      const after = config.requestMapping.substring(pos);
      setConfig({ ...config, requestMapping: `${before}{${draggedField}}${after}` });
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleFieldInsert = (fieldPath: string) => {
    const textarea = mappingRef.current;
    if (!textarea) {
      setConfig(prev => ({ ...prev, requestMapping: (prev.requestMapping || '') + fieldPath }));
      return;
    }
    setActiveTab('request');
    const start = textarea.selectionStart ?? cursorPosition;
    const end = textarea.selectionEnd ?? cursorPosition;
    const before = config.requestMapping.substring(0, start);
    const after = config.requestMapping.substring(end);
    setConfig(prev => ({ ...prev, requestMapping: before + fieldPath + after }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + fieldPath.length, start + fieldPath.length);
    }, 10);
  };

  const addHeader = () => setConfig({ ...config, headers: [...config.headers, { key: '', value: '' }] });

  const removeHeader = (index: number) =>
    setConfig({ ...config, headers: config.headers.filter((_, i) => i !== index) });

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...config.headers];
    newHeaders[index][field] = value;
    setConfig({ ...config, headers: newHeaders });
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-stretch">
      <div className="bg-white w-full flex flex-col shadow-2xl">

        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Back">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Configure Workflow Request</h2>
              <p className="text-xs text-gray-500">Workflow: <span className="font-medium text-gray-700">{workflowName}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStatePanel(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                showStatePanel ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <PanelLeft className="w-3.5 h-3.5" />
              State Context
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {showStatePanel && currentNodeId && allNodes && allEdges && (
            <StateContextPanel
              currentNodeId={currentNodeId}
              nodes={allNodes}
              edges={allEdges}
              inputs={initialInputs}
              nodeExecutionStates={nodeExecutionStates || {}}
              onRunUpstreamNode={onRunUpstreamNode}
              onFieldInsert={handleFieldInsert}
            />
          )}

          {showStatePanel && !currentNodeId && (
            <div className="w-72 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Available Fields</h3>
              <div className="space-y-2">
                {fieldPaths.map((field) => (
                  <div
                    key={field}
                    draggable
                    onDragStart={() => handleDragStart(field)}
                    onDragEnd={handleDragEnd}
                    className="bg-white border border-gray-200 rounded-md px-3 py-2 text-xs font-mono cursor-move hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    {`{${field}}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex gap-1 mb-6 border-b border-gray-200">
              {(['request', 'headers'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-semibold text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'request' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Workflow URL</label>
                  <input
                    type="text"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://api.example.com/workflow or leave empty for internal"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty to execute the selected workflow internally.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Method</label>
                  <select
                    value={config.method}
                    onChange={(e) => setConfig({ ...config, method: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div>
                  <div className="mb-1">
                    <h3 className="text-sm font-bold text-gray-800">Request Body Mapping</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Click <strong>Insert</strong> on any field in the left panel.
                      Use <code className="bg-gray-100 px-1 rounded font-mono text-xs">{'{input.field}'}</code> syntax.
                    </p>
                  </div>
                  <div className="relative">
                    <textarea
                      ref={mappingRef}
                      value={config.requestMapping}
                      onChange={(e) => setConfig({ ...config, requestMapping: e.target.value })}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
                      onClick={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
                      onKeyUp={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
                      className="w-full h-64 px-4 py-3 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 hover:bg-white transition-colors resize-none leading-relaxed"
                      placeholder={'{\n  "input": {\n    "message": "{input.data}"\n  }\n}'}
                      spellCheck={false}
                    />
                    <div className="absolute bottom-2 right-3 text-xs text-gray-300 pointer-events-none">
                      Drop fields here
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">HTTP Headers</h3>
                  <Button onClick={addHeader} className="bg-gray-700 hover:bg-gray-800 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Header
                  </Button>
                </div>
                <div className="space-y-3">
                  {config.headers.map((header, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Header Name"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="text"
                        placeholder="Header Value"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button onClick={() => removeHeader(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {config.headers.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No headers added yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50">
          <Button variant="outline" onClick={onClose} className="px-5 py-2 text-sm">Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-semibold">
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
