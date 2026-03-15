import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  Calendar,
  Timer,
  Activity,
  GitBranch,
  AlertCircle,
  FileJson,
  Zap,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../ui/card';
import { metricsService, WorkflowExecution, NodeExecution } from '../../services/metricsService';
import { formatDistanceToNow } from 'date-fns';

export const ExecutionDetailPage: React.FC = () => {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [nodeExecutions, setNodeExecutions] = useState<NodeExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (executionId) {
      loadExecutionDetails();
    }
  }, [executionId]);

  const loadExecutionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await metricsService.getExecutionDetails(executionId!);
      setExecution(data.execution);
      setNodeExecutions(data.nodeExecutions);
    } catch (err) {
      console.error('Error loading execution details:', err);
      setError('Failed to load execution details. The execution might not exist.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'running':
        return <PlayCircle className="w-6 h-6 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };

    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || styles.cancelled}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDuration = (started: string, completed?: string) => {
    if (!completed) return 'In progress...';
    const duration = new Date(completed).getTime() - new Date(started).getTime();
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(2)}s`;
    return `${(duration / 60000).toFixed(2)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading execution details...</p>
        </div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/metrics')}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Metrics Dashboard</span>
          </button>
          <div className="flex flex-col items-center justify-center h-96">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Execution Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              {error || 'The requested execution could not be found. It may have been deleted or the ID is incorrect.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalDuration = execution.completed_at
    ? new Date(execution.completed_at).getTime() - new Date(execution.created_at).getTime()
    : null;

  const completedNodes = nodeExecutions.filter(n => n.status === 'completed').length;
  const failedNodes = nodeExecutions.filter(n => n.status === 'failed').length;
  const runningNodes = nodeExecutions.filter(n => n.status === 'running').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => navigate('/metrics')}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Metrics Dashboard</span>
          </button>

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              {getStatusIcon(execution.status)}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {execution.workflow_name}
              </h1>
              {getStatusBadge(execution.status)}
            </div>
            <p className="text-gray-600 dark:text-gray-400 ml-10">
              Execution ID: <span className="font-mono text-sm">{execution.id}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Started</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {new Date(execution.created_at).toLocaleString()}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-2">
                <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalDuration ? formatDuration(execution.created_at, execution.completed_at) : 'In progress...'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {execution.completed_at ? `Completed ${formatDistanceToNow(new Date(execution.completed_at), { addSuffix: true })}` : 'Still running'}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Nodes</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {nodeExecutions.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {completedNodes} completed, {failedNodes} failed
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3 mb-2">
                <GitBranch className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Workflow ID</h3>
              </div>
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-white break-all">
                {execution.workflow_id.substring(0, 12)}...
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Version tracked
              </p>
            </Card>
          </div>

          {execution.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                      Execution Failed
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900/40 p-3 rounded-lg">
                      {execution.error}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Input Data</h2>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200">
                  {JSON.stringify(execution.input_data, null, 2)}
                </pre>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileJson className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Output Data</h2>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200">
                  {JSON.stringify(execution.output_data, null, 2)}
                </pre>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Node Execution Timeline
              </h2>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {nodeExecutions.length} nodes
              </span>
            </div>

            {nodeExecutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Activity className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-lg font-medium">No node executions recorded</p>
                <p className="text-sm mt-1">This execution may not have started processing nodes yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {nodeExecutions.map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-8 pb-6 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0"
                  >
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"></div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(node.status)}
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {node.node_id}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Type: <span className="font-medium">{node.node_type}</span>
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(node.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Started</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(node.started_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Duration</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {node.duration_ms ? `${node.duration_ms}ms` : formatDuration(node.started_at, node.completed_at)}
                          </p>
                        </div>
                      </div>

                      {node.error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">Error:</p>
                          <p className="text-xs text-red-600 dark:text-red-400 font-mono">{node.error}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Input</p>
                          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 max-h-24 overflow-auto">
                            {JSON.stringify(node.input_data, null, 2)}
                          </pre>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">Output</p>
                          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 max-h-24 overflow-auto">
                            {JSON.stringify(node.output_data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
