import React, { useState } from 'react';
import { CandidateModel, DYNAMIC_REQUESTS, DynamicRequestItem } from './championChallengerMock';
import { Search, Eye, CheckCircle2, XCircle, Trophy } from 'lucide-react';

interface RequestComparisonTabProps {
  candidates: CandidateModel[];
  onSelectRequest: (request: DynamicRequestItem) => void;
}

export const RequestComparisonTab: React.FC<RequestComparisonTabProps> = ({ candidates, onSelectRequest }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed' | 'Dropped'>('all');

  const filtered = DYNAMIC_REQUESTS.filter((req) => {
    const matchesSearch =
      req.request_id.toLowerCase().includes(search.toLowerCase()) ||
      req.session_id.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Dynamic {candidates.length}-Way Request Directory
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Filter and inspect individual execution traces across all {candidates.length} active models
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Request ID or Session..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                <th className="py-3 px-2">Request ID</th>
                <th className="py-3 px-2">Session ID</th>
                {candidates.map((cand) => (
                  <th key={cand.id} className="py-3 px-2" style={{ color: cand.color }}>
                    {cand.version} Status
                  </th>
                ))}
                {candidates.map((cand) => (
                  <th key={`rt-${cand.id}`} className="py-3 px-2 text-right" style={{ color: cand.color }}>
                    {cand.version} RT
                  </th>
                ))}
                <th className="py-3 px-2 text-center">Winner</th>
                <th className="py-3 px-2 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
              {filtered.map((req) => {
                const winnerCand = candidates.find((c) => c.id === req.winnerCandidateId) || candidates[0];

                return (
                  <tr
                    key={req.id}
                    onClick={() => onSelectRequest(req)}
                    className="hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <td className="py-3.5 px-2 font-bold text-blue-600">{req.request_id}</td>
                    <td className="py-3.5 px-2 text-gray-500 font-sans">{req.session_id}</td>
                    {candidates.map((cand) => {
                      const res = req.results[cand.id];
                      return (
                        <td key={cand.id} className="py-3.5 px-2">
                          {res?.status === 'Completed' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              <CheckCircle2 size={11} /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]">
                              <XCircle size={11} /> Dropped
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {candidates.map((cand) => {
                      const res = req.results[cand.id];
                      return (
                        <td key={`rt-${cand.id}`} className="py-3.5 px-2 text-right">
                          {res?.responseTime || 400}ms
                        </td>
                      );
                    })}
                    <td className="py-3.5 px-2 text-center">
                      <span
                        style={{ backgroundColor: `${winnerCand.color}15`, color: winnerCand.color, borderColor: `${winnerCand.color}40` }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-sans font-bold border"
                      >
                        <Trophy size={11} /> {winnerCand.version}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRequest(req);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-sans font-semibold text-xs border border-blue-200 flex items-center gap-1.5 ml-auto transition-all"
                      >
                        <Eye size={13} />
                        <span>Inspect Payload</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
