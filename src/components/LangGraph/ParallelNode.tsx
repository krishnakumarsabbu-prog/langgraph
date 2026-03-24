import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { GitBranch } from 'lucide-react';

interface ParallelNodeProps {
  id: string;
  data: {
    label: string;
    outputCount?: number;
  };
  selected: boolean;
}

export const ParallelNode: React.FC<ParallelNodeProps> = ({ id, data, selected }) => {
  const outputCount = Math.max(2, Math.min(8, data.outputCount ?? 2));

  const nodeHeight = Math.max(80, outputCount * 28 + 24);

  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-md transition-all ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}
      style={{ minWidth: '180px', minHeight: `${nodeHeight}px` }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400"
        style={{ top: '50%' }}
      />

      <div className="px-4 py-3 h-full flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-200">
            <GitBranch className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">{data.label}</div>
            <div className="text-xs text-gray-500">Parallel · {outputCount} outputs</div>
          </div>
        </div>
      </div>

      {Array.from({ length: outputCount }).map((_, i) => {
        const topPercent = ((i + 1) / (outputCount + 1)) * 100;
        return (
          <Handle
            key={`out-${i}`}
            type="source"
            position={Position.Right}
            id={`output-${i + 1}`}
            className="w-3 h-3 bg-amber-400 border-2 border-amber-600"
            style={{ top: `${topPercent}%` }}
          />
        );
      })}
    </div>
  );
};
