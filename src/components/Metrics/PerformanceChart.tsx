import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { WorkflowPerformance } from '../../services/metricsService';

interface PerformanceChartProps {
  performance: WorkflowPerformance[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ performance }) => {
  const chartData = performance.slice(0, 10).map(perf => ({
    name: perf.workflow_name.length > 20
      ? perf.workflow_name.substring(0, 17) + '...'
      : perf.workflow_name,
    'Success Rate': parseFloat(perf.success_rate.toFixed(1)),
    Executions: perf.total_executions,
    'Avg Time (s)': parseFloat((perf.avg_duration / 1000).toFixed(2)),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No workflow performance data available
      </div>
    );
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return '#10b981';
    if (rate >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <XAxis
          dataKey="name"
          stroke="#6b7280"
          style={{ fontSize: '11px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          yAxisId="left"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        <Bar yAxisId="left" dataKey="Success Rate" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getSuccessRateColor(entry['Success Rate'])} />
          ))}
        </Bar>
        <Bar yAxisId="right" dataKey="Executions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
