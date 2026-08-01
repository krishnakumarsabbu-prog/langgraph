import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Check, Sparkles, Layers, ArrowRightLeft, Database, HardDriveDownload, HelpCircle, Tag } from 'lucide-react';
import { RuleGroup, RuleCondition, Operator, ValueType, compileRuleGroupToPython, DEFAULT_RULE_GROUP } from '../../utils/ruleCompiler';
import { Button } from '../ui/button';
import { useLangGraphStore } from '../../stores/langGraphStore';

interface VisualRuleBuilderProps {
  initialGroup?: RuleGroup;
  onChange: (group: RuleGroup, compiledPython: string) => void;
}

// Deep recursive key discovery helper
const extractKeysFromNodeData = (obj: any, prefix = ''): string[] => {
  if (!obj) return [];
  let parsed = obj;
  if (typeof obj === 'string') {
    try {
      parsed = JSON.parse(obj);
    } catch {
      return [];
    }
  }
  if (typeof parsed !== 'object' || parsed === null) return [];

  let keys: string[] = [];
  if (Array.isArray(parsed)) {
    parsed.forEach((item, idx) => {
      const p = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
      if (typeof item === 'object' && item !== null) {
        keys = keys.concat(extractKeysFromNodeData(item, p));
      } else {
        keys.push(p);
      }
    });
    return keys;
  }

  for (const k in parsed) {
    const p = prefix ? `${prefix}.${k}` : k;
    keys.push(p);
    if (parsed[k] && typeof parsed[k] === 'object') {
      const nested = extractKeysFromNodeData(parsed[k], p);
      keys = keys.concat(nested);
    }
  }
  return Array.from(new Set(keys));
};

export const VisualRuleBuilder: React.FC<VisualRuleBuilderProps> = ({
  initialGroup = DEFAULT_RULE_GROUP,
  onChange,
}) => {
  const { nodes, edges, selectedNodeId, inputs } = useLangGraphStore();
  const [ruleGroup, setRuleGroup] = useState<RuleGroup>(initialGroup);
  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});

  // Compute preceding upstream nodes connected strictly via incoming edges to current Decision Node
  const precedingNodes = useMemo(() => {
    const upstreamList: Array<{ id: string; label: string; type: string; fields: string[] }> = [];

    // 1. Initial Workflow Inputs
    if (inputs && Object.keys(inputs).length > 0) {
      const inputKeys = extractKeysFromNodeData(inputs);
      upstreamList.push({
        id: 'input',
        label: '📥 Initial Workflow Inputs',
        type: 'input',
        fields: inputKeys,
      });
    }

    // 2. Incoming edge preceding nodes
    if (selectedNodeId) {
      const incomingEdges = edges.filter((e) => e.target === selectedNodeId);
      const incomingSourceIds = incomingEdges.map((e) => e.source);
      const connectedPreceding = nodes.filter((n) => incomingSourceIds.includes(n.id) && n.id !== selectedNodeId);

      connectedPreceding.forEach((n) => {
        const reqBodyKeys = extractKeysFromNodeData((n.data as any)?.requestBody || (n.data as any)?.config?.requestBody);
        const respBodyKeys = extractKeysFromNodeData((n.data as any)?.responseBody || (n.data as any)?.outputs);
        const dynamicKeys = Array.from(new Set([...reqBodyKeys, ...respBodyKeys]));

        upstreamList.push({
          id: n.id,
          label: `🔹 ${(n.data as any)?.label || n.id} (${n.type})`,
          type: n.type,
          fields: dynamicKeys,
        });
      });
    } else {
      nodes.forEach((n) => {
        if (n.type !== 'decisionNode') {
          const reqBodyKeys = extractKeysFromNodeData((n.data as any)?.requestBody || (n.data as any)?.config?.requestBody);
          const respBodyKeys = extractKeysFromNodeData((n.data as any)?.responseBody || (n.data as any)?.outputs);
          const dynamicKeys = Array.from(new Set([...reqBodyKeys, ...respBodyKeys]));

          upstreamList.push({
            id: n.id,
            label: `🔹 ${(n.data as any)?.label || n.id} (${n.type})`,
            type: n.type,
            fields: dynamicKeys,
          });
        }
      });
    }

    return upstreamList;
  }, [nodes, edges, selectedNodeId, inputs]);

  const updateGroup = (updated: RuleGroup) => {
    setRuleGroup(updated);
    const python = compileRuleGroupToPython(updated);
    onChange(updated, python);
  };

  const handleLogicChange = (logic: 'AND' | 'OR') => {
    updateGroup({ ...ruleGroup, logic });
  };

  const handleAddCondition = () => {
    const defaultNode = precedingNodes[0]?.id || 'input';
    const defaultField = precedingNodes[0]?.fields?.[0] || 'result';

    const newCond: RuleCondition = {
      id: `rule-${Date.now()}`,
      nodeId: defaultNode,
      field: defaultField,
      operator: '==',
      value: 'SUCCESS',
      valueType: 'string',
      min: 0,
      max: 100,
      step: 1,
    };
    updateGroup({
      ...ruleGroup,
      conditions: [...ruleGroup.conditions, newCond],
    });
  };

  const handleRemoveCondition = (id: string) => {
    updateGroup({
      ...ruleGroup,
      conditions: ruleGroup.conditions.filter((c) => c.id !== id),
    });
  };

  const handleConditionChange = (id: string, updates: Partial<RuleCondition>) => {
    const newConditions = ruleGroup.conditions.map((cond) => {
      if (cond.id !== id) return cond;

      const updated = { ...cond, ...updates };

      // Type transition handling
      if (updates.valueType && updates.valueType !== cond.valueType) {
        if (updates.valueType === 'boolean') {
          updated.value = true;
          updated.operator = '==';
        } else if (updates.valueType === 'number') {
          updated.value = 100;
          updated.operator = '>=';
          updated.min = 0;
          updated.max = 1000;
          updated.step = 1;
        } else if (updates.valueType === 'select') {
          updated.options = updated.options && updated.options.length > 0 ? updated.options : ['PASS', 'FAIL'];
          updated.value = [updated.options[0]];
          updated.operator = 'in';
        } else {
          updated.value = '';
          updated.operator = '==';
        }
      }

      return updated;
    });

    updateGroup({ ...ruleGroup, conditions: newConditions });
  };

  const handleAddSelectOption = (cond: RuleCondition) => {
    const inputVal = (newOptionInputs[cond.id] || '').trim();
    if (!inputVal) return;

    const existingOptions = cond.options || [];
    if (!existingOptions.includes(inputVal)) {
      const updatedOptions = [...existingOptions, inputVal];
      handleConditionChange(cond.id, { options: updatedOptions });
    }
    setNewOptionInputs((prev) => ({ ...prev, [cond.id]: '' }));
  };

  const handleRemoveSelectOption = (cond: RuleCondition, optToRemove: string) => {
    const updatedOptions = (cond.options || []).filter((o) => o !== optToRemove);
    const currentValue = Array.isArray(cond.value) ? cond.value.filter((v) => v !== optToRemove) : '';
    handleConditionChange(cond.id, { options: updatedOptions, value: currentValue });
  };

  const toggleSelectOption = (cond: RuleCondition, opt: string) => {
    const currentList: string[] = Array.isArray(cond.value) ? cond.value : [String(cond.value)];
    const newList = currentList.includes(opt)
      ? currentList.filter((item) => item !== opt)
      : [...currentList, opt];
    handleConditionChange(cond.id, { value: newList });
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/70 text-slate-900 p-5 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dynamic Upstream Node Rule Builder</h3>
            <p className="text-xs text-slate-600">
              Build rule expressions dynamically by picking preceding connected nodes & output fields.
            </p>
          </div>
        </div>

        {/* Logic Switch */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/80">
          <button
            type="button"
            onClick={() => handleLogicChange('AND')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              ruleGroup.logic === 'AND'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ALL (AND)
          </button>
          <button
            type="button"
            onClick={() => handleLogicChange('OR')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              ruleGroup.logic === 'OR'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ANY (OR)
          </button>
        </div>
      </div>

      {/* List of Preceding Node-Scoped Conditions */}
      {ruleGroup.conditions.length > 0 ? (
        <div className="space-y-4">
          {ruleGroup.conditions.map((cond, index) => {
            const selectedNodeObj = precedingNodes.find((n) => n.id === cond.nodeId) || precedingNodes[0];
            const availableFields = selectedNodeObj?.fields || [];

            return (
              <div
                key={cond.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 transition-all hover:border-slate-300 hover:shadow-sm"
              >
                {/* Row Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Rule Condition #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={cond.valueType}
                      onChange={(e) =>
                        handleConditionChange(cond.id, { valueType: e.target.value as ValueType })
                      }
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="string">📝 Text / String Field</option>
                      <option value="number">🔢 Number Slider</option>
                      <option value="select">📋 Dynamic Dropdown</option>
                      <option value="boolean">🔀 Toggle Switch</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(cond.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove Condition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Step 1 & Step 2: Preceding Node Selector & Feature Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Preceding Upstream Node Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      1. Select Preceding Node
                    </label>
                    <select
                      value={cond.nodeId || precedingNodes[0]?.id || 'input'}
                      onChange={(e) => {
                        const newNodeId = e.target.value;
                        const newNodeObj = precedingNodes.find((n) => n.id === newNodeId);
                        const defaultField = newNodeObj?.fields?.[0] || 'result';
                        handleConditionChange(cond.id, { nodeId: newNodeId, field: defaultField });
                      }}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-indigo-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {precedingNodes.length > 0 ? (
                        precedingNodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))
                      ) : (
                        <option value="input">📥 Initial Workflow Inputs</option>
                      )}
                    </select>
                  </div>

                  {/* 2. Feature / Field Selector Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                      <HardDriveDownload className="w-3.5 h-3.5 text-indigo-600" />
                      2. Select Output Field
                    </label>
                    {availableFields.length > 0 ? (
                      <select
                        value={cond.field}
                        onChange={(e) => handleConditionChange(cond.id, { field: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-indigo-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {availableFields.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                        {!availableFields.includes(cond.field) && (
                          <option value={cond.field}>{cond.field} (Custom)</option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={cond.field}
                        onChange={(e) => handleConditionChange(cond.id, { field: e.target.value })}
                        placeholder="Enter field path (e.g. status)"
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    )}
                  </div>

                  {/* 3. Operator Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      3. Operator
                    </label>
                    <select
                      value={cond.operator}
                      onChange={(e) =>
                        handleConditionChange(cond.id, { operator: e.target.value as Operator })
                      }
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="==">== Equals</option>
                      <option value="!=">!= Not Equals</option>
                      <option value=">">&gt; Greater Than</option>
                      <option value=">=">&gt;= Greater Than or Equal</option>
                      <option value="<">&lt; Less Than</option>
                      <option value="<=">&lt;= Less Than or Equal</option>
                      <option value="in">in (Matches Dropdown Set)</option>
                    </select>
                  </div>
                </div>

                {/* Step 3: Interactive Value Control */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    4. Interactive Control for <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">{selectedNodeObj?.id}.{cond.field}</code>
                  </label>

                  {cond.valueType === 'boolean' && (
                    <div className="flex items-center gap-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleConditionChange(cond.id, { value: !cond.value })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                          cond.value
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {cond.value ? (
                          <>
                            <ToggleRight className="w-5 h-5" /> Enabled (True)
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5" /> Disabled (False)
                          </>
                        )}
                      </button>
                      <span className="text-xs text-slate-500 italic">
                        Click switch to toggle target boolean output.
                      </span>
                    </div>
                  )}

                  {cond.valueType === 'number' && (
                    <div className="space-y-3 py-1">
                      <div className="flex items-center justify-between gap-4">
                        <input
                          type="range"
                          min={cond.min ?? 0}
                          max={cond.max ?? 1000}
                          step={cond.step ?? 1}
                          value={typeof cond.value === 'number' ? cond.value : parseFloat(cond.value) || 0}
                          onChange={(e) =>
                            handleConditionChange(cond.id, { value: parseFloat(e.target.value) })
                          }
                          className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          value={cond.value}
                          onChange={(e) =>
                            handleConditionChange(cond.id, { value: parseFloat(e.target.value) || 0 })
                          }
                          className="w-28 px-3 py-1.5 text-xs font-bold text-slate-900 font-mono border border-slate-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
                        <div className="flex items-center gap-1">
                          <span>Min:</span>
                          <input
                            type="number"
                            value={cond.min ?? 0}
                            onChange={(e) => handleConditionChange(cond.id, { min: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-1.5 py-0.5 text-[10px] border rounded text-slate-800"
                          />
                        </div>
                        <span>Target: {cond.value}</span>
                        <div className="flex items-center gap-1">
                          <span>Max:</span>
                          <input
                            type="number"
                            value={cond.max ?? 1000}
                            onChange={(e) => handleConditionChange(cond.id, { max: parseFloat(e.target.value) || 100 })}
                            className="w-16 px-1.5 py-0.5 text-[10px] border rounded text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {cond.valueType === 'select' && (
                    <div className="space-y-3 py-1">
                      {/* Option Tags */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {(cond.options || []).map((opt) => {
                          const isSelected = (Array.isArray(cond.value) ? cond.value : [cond.value]).includes(opt);
                          return (
                            <div key={opt} className="flex items-center">
                              <button
                                type="button"
                                onClick={() => toggleSelectOption(cond, opt)}
                                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                {opt}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectOption(cond, opt)}
                                className="ml-1 text-slate-400 hover:text-rose-500 text-xs"
                                title="Remove Option"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Dynamic Option Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newOptionInputs[cond.id] || ''}
                          onChange={(e) => setNewOptionInputs({ ...newOptionInputs, [cond.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSelectOption(cond);
                            }
                          }}
                          placeholder="Add new dynamic option (e.g. PASS, FAIL)..."
                          className="w-64 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        />
                        <Button
                          type="button"
                          onClick={() => handleAddSelectOption(cond)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 font-bold rounded-xl"
                        >
                          + Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  {cond.valueType === 'string' && (
                    <div className="py-1">
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => handleConditionChange(cond.id, { value: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-900"
                        placeholder="Enter target string value..."
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Rule Conditions Configured</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click the button below to add dynamic conditions based on preceding workflow node output fields.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleAddCondition}
        className="w-full py-3 text-xs font-bold border-dashed border-2 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-2xl gap-2 text-slate-700"
      >
        <Plus className="w-4 h-4 text-indigo-600" />
        Add Preceding Node Feature Condition
      </Button>

      <div className="p-4 bg-slate-50/80 rounded-2xl font-mono text-xs space-y-2 border border-slate-200">
        <div className="flex items-center justify-between text-slate-600 border-b border-slate-200 pb-2">
          <span className="flex items-center gap-1.5 text-indigo-700 font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Compiled Executable Python Script:
          </span>
          <span className="text-[10px] bg-slate-200 px-2.5 py-0.5 rounded-full text-slate-700 font-bold">
            Node-Scoped
          </span>
        </div>
        <pre className="text-indigo-950 overflow-x-auto max-h-36 p-3 bg-white rounded-xl border border-slate-200/80 font-mono shadow-xs">
          {compileRuleGroupToPython(ruleGroup)}
        </pre>
      </div>
    </div>
  );
};
