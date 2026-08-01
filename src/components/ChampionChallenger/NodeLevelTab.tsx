import React from 'react';
import { FUNNEL_STAGES } from './championChallengerMock';

export const NodeLevelTab: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-gray-900">Node-Level Micro-Metrics</h3>
      <p className="text-xs text-gray-500">
        Per-node response times, payload sizes, and failure counts for each individual LangGraph node.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
              <th className="py-3 px-2">Node Name</th>
              <th className="py-3 px-2">Type</th>
              <th className="py-3 px-2 text-right">Champion Avg Latency</th>
              <th className="py-3 px-2 text-right">Challenger Avg Latency</th>
              <th className="py-3 px-2 text-right">Champion Error Rate</th>
              <th className="py-3 px-2 text-right">Challenger Error Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
            {FUNNEL_STAGES.map((node) => (
              <tr key={node.id} className="hover:bg-gray-50">
                <td className="py-3 px-2 font-sans font-bold text-gray-900">{node.stage_name}</td>
                <td className="py-3 px-2 text-gray-500 font-sans">{node.node_type}</td>
                <td className="py-3 px-2 text-right text-blue-600 font-semibold">{(Math.random() * 50 + 40).toFixed(0)}ms</td>
                <td className="py-3 px-2 text-right text-emerald-600 font-semibold">{(Math.random() * 80 + 70).toFixed(0)}ms</td>
                <td className="py-3 px-2 text-right text-gray-700">{node.champion_drop_pct}%</td>
                <td className="py-3 px-2 text-right text-red-600 font-bold">{node.challenger_drop_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
