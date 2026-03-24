import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { GitMerge } from 'lucide-react';

interface MergeNodeProps {
  id: string;
  data: {
    label: string;
    inputCount?: number;
  };
  selected: boolean;
}

export const MergeNode: React.FC<MergeNodeProps> = ({ id, data, selected }) => {
  const inputCount = Math.max(2, Math.min(8, data.inputCount ?? 2));

  const nodeHeight = Math.max(80, inputCount * 28 + 24);

  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-md transition-all ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}
      style={{ minWidth: '180px', minHeight: `${nodeHeight}px` }}
    >
      {Array.from({ length: inputCount }).map((_, i) => {
        const topPercent = ((i + 1) / (inputCount + 1)) * 100;
        return (
          <Handle
            key={`in-${i}`}
            type="target"
            position={Position.Left}
            id={`input-${i + 1}`}
            className="w-3 h-3 bg-slate-400 border-2 border-slate-600"
            style={{ top: `${topPercent}%` }}
          />
        );
      })}

      <div className="px-4 py-3 h-full flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-200">
            <GitMerge className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">{data.label}</div>
            <div className="text-xs text-gray-500">Merge · {inputCount} inputs</div>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400"
        style={{ top: '50%' }}
      />
    </div>
  );
};
