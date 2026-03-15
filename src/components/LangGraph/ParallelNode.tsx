import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { GitBranch } from 'lucide-react';

interface ParallelNodeProps {
  id: string;
  data: {
    label: string;
  };
  selected: boolean;
}

export const ParallelNode: React.FC<ParallelNodeProps> = ({ id, data, selected }) => {
  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-md transition-all ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}
      style={{ minWidth: '180px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400"
      />

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <GitBranch className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">{data.label}</div>
            <div className="text-xs text-gray-500">Parallel</div>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400"
      />
    </div>
  );
};
