import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  Activity,
  Trophy,
  Eye,
  Award,
} from 'lucide-react';
import {
  FUNNEL_STAGES,
  FUNNEL_METRIC_SUMMARY,
  TOP_DROP_REASONS,
  TIME_SERIES_METRICS,
  MOCK_REQUEST_COMPARISON,
  RequestComparisonItem,
} from './championChallengerMock';

interface FunnelOverviewTabProps {
  onSelectRequest: (request: RequestComparisonItem) => void;
}

export const FunnelOverviewTab: React.FC<FunnelOverviewTabProps> = ({ onSelectRequest }) => {
  const dropDistributionData = [
    { name: 'Champion Drops', value: 4, color: '#2563eb' },
    { name: 'Challenger Drops', value: 7, color: '#16a34a' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Requests */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Total Requests</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">10</span>
            <span className="text-xs font-semibold text-gray-400">vs</span>
            <span className="text-2xl font-bold text-gray-900">10</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-gray-100">
            <span className="text-blue-600 font-medium">Champion</span>
            <span className="text-emerald-600 font-medium">Challenger</span>
          </div>
        </div>

        {/* Overall Completion Rate */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Overall Completion Rate</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">60.00%</span>
            <span className="text-xs font-semibold text-gray-400">vs</span>
            <span className="text-2xl font-bold text-gray-900">30.00%</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-gray-100">
            <span className="text-blue-600 font-medium">6 Completed</span>
            <span className="text-emerald-600 font-medium">3 Completed</span>
          </div>
        </div>

        {/* Total Dropped */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-gray-500 font-medium mb-1">Total Dropped</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">4</span>
                <span className="text-xs font-semibold text-gray-400">vs</span>
                <span className="text-2xl font-bold text-gray-900">7</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-2 font-mono">
                40.00% <span className="text-gray-400">vs</span> 70.00%
              </div>
            </div>
            <div className="w-12 h-10 flex items-end gap-1 opacity-70">
              <div className="w-2 h-4 bg-purple-400/80 rounded-t"></div>
              <div className="w-2 h-7 bg-purple-500 rounded-t"></div>
              <div className="w-2 h-3 bg-purple-300 rounded-t"></div>
              <div className="w-2 h-9 bg-purple-600 rounded-t"></div>
            </div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-gray-500 font-medium mb-1">Avg Response Time</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">512ms</span>
                <span className="text-xs font-semibold text-gray-400">vs</span>
                <span className="text-2xl font-bold text-gray-900">678ms</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
                <TrendingDown size={12} />
                <span>-24.48% Faster</span>
              </div>
            </div>
            <div className="w-10 h-10 flex items-center justify-center text-purple-600 opacity-80">
              <Activity size={24} />
            </div>
          </div>
        </div>

        {/* Total Executions */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Total Executions</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">20</span>
            <span className="text-xs font-semibold text-gray-400">vs</span>
            <span className="text-2xl font-bold text-gray-900">20</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100 font-mono">
            10 + 10 Executions
          </div>
        </div>

        {/* Data Transferred */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium mb-1">Data Transferred</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">2.45 MB</span>
            <span className="text-xs font-semibold text-gray-400">vs</span>
            <span className="text-2xl font-bold text-gray-900">2.31 MB</span>
          </div>
          <div className="text-[11px] font-semibold text-red-600 mt-2 flex items-center gap-1">
            <TrendingUp size={12} />
            <span>+6.06%</span>
          </div>
        </div>
      </div>

      {/* Main Section: Request Flow Funnel (Left) + Summary/Drop Analysis (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request Flow Funnel (7 Columns Wide) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Request Flow Funnel</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Visual node-by-node conversion and drop analysis
                </p>
              </div>

              {/* Legends */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-blue-600">
                  <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  <span>Champion</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
                  <span>Challenger</span>
                </div>
              </div>
            </div>

            {/* Funnel Layout */}
            <div className="space-y-4 py-2">
              {FUNNEL_STAGES.map((stage) => {
                const champWidth = Math.max(30, (stage.champion_out / 10) * 100);
                const challWidth = Math.max(30, (stage.challenger_out / 10) * 100);

                return (
                  <div key={stage.id} className="grid grid-cols-11 items-center gap-2">
                    {/* Champion Funnel Side (Left) */}
                    <div className="col-span-4 flex flex-col items-end pr-2">
                      <div className="flex items-center justify-end gap-2 w-full mb-1 text-[11px] font-mono text-gray-500">
                        {stage.champion_drop > 0 && (
                          <span className="text-red-700 text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Drop {stage.champion_drop} ({stage.champion_drop_pct}%) {stage.champion_step_drop_change}
                          </span>
                        )}
                        <span className="text-blue-700 font-bold">
                          {stage.champion_out} ({stage.champion_out * 10}%)
                        </span>
                      </div>
                      <div className="w-full flex justify-end">
                        <div
                          style={{ width: `${champWidth}%` }}
                          className="h-11 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm flex items-center justify-center transition-all hover:bg-blue-700"
                        >
                          {stage.champion_out} ({stage.champion_out * 10}%)
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Stage Center Node Label */}
                    <div className="col-span-3 text-center py-2 px-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center shadow-xs">
                      <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">
                        {stage.node_type}
                      </span>
                      <span className="text-xs font-bold text-gray-900 truncate max-w-full">
                        {stage.stage_name}
                      </span>
                    </div>

                    {/* Challenger Funnel Side (Right) */}
                    <div className="col-span-4 flex flex-col items-start pl-2">
                      <div className="flex items-center justify-start gap-2 w-full mb-1 text-[11px] font-mono text-gray-500">
                        <span className="text-emerald-700 font-bold">
                          {stage.challenger_out} ({stage.challenger_out * 10}%)
                        </span>
                        {stage.challenger_drop > 0 && (
                          <span className="text-red-700 text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Drop {stage.challenger_drop} ({stage.challenger_drop_pct}%) {stage.challenger_step_drop_change}
                          </span>
                        )}
                      </div>
                      <div className="w-full flex justify-start">
                        <div
                          style={{ width: `${challWidth}%` }}
                          className="h-11 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm flex items-center justify-center transition-all hover:bg-emerald-700"
                        >
                          {stage.challenger_out} ({stage.challenger_out * 10}%)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Funnel Bottom Completion Comparison Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-700">Champion Completed:</span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold font-mono border border-blue-200">
                6 (60.00%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-700">Challenger Completed:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold font-mono border border-emerald-200">
                3 (30.00%)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Funnel Summary & Drop Analysis (5 Columns Wide) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Funnel Summary Card */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Funnel Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                    <th className="py-2 px-2">Metric</th>
                    <th className="py-2 px-2 text-right text-blue-600">Champion</th>
                    <th className="py-2 px-2 text-right text-emerald-600">Challenger</th>
                    <th className="py-2 px-2 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
                  {FUNNEL_METRIC_SUMMARY.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-2 font-sans text-gray-700 font-medium">{row.metric}</td>
                      <td className="py-2 px-2 text-right">{row.champion}</td>
                      <td className="py-2 px-2 text-right">{row.challenger}</td>
                      <td
                        className={`py-2 px-2 text-right font-semibold ${
                          row.difference.startsWith('+') || row.difference.startsWith('-')
                            ? 'text-emerald-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {row.difference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drop Distribution Card */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Drop Distribution</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dropDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dropDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-gray-500">Total Drops</span>
                  <span className="text-xl font-bold text-gray-900">11</span>
                </div>
              </div>

              <div className="space-y-3 flex-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="text-gray-700 font-medium">Champion Drops</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">4 (40.00%)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                    <span className="text-gray-700 font-medium">Challenger Drops</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">7 (70.00%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Drop Reasons Table */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Top Drop Reasons</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                    <th className="py-2 px-2">Reason</th>
                    <th className="py-2 px-2 text-right">Champion</th>
                    <th className="py-2 px-2 text-right">Challenger</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
                  {TOP_DROP_REASONS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-2 font-sans text-gray-700 font-medium">{row.reason}</td>
                      <td className="py-2 px-2 text-right text-blue-600">
                        {row.champion} ({row.champion_pct}%)
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-600">
                        {row.challenger} ({row.challenger_pct}%)
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-gray-900">
                        {row.total} ({row.total_pct.toFixed(2)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: 3 Time Series Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Rate Over Time */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Completion Rate Over Time</span>
            <span className="text-xs font-normal text-gray-500">%</span>
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TIME_SERIES_METRICS}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                />
                <Line type="monotone" dataKey="champion_completion_rate" name="Champion" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="challenger_completion_rate" name="Challenger" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Requests Processed Over Time */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Requests Processed Over Time</span>
            <span className="text-xs font-normal text-gray-500">Volume</span>
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TIME_SERIES_METRICS}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                />
                <Line type="monotone" dataKey="champion_requests" name="Champion" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="challenger_requests" name="Challenger" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Response Time (ms) */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Avg Response Time (ms)</span>
            <span className="text-xs font-normal text-gray-500">ms</span>
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TIME_SERIES_METRICS}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                />
                <Line type="monotone" dataKey="champion_avg_rt" name="Champion" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="challenger_avg_rt" name="Challenger" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Request Level Comparison Table & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request Level Comparison (All 10 Requests Table) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Request Level Comparison</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Detailed request execution comparison for all 10 sample requests
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-gray-100 text-gray-700 border border-gray-200">
              Showing 10 of 10 Requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-3 px-2">Request ID</th>
                  <th className="py-3 px-2">Request Time</th>
                  <th className="py-3 px-2">Champion Status</th>
                  <th className="py-3 px-2">Challenger Status</th>
                  <th className="py-3 px-2">Champion Path</th>
                  <th className="py-3 px-2">Challenger Path</th>
                  <th className="py-3 px-2 text-right">Champion RT</th>
                  <th className="py-3 px-2 text-right">Challenger RT</th>
                  <th className="py-3 px-2 text-center">Winner</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
                {MOCK_REQUEST_COMPARISON.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => onSelectRequest(req)}
                    className="hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <td className="py-3 px-2 font-bold text-blue-600">{req.request_id}</td>
                    <td className="py-3 px-2 text-gray-500 font-sans">{req.timestamp}</td>
                    <td className="py-3 px-2">
                      {req.champion_status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <XCircle size={12} /> Dropped ({req.champion_drop_reason || 'Failed'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {req.challenger_status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <XCircle size={12} /> Dropped ({req.challenger_drop_reason || 'Failed'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-gray-600 max-w-[120px] truncate" title={req.champion_path}>
                      {req.champion_path}
                    </td>
                    <td className="py-3 px-2 text-gray-600 max-w-[120px] truncate" title={req.challenger_path}>
                      {req.challenger_path}
                    </td>
                    <td className="py-3 px-2 text-right">{req.champion_response_time}ms</td>
                    <td className="py-3 px-2 text-right">{req.challenger_response_time}ms</td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-semibold ${
                          req.winner === 'Champion'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <Trophy size={11} /> {req.winner}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRequest(req);
                        }}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all border border-gray-200"
                        title="View Payload Details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights Card */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="text-amber-500 w-5 h-5" />
              <span>Insights</span>
            </h3>

            <ul className="space-y-3.5 text-xs font-medium text-gray-700">
              <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <CheckCircle2 className="text-emerald-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900">Champion has 30.00% higher completion rate</strong> compared to Challenger across all 10 request executions.
                </span>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <CheckCircle2 className="text-emerald-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900">Champion is 24.48% faster on average</strong> (512ms vs 678ms average execution latency).
                </span>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <CheckCircle2 className="text-emerald-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900">High Risk Score</strong> is the top drop reason accounting for 54.55% of all dropped executions.
                </span>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <CheckCircle2 className="text-emerald-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Consider optimizing <strong className="text-gray-900">Decision Node 2 (Fraud Check)</strong> in Challenger to reduce execution drops.
                </span>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <CheckCircle2 className="text-emerald-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Champion shows significantly <strong className="text-gray-900">more consistent performance</strong> with lower latency variance.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
