import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  BarChart3,
  LineChart,
  Package,
  AlertTriangle,
  Play,
  RefreshCw,
  Database,
} from 'lucide-react';
import { Card } from '../ui/card';
import { metricsService, MetricsSummary, WorkflowPerformance, ExecutionTrend } from '../../services/metricsService';
import { ExecutionHistory } from './ExecutionHistory';
import { PerformanceChart } from './PerformanceChart';
import { ServiceMetricsPanel } from './ServiceMetricsPanel';
import { WorkflowVersionsPanel } from './WorkflowVersionsPanel';
import { ExecutionTrendsChart } from './ExecutionTrendsChart';
import { seedSampleData } from '../../utils/sampleDataSeeder';
import toast from 'react-hot-toast';

export const MetricsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [performance, setPerformance] = useState<WorkflowPerformance[]>([]);
  const [trends, setTrends] = useState<ExecutionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadMetrics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const [summaryData, performanceData, trendsData] = await Promise.all([
        metricsService.getMetricsSummary(),
        metricsService.getWorkflowPerformance(),
        metricsService.getExecutionTrends(7),
      ]);

      setSummary(summaryData);
      setPerformance(performanceData);
      setTrends(trendsData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(() => loadMetrics(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const successRate = summary
    ? summary.totalExecutions > 0
      ? ((summary.successfulExecutions / summary.totalExecutions) * 100).toFixed(1)
      : '0'
    : '0';

  const handleSeedData = async () => {
    try {
      toast.loading('Seeding sample data...');
      const result = await seedSampleData();
      if (result.success) {
        toast.dismiss();
        toast.success('Sample data seeded successfully!');
        loadMetrics();
      } else {
        toast.dismiss();
        toast.error('Failed to seed sample data');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Error seeding sample data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900">
      <div className="p-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Metrics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Real-time workflow execution analytics and performance insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSeedData}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
              >
                <Database className="w-4 h-4" />
                <span>Seed Sample Data</span>
              </button>
              <button
                onClick={() => loadMetrics(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Executions</p>
                  <p className="text-4xl font-bold">{summary?.totalExecutions || 0}</p>
                  <p className="text-blue-100 text-xs mt-2">All time</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Success Rate</p>
                  <p className="text-4xl font-bold">{successRate}%</p>
                  <p className="text-green-100 text-xs mt-2">
                    {summary?.successfulExecutions || 0} successful
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Failed Executions</p>
                  <p className="text-4xl font-bold">{summary?.failedExecutions || 0}</p>
                  <p className="text-orange-100 text-xs mt-2">
                    {summary?.runningExecutions || 0} running
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Avg Execution Time</p>
                  <p className="text-4xl font-bold">{formatDuration(summary?.avgExecutionTime || 0)}</p>
                  <p className="text-purple-100 text-xs mt-2">
                    {summary?.totalWorkflows || 0} workflows
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 shadow-lg border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-6">
                <LineChart className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Execution Trends</h2>
              </div>
              <ExecutionTrendsChart trends={trends} />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 shadow-lg border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Workflow Performance
                </h2>
              </div>
              <PerformanceChart performance={performance} />
            </Card>
          </motion.div>
        </div>

        {/* Service Metrics and Versions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-6 shadow-lg border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Service Metrics</h2>
              </div>
              <ServiceMetricsPanel />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="p-6 shadow-lg border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Workflow Versions
                </h2>
              </div>
              <WorkflowVersionsPanel />
            </Card>
          </motion.div>
        </div>

        {/* Execution History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6 shadow-lg border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Execution History</h2>
            </div>
            <ExecutionHistory />
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
