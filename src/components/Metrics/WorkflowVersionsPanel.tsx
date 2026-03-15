import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Clock, Package, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { metricsService, Workflow } from '../../services/metricsService';
import { formatDistanceToNow } from 'date-fns';

export const WorkflowVersionsPanel: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [versions, setVersions] = useState<{ [key: string]: Workflow[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await metricsService.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (workflowName: string) => {
    if (versions[workflowName]) {
      setSelectedWorkflow(selectedWorkflow === workflowName ? null : workflowName);
      return;
    }

    try {
      const data = await metricsService.getWorkflowVersions(workflowName);
      setVersions(prev => ({ ...prev, [workflowName]: data }));
      setSelectedWorkflow(workflowName);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No workflows found</p>
        <p className="text-sm mt-2">Create a workflow to see versions here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {workflows.map((workflow, index) => (
        <motion.div
          key={workflow.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            onClick={() => loadVersions(workflow.name)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {workflow.name}
                  </h3>
                  {workflow.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {workflow.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      <span>v{workflow.version}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
              {selectedWorkflow === workflow.name ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {selectedWorkflow === workflow.name && versions[workflow.name] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
            >
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Version History ({versions[workflow.name].length} versions)
                </p>
                {versions[workflow.name].map((version, vIndex) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg ${
                      version.is_latest
                        ? 'bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-700'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          v{version.version}
                        </span>
                        {version.is_latest && (
                          <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-medium rounded-full">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(version.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {version.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {version.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
};
