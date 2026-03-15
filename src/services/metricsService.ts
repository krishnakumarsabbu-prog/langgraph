import { supabase } from '../lib/supabaseClient';

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
    const { data: executions, error: execError } = await supabase
      .from('workflow_executions')
      .select('status, created_at, completed_at');

    if (execError) throw execError;

    const { data: workflows, error: wfError } = await supabase
      .from('workflows')
      .select('id')
      .eq('is_latest', true);

    if (wfError) throw wfError;

    const totalExecutions = executions?.length || 0;
    const successfulExecutions = executions?.filter(e => e.status === 'completed').length || 0;
    const failedExecutions = executions?.filter(e => e.status === 'failed').length || 0;
    const runningExecutions = executions?.filter(e => e.status === 'running').length || 0;

    const completedWithTime = executions?.filter(e => e.completed_at && e.created_at) || [];
    const totalTime = completedWithTime.reduce((sum, e) => {
      const duration = new Date(e.completed_at!).getTime() - new Date(e.created_at).getTime();
      return sum + duration;
    }, 0);
    const avgExecutionTime = completedWithTime.length > 0 ? totalTime / completedWithTime.length : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      runningExecutions,
      avgExecutionTime,
      totalWorkflows: workflows?.length || 0,
    };
  },

  async getExecutionTrends(days: number = 7): Promise<ExecutionTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('status, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const trendMap = new Map<string, { total: number; success: number; failed: number }>();

    data?.forEach(exec => {
      const date = new Date(exec.created_at).toISOString().split('T')[0];
      if (!trendMap.has(date)) {
        trendMap.set(date, { total: 0, success: 0, failed: 0 });
      }
      const trend = trendMap.get(date)!;
      trend.total++;
      if (exec.status === 'completed') trend.success++;
      if (exec.status === 'failed') trend.failed++;
    });

    return Array.from(trendMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  },

  async getWorkflowPerformance(): Promise<WorkflowPerformance[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('workflow_name, status, created_at, completed_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const performanceMap = new Map<string, {
      total: number;
      success: number;
      durations: number[];
      lastExecuted: string;
    }>();

    data?.forEach(exec => {
      if (!performanceMap.has(exec.workflow_name)) {
        performanceMap.set(exec.workflow_name, {
          total: 0,
          success: 0,
          durations: [],
          lastExecuted: exec.created_at,
        });
      }
      const perf = performanceMap.get(exec.workflow_name)!;
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
      avg_duration: stats.durations.length > 0
        ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        : 0,
      last_executed: stats.lastExecuted,
    }));
  },

  async getRecentExecutions(limit: number = 50): Promise<WorkflowExecution[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getExecutionDetails(executionId: string): Promise<{
    execution: WorkflowExecution;
    nodeExecutions: NodeExecution[];
  }> {
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .maybeSingle();

    if (execError) throw execError;
    if (!execution) throw new Error('Execution not found');

    const { data: nodeExecutions, error: nodeError } = await supabase
      .from('node_executions')
      .select('*')
      .eq('workflow_execution_id', executionId)
      .order('started_at', { ascending: true });

    if (nodeError) throw nodeError;

    return {
      execution,
      nodeExecutions: nodeExecutions || [],
    };
  },

  async getServiceMetrics(): Promise<ServiceMetrics[]> {
    const { data, error } = await supabase
      .from('service_metrics')
      .select('*')
      .order('total_calls', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getWorkflows(): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('is_latest', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getWorkflowVersions(workflowName: string): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('name', workflowName)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getNodeExecutionsByNodeId(nodeId: string, limit: number = 100): Promise<NodeExecution[]> {
    const { data, error } = await supabase
      .from('node_executions')
      .select('*')
      .eq('node_id', nodeId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
