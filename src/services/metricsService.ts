import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  current_node_id?: string;
  parent_execution_id?: string;
  input_data: any;
  output_data: any;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface NodeExecution {
  id: string;
  workflow_execution_id: string;
  node_id: string;
  node_type: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input_data: any;
  output_data: any;
  error?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface ServiceMetrics {
  id: string;
  node_id: string;
  service_name: string;
  total_calls: number;
  success_count: number;
  failure_count: number;
  total_duration_ms: number;
  avg_duration_ms: number;
  min_duration_ms?: number;
  max_duration_ms?: number;
  last_called_at?: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: number;
  data: any;
  context: any;
  created_at: string;
  updated_at: string;
  is_latest: boolean;
}

export interface MetricsSummary {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  runningExecutions: number;
  avgExecutionTime: number;
  totalWorkflows: number;
}

export interface ExecutionTrend {
  date: string;
  total: number;
  success: number;
  failed: number;
}

export interface WorkflowPerformance {
  workflow_name: string;
  total_executions: number;
  success_rate: number;
  avg_duration: number;
  last_executed: string;
}

export const metricsService = {
  async getMetricsSummary(): Promise<MetricsSummary> {
    try {
      const { data: executions } = await api.get('/executions', { params: { limit: 1000 } });
      const { data: workflows } = await api.get('/api/flows');

      const executionList = Array.isArray(executions) ? executions : [];
      const workflowList = Array.isArray(workflows) ? workflows : [];

      const totalExecutions = executionList.length;
      const successfulExecutions = executionList.filter((e: any) => e.status === 'completed').length;
      const failedExecutions = executionList.filter((e: any) => e.status === 'failed').length;
      const runningExecutions = executionList.filter((e: any) => e.status === 'running').length;

      const completedWithTime = executionList.filter(
        (e: any) => e.completed_at && e.created_at
      );
      const totalTime = completedWithTime.reduce((sum: number, e: any) => {
        const duration = new Date(e.completed_at).getTime() - new Date(e.created_at).getTime();
        return sum + duration;
      }, 0);
      const avgExecutionTime = completedWithTime.length > 0 ? totalTime / completedWithTime.length : 0;

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        runningExecutions,
        avgExecutionTime,
        totalWorkflows: workflowList.length,
      };
    } catch (error) {
      console.error('Error fetching metrics summary:', error);
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        runningExecutions: 0,
        avgExecutionTime: 0,
        totalWorkflows: 0,
      };
    }
  },

  async getExecutionTrends(days: number = 7): Promise<ExecutionTrend[]> {
    try {
      const { data: executions } = await api.get('/executions', { params: { limit: 1000 } });
      const executionList = Array.isArray(executions) ? executions : [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const filtered = executionList.filter(
        (e: any) => new Date(e.created_at) >= startDate
      );

      const trendMap = new Map<string, { total: number; success: number; failed: number }>();

      filtered.forEach((exec: any) => {
        const date = new Date(exec.created_at).toISOString().split('T')[0];
        if (!trendMap.has(date)) {
          trendMap.set(date, { total: 0, success: 0, failed: 0 });
        }
        const trend = trendMap.get(date)!;
        trend.total++;
        if (exec.status === 'completed') trend.success++;
        if (exec.status === 'failed') trend.failed++;
      });

      return Array.from(trendMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching execution trends:', error);
      return [];
    }
  },

  async getWorkflowPerformance(): Promise<WorkflowPerformance[]> {
    try {
      const { data: executions } = await api.get('/executions', { params: { limit: 1000 } });
      const executionList = Array.isArray(executions) ? executions : [];

      const performanceMap = new Map<
        string,
        {
          total: number;
          success: number;
          durations: number[];
          lastExecuted: string;
        }
      >();

      executionList.forEach((exec: any) => {
        const workflowName = exec.workflow_name || 'Unknown';
        if (!performanceMap.has(workflowName)) {
          performanceMap.set(workflowName, {
            total: 0,
            success: 0,
            durations: [],
            lastExecuted: exec.created_at,
          });
        }
        const perf = performanceMap.get(workflowName)!;
        perf.total++;
        if (exec.status === 'completed') perf.success++;
        if (exec.completed_at && exec.created_at) {
          const duration = new Date(exec.completed_at).getTime() - new Date(exec.created_at).getTime();
          perf.durations.push(duration);
        }
        if (new Date(exec.created_at) > new Date(perf.lastExecuted)) {
          perf.lastExecuted = exec.created_at;
        }
      });

      return Array.from(performanceMap.entries()).map(([workflow_name, stats]) => ({
        workflow_name,
        total_executions: stats.total,
        success_rate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
        avg_duration:
          stats.durations.length > 0
            ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
            : 0,
        last_executed: stats.lastExecuted,
      }));
    } catch (error) {
      console.error('Error fetching workflow performance:', error);
      return [];
    }
  },

  async getRecentExecutions(limit: number = 50): Promise<WorkflowExecution[]> {
    try {
      const { data } = await api.get('/executions', { params: { limit } });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching recent executions:', error);
      return [];
    }
  },

  async getExecutionDetails(executionId: string): Promise<{
    execution: WorkflowExecution;
    nodeExecutions: NodeExecution[];
  }> {
    try {
      const { data: execution } = await api.get(`/executions/${executionId}`);
      const { data: nodeExecutions } = await api.get(`/executions/${executionId}/nodes`);

      return {
        execution,
        nodeExecutions: Array.isArray(nodeExecutions) ? nodeExecutions : [],
      };
    } catch (error) {
      console.error('Error fetching execution details:', error);
      throw error;
    }
  },

  async getServiceMetrics(): Promise<ServiceMetrics[]> {
    try {
      const { data } = await api.get('/metrics/service/all');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching service metrics:', error);
      return [];
    }
  },

  async getWorkflows(): Promise<Workflow[]> {
    try {
      const { data } = await api.get('/api/flows');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }
  },

  async getWorkflowVersions(workflowName: string): Promise<Workflow[]> {
    try {
      const { data } = await api.get(`/api/flows/${workflowName}/versions`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching workflow versions:', error);
      return [];
    }
  },

  async getNodeExecutionsByNodeId(nodeId: string, limit: number = 100): Promise<NodeExecution[]> {
    try {
      const { data } = await api.get(`/metrics/service/${nodeId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching node executions:', error);
      return [];
    }
  },
};
