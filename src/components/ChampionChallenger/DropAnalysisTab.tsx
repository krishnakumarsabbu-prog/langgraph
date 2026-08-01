import React from 'react';
import { CandidateModel } from './championChallengerMock';
import { AlertOctagon, ShieldAlert, FileX } from 'lucide-react';

interface DropAnalysisTabProps {
  candidates?: CandidateModel[];
}

export const TOP_DROP_REASONS = [
  { reason: 'High Risk Score (> 0.75)', champion: 4120, challenger: 3010, total: 7130, total_pct: 48.34 },
  { reason: 'Transaction Velocity > 5 in 10m', champion: 2880, challenger: 3400, total: 6280, total_pct: 42.58 },
  { reason: 'IP Geo Mismatch vs Billing', champion: 2010, challenger: 1980, total: 3990, total_pct: 27.05 },
  { reason: 'Synthetic Identity Cluster match', champion: 1850, challenger: 1420, total: 3270, total_pct: 22.17 },
  { reason: 'Blacklisted Merchant Network', champion: 1450, challenger: 1100, total: 2550, total_pct: 17.29 },
];

export const DropAnalysisTab: React.FC<DropAnalysisTabProps> = ({ candidates = [] }) => {
  return (
    <div className="space-y-6 select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertOctagon size={20} />
            <h4 className="font-bold text-sm text-gray-900">Total Dropped Executions</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900 font-mono">14,750</p>
          <p className="text-xs text-gray-500 mt-1">Comparing {candidates.length || 6} Active Candidate Models</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <ShieldAlert size={20} />
            <h4 className="font-bold text-sm text-gray-900">Top Drop Trigger</h4>
          </div>
          <p className="text-xl font-bold text-gray-900 font-mono">High Device Risk Score</p>
          <p className="text-xs text-amber-700 mt-1">48.34% of overall stage fallout</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <FileX size={20} />
            <h4 className="font-bold text-sm text-gray-900">Best Candidate Yield</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-600 font-mono">12.91%</p>
          <p className="text-xs text-gray-500 mt-1">Challenger A yields -2.76% lower drop rate than Champion</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Comprehensive Drop Reason Taxonomy</h3>
          <p className="text-xs text-gray-500">Root cause business rules triggering decision fallout</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50 font-sans">
                <th className="py-3 px-3">Failure Reason</th>
                <th className="py-3 px-3 text-right text-blue-600">Champion Drops</th>
                <th className="py-3 px-3 text-right text-emerald-600">Best Challenger Drops</th>
                <th className="py-3 px-3 text-right">Combined Total</th>
                <th className="py-3 px-3 text-right">% Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {TOP_DROP_REASONS.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3.5 px-3 font-sans font-medium text-gray-900">{row.reason}</td>
                  <td className="py-3.5 px-3 text-right text-blue-700 font-bold">{row.champion.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-right text-emerald-700 font-bold">{row.challenger.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-right font-bold text-gray-900">{row.total.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-right text-amber-700 font-semibold">{row.total_pct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
