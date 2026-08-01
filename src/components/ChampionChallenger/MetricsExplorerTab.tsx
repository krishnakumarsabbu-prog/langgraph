import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { CandidateModel } from './championChallengerMock';

interface MetricsExplorerTabProps {
  candidates?: CandidateModel[];
}

export const TIME_SERIES_METRICS = [
  { date: '10:00', champion_completion_rate: 98.4, challenger_completion_rate: 99.1, champion_avg_rt: 42, challenger_avg_rt: 39 },
  { date: '11:00', champion_completion_rate: 97.8, challenger_completion_rate: 98.8, champion_avg_rt: 45, challenger_avg_rt: 40 },
  { date: '12:00', champion_completion_rate: 98.2, challenger_completion_rate: 99.3, champion_avg_rt: 41, challenger_avg_rt: 38 },
  { date: '13:00', champion_completion_rate: 98.5, challenger_completion_rate: 99.2, champion_avg_rt: 43, challenger_avg_rt: 39 },
  { date: '14:00', champion_completion_rate: 98.1, challenger_completion_rate: 99.0, champion_avg_rt: 44, challenger_avg_rt: 40 },
];

export const MetricsExplorerTab: React.FC<MetricsExplorerTabProps> = ({ candidates = [] }) => {
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'latency' | 'volume'>('completion');

  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6 select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Custom Telemetry & Metrics Explorer</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Multi-variate time-series comparison across {candidates.length || 6} active candidate models
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-600 font-medium font-sans">Metric Dimension:</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs font-mono"
          >
            <option value="completion">Completion Rate (%)</option>
            <option value="latency">Average Response Time (ms)</option>
            <option value="volume">Request Volume</option>
          </select>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={TIME_SERIES_METRICS}>
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
            <Line
              type="monotone"
              dataKey={selectedMetric === 'completion' ? 'champion_completion_rate' : 'champion_avg_rt'}
              name="Champion"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey={selectedMetric === 'completion' ? 'challenger_completion_rate' : 'challenger_avg_rt'}
              name="Best Challenger"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
