import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react';
import { metricsService, ServiceMetrics } from '../../services/metricsService';

export const ServiceMetricsPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<ServiceMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await metricsService.getServiceMetrics();
      setMetrics(data.slice(0, 10));
    } catch (error) {
      console.error('Error loading service metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getSuccessRate = (metric: ServiceMetrics) => {
    if (metric.total_calls === 0) return 0;
    return ((metric.success_count / metric.total_calls) * 100).toFixed(1);
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 dark:text-green-400';
    if (rate >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No service metrics available</p>
        <p className="text-sm mt-2">Execute workflows with service nodes to see metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {metrics.map((metric, index) => {
        const successRate = parseFloat(getSuccessRate(metric));
        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {metric.service_name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {metric.node_id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Calls</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {metric.total_calls}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Success Rate</p>
                <p className={`text-lg font-bold ${getSuccessRateColor(successRate)}`}>
                  {successRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Time</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatDuration(metric.avg_duration_ms)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {metric.success_count} success
                </span>
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {metric.failure_count} failed
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                {metric.min_duration_ms !== null && (
                  <span>Min: {formatDuration(metric.min_duration_ms)}</span>
                )}
                {metric.max_duration_ms !== null && (
                  <span>Max: {formatDuration(metric.max_duration_ms)}</span>
                )}
              </div>
            </div>

            {metric.last_called_at && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last called: {new Date(metric.last_called_at).toLocaleString()}
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
