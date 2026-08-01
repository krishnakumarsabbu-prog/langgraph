import React from 'react';
import { TOP_DROP_REASONS } from './championChallengerMock';
import { AlertOctagon, ShieldAlert, FileX } from 'lucide-react';

export const DropAnalysisTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertOctagon size={20} />
            <h4 className="font-bold text-sm text-gray-900">Total Dropped Executions</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900 font-mono">11</p>
          <p className="text-xs text-gray-500 mt-1">4 Champion vs 7 Challenger</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <ShieldAlert size={20} />
            <h4 className="font-bold text-sm text-gray-900">Top Drop Trigger</h4>
          </div>
          <p className="text-xl font-bold text-gray-900 font-mono">High Risk Score</p>
          <p className="text-xs text-amber-700 mt-1">54.55% of all drops (6 requests)</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <FileX size={20} />
            <h4 className="font-bold text-sm text-gray-900">Challenger Drop Rate</h4>
          </div>
          <p className="text-3xl font-bold text-red-600 font-mono">70.00%</p>
          <p className="text-xs text-gray-500 mt-1">30% higher drop rate than Champion</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">Comprehensive Drop Reason Taxonomy</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                <th className="py-3 px-2">Failure Reason</th>
                <th className="py-3 px-2 text-right text-blue-600">Champion Drops</th>
                <th className="py-3 px-2 text-right text-emerald-600">Challenger Drops</th>
                <th className="py-3 px-2 text-right">Combined Total</th>
                <th className="py-3 px-2 text-right">% Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
              {TOP_DROP_REASONS.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3.5 px-2 font-sans font-medium text-gray-900">{row.reason}</td>
                  <td className="py-3.5 px-2 text-right">{row.champion}</td>
                  <td className="py-3.5 px-2 text-right">{row.challenger}</td>
                  <td className="py-3.5 px-2 text-right font-bold text-gray-900">{row.total}</td>
                  <td className="py-3.5 px-2 text-right text-amber-700 font-semibold">{row.total_pct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
