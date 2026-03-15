import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  ChevronRight,
  Calendar,
  Timer,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { metricsService, WorkflowExecution } from '../../services/metricsService';
import { formatDistanceToNow } from 'date-fns';

export const ExecutionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    try {
      const data = await metricsService.getRecentExecutions(50);
      setExecutions(data);
    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <PlayCircle className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
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
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.cancelled}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDuration = (exec: WorkflowExecution) => {
    if (!exec.completed_at) return 'In progress...';
    const duration = new Date(exec.completed_at).getTime() - new Date(exec.created_at).getTime();
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No executions found</p>
        <p className="text-sm mt-2">Execute a workflow to see history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      <AnimatePresence>
        {executions.map((exec, index) => (
          <motion.div
            key={exec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.03 }}
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              selectedExecution === exec.id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
            onClick={() => setSelectedExecution(selectedExecution === exec.id ? null : exec.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">{getStatusIcon(exec.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {exec.workflow_name}
                    </h3>
                    {getStatusBadge(exec.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDistanceToNow(new Date(exec.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Timer className="w-4 h-4" />
                      <span>{formatDuration(exec)}</span>
                    </div>
                  </div>

                  {exec.error && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">Error:</p>
                      <p className="text-xs text-red-600 dark:text-red-400 font-mono">{exec.error}</p>
                    </div>
                  )}

                  {selectedExecution === exec.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">Execution ID</p>
                          <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                            {exec.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">Workflow ID</p>
                          <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                            {exec.workflow_id}
                          </p>
                        </div>
                        {exec.current_node_id && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">Current Node</p>
                            <p className="font-mono text-xs text-gray-900 dark:text-white">
                              {exec.current_node_id}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                          <p className="text-xs text-gray-900 dark:text-white">
                            {new Date(exec.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/metrics/execution/${exec.id}`);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Full Execution Details</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  selectedExecution === exec.id ? 'rotate-90' : ''
                }`}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
