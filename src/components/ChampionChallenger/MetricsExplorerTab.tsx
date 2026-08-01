import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { TIME_SERIES_METRICS } from './championChallengerMock';

export const MetricsExplorerTab: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'latency' | 'volume'>('completion');

  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Custom Metrics Explorer</h3>
          <p className="text-xs text-gray-500">
            Interactive multi-variate telemetry comparison for Champion vs Challenger experiments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-600 font-medium">Metric Dimension:</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
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
              dataKey={
                selectedMetric === 'completion'
                  ? 'champion_completion_rate'
                  : selectedMetric === 'latency'
                  ? 'champion_avg_rt'
                  : 'champion_requests'
              }
              name="Champion"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey={
                selectedMetric === 'completion'
                  ? 'challenger_completion_rate'
                  : selectedMetric === 'latency'
                  ? 'challenger_avg_rt'
                  : 'challenger_requests'
              }
              name="Challenger"
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
