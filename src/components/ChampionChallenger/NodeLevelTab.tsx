import React from 'react';
import { MASTER_WORKFLOW_NODES, CandidateModel } from './championChallengerMock';

interface NodeLevelTabProps {
  candidates?: CandidateModel[];
}

export const NodeLevelTab: React.FC<NodeLevelTabProps> = ({ candidates = [] }) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Node-Level Granular Metrics</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Per-node response times, input/output trace volumes, and rule counts across active candidate models
          </p>
        </div>
        <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 font-bold">
          {candidates.length || 6} Candidates
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50 font-sans">
              <th className="py-3 px-3">Node Name</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3 text-center">Rule Count</th>
              <th className="py-3 px-3 text-right text-blue-600">Champion Latency</th>
              <th className="py-3 px-3 text-right text-emerald-600">Best Challenger Latency</th>
              <th className="py-3 px-3 text-right">Champion Drop %</th>
              <th className="py-3 px-3 text-right text-emerald-700">Best Challenger Drop %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {MASTER_WORKFLOW_NODES.map((node) => (
              <tr key={node.id} className="hover:bg-gray-50">
                <td className="py-3.5 px-3 font-sans font-bold text-gray-900">{node.name}</td>
                <td className="py-3.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {node.type}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center text-purple-700 font-bold">{node.ruleCount} Rules</td>
                <td className="py-3.5 px-3 text-right text-blue-700 font-bold">{node.avgLatencyMs}ms</td>
                <td className="py-3.5 px-3 text-right text-emerald-700 font-bold">{Math.max(10, node.avgLatencyMs - 3)}ms</td>
                <td className="py-3.5 px-3 text-right text-gray-700">{node.dropPct}%</td>
                <td className="py-3.5 px-3 text-right text-emerald-700 font-bold">{(node.dropPct * 0.85).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
