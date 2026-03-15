import { supabase } from '../lib/supabaseClient';

export const seedSampleData = async () => {
  try {
    const sampleWorkflows = [
      {
        name: 'Customer Onboarding Flow',
        description: 'Automated customer onboarding workflow',
        version: 1,
        data: { nodes: [], edges: [] },
        context: {},
        is_latest: true,
      },
      {
        name: 'Invoice Processing',
        description: 'Automated invoice processing and approval',
        version: 1,
        data: { nodes: [], edges: [] },
        context: {},
        is_latest: true,
      },
      {
        name: 'Lead Qualification',
        description: 'Qualify and score incoming leads',
        version: 2,
        data: { nodes: [], edges: [] },
        context: {},
        is_latest: true,
      },
    ];

    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .insert(sampleWorkflows)
      .select();

    if (workflowError) throw workflowError;

    const now = new Date();
    const sampleExecutions = [];

    for (let i = 0; i < 30; i++) {
      const workflow = workflows![i % workflows!.length];
      const createdAt = new Date(now.getTime() - (30 - i) * 3600000);
      const status = i % 5 === 0 ? 'failed' : i % 10 === 0 ? 'running' : 'completed';
      const completedAt = status === 'completed' ? new Date(createdAt.getTime() + Math.random() * 300000) : null;

      sampleExecutions.push({
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        status,
        input_data: { sample: 'input' },
        output_data: status === 'completed' ? { sample: 'output' } : {},
        error: status === 'failed' ? 'Sample error message' : null,
        created_at: createdAt.toISOString(),
        completed_at: completedAt?.toISOString(),
      });
    }

    const { data: executions, error: execError } = await supabase
      .from('workflow_executions')
      .insert(sampleExecutions)
      .select();

    if (execError) throw execError;

    const sampleMetrics = [
      {
        node_id: 'node-1',
        service_name: 'Email Service',
        total_calls: 150,
        success_count: 145,
        failure_count: 5,
        total_duration_ms: 75000,
        avg_duration_ms: 500,
        min_duration_ms: 200,
        max_duration_ms: 1200,
      },
      {
        node_id: 'node-2',
        service_name: 'Payment Gateway',
        total_calls: 89,
        success_count: 87,
        failure_count: 2,
        total_duration_ms: 178000,
        avg_duration_ms: 2000,
        min_duration_ms: 1500,
        max_duration_ms: 3500,
      },
      {
        node_id: 'node-3',
        service_name: 'Data Validator',
        total_calls: 320,
        success_count: 315,
        failure_count: 5,
        total_duration_ms: 32000,
        avg_duration_ms: 100,
        min_duration_ms: 50,
        max_duration_ms: 300,
      },
    ];

    const { error: metricsError } = await supabase
      .from('service_metrics')
      .insert(sampleMetrics);

    if (metricsError) throw metricsError;

    console.log('Sample data seeded successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return { success: false, error };
  }
};

export const clearSampleData = async () => {
  try {
    await supabase.from('node_executions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('workflow_executions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('service_metrics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('workflows').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Sample data cleared successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error clearing sample data:', error);
    return { success: false, error };
  }
};
