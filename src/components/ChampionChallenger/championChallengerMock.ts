export interface StepNodeExecution {
  step_id: string;
  node_id: string;
  node_name: string;
  node_type: 'service' | 'decision' | 'llm' | 'transform';
  status: 'completed' | 'dropped' | 'failed';
  duration_ms: number;
  input_payload: Record<string, any>;
  output_payload?: Record<string, any>;
  drop_reason?: string;
}

export interface RequestComparisonItem {
  id: string;
  request_id: string;
  session_id: string;
  timestamp: string;
  champion_status: 'Completed' | 'Dropped' | 'Failed';
  challenger_status: 'Completed' | 'Dropped' | 'Failed';
  champion_drop_reason?: string;
  challenger_drop_reason?: string;
  champion_path: string;
  challenger_path: string;
  champion_response_time: number; // in ms
  challenger_response_time: number; // in ms
  winner: 'Champion' | 'Challenger' | 'Tie';
  input_payload: Record<string, any>;
  champion_executions: StepNodeExecution[];
  challenger_executions: StepNodeExecution[];
}

export interface FunnelStage {
  id: string;
  stage_name: string;
  node_type: string;
  champion_in: number;
  champion_out: number;
  champion_drop: number;
  champion_drop_pct: number;
  champion_step_drop_change: string;
  challenger_in: number;
  challenger_out: number;
  challenger_drop: number;
  challenger_drop_pct: number;
  challenger_step_drop_change: string;
}

export interface MetricSummaryItem {
  metric: string;
  champion: string;
  challenger: string;
  difference: string;
  isPositive: boolean;
}

export interface DropReasonItem {
  reason: string;
  champion: number;
  champion_pct: number;
  challenger: number;
  challenger_pct: number;
  total: number;
  total_pct: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  champion_completion_rate: number;
  challenger_completion_rate: number;
  champion_requests: number;
  challenger_requests: number;
  champion_avg_rt: number;
  challenger_avg_rt: number;
}

export const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: 'stage-1',
    stage_name: 'Request Validation',
    node_type: 'Service Node 1',
    champion_in: 10,
    champion_out: 9,
    champion_drop: 1,
    champion_drop_pct: 10.0,
    champion_step_drop_change: '-10.00%',
    challenger_in: 10,
    challenger_out: 8,
    challenger_drop: 2,
    challenger_drop_pct: 20.0,
    challenger_step_drop_change: '-20.00%',
  },
  {
    id: 'stage-2',
    stage_name: 'Risk Evaluation',
    node_type: 'Decision Node 1',
    champion_in: 9,
    champion_out: 8,
    champion_drop: 1,
    champion_drop_pct: 10.0,
    champion_step_drop_change: '-10.00%',
    challenger_in: 8,
    challenger_out: 6,
    challenger_drop: 2,
    challenger_drop_pct: 25.0,
    challenger_step_drop_change: '-20.00%',
  },
  {
    id: 'stage-3',
    stage_name: 'Data Enrichment',
    node_type: 'Service Node 2',
    champion_in: 8,
    champion_out: 6,
    champion_drop: 2,
    champion_drop_pct: 25.0,
    champion_step_drop_change: '-20.00%',
    challenger_in: 6,
    challenger_out: 4,
    challenger_drop: 2,
    challenger_drop_pct: 33.33,
    challenger_step_drop_change: '-20.00%',
  },
  {
    id: 'stage-4',
    stage_name: 'Fraud Check',
    node_type: 'Decision Node 2',
    champion_in: 6,
    champion_out: 6,
    champion_drop: 0,
    champion_drop_pct: 0.0,
    champion_step_drop_change: '0.00%',
    challenger_in: 4,
    challenger_out: 3,
    challenger_drop: 1,
    challenger_drop_pct: 25.0,
    challenger_step_drop_change: '-10.00%',
  },
  {
    id: 'stage-5',
    stage_name: 'Final Processing',
    node_type: 'Service Node 3',
    champion_in: 6,
    champion_out: 6,
    champion_drop: 0,
    champion_drop_pct: 0.0,
    champion_step_drop_change: '0.00%',
    challenger_in: 3,
    challenger_out: 3,
    challenger_drop: 0,
    challenger_drop_pct: 0.0,
    challenger_step_drop_change: '0.00%',
  },
];

export const FUNNEL_METRIC_SUMMARY: MetricSummaryItem[] = [
  {
    metric: 'Total Requests',
    champion: '10',
    challenger: '10',
    difference: '0 (0.00%)',
    isPositive: true,
  },
  {
    metric: 'Completed Requests',
    champion: '6 (60.00%)',
    challenger: '3 (30.00%)',
    difference: '+30.00%',
    isPositive: true,
  },
  {
    metric: 'Dropped Requests',
    champion: '4 (40.00%)',
    challenger: '7 (70.00%)',
    difference: '-30.00%',
    isPositive: false,
  },
  {
    metric: 'Total Executions',
    champion: '20',
    challenger: '20',
    difference: '0 (0.00%)',
    isPositive: true,
  },
  {
    metric: 'Avg Response Time',
    champion: '512ms',
    challenger: '678ms',
    difference: '-24.48%',
    isPositive: true,
  },
  {
    metric: 'Total Time Saved',
    champion: '1.66s',
    challenger: '1.23s',
    difference: '+0.43s',
    isPositive: true,
  },
  {
    metric: 'Avg Confidence',
    champion: '83.50%',
    challenger: '74.21%',
    difference: '+9.29%',
    isPositive: true,
  },
];

export const TOP_DROP_REASONS: DropReasonItem[] = [
  {
    reason: 'High Risk Score',
    champion: 2,
    champion_pct: 20,
    challenger: 4,
    challenger_pct: 40,
    total: 6,
    total_pct: 54.55,
  },
  {
    reason: 'Data Validation Failed',
    champion: 1,
    champion_pct: 10,
    challenger: 2,
    challenger_pct: 20,
    total: 3,
    total_pct: 27.27,
  },
  {
    reason: 'Rule Condition Not Met',
    champion: 1,
    champion_pct: 10,
    challenger: 1,
    challenger_pct: 10,
    total: 2,
    total_pct: 18.18,
  },
  {
    reason: 'Service Timeout',
    champion: 0,
    champion_pct: 0,
    challenger: 0,
    challenger_pct: 0,
    total: 0,
    total_pct: 0.0,
  },
];

export const TIME_SERIES_METRICS: TimeSeriesDataPoint[] = [
  { date: 'Jul 25', champion_completion_rate: 55, challenger_completion_rate: 22, champion_requests: 6, challenger_requests: 4, champion_avg_rt: 520, challenger_avg_rt: 710 },
  { date: 'Jul 26', champion_completion_rate: 58, challenger_completion_rate: 25, champion_requests: 7, challenger_requests: 4, champion_avg_rt: 490, challenger_avg_rt: 690 },
  { date: 'Jul 27', champion_completion_rate: 68, challenger_completion_rate: 35, champion_requests: 8, challenger_requests: 5, champion_avg_rt: 510, challenger_avg_rt: 670 },
  { date: 'Jul 28', champion_completion_rate: 62, challenger_completion_rate: 24, champion_requests: 9, challenger_requests: 5, champion_avg_rt: 530, challenger_avg_rt: 720 },
  { date: 'Jul 29', champion_completion_rate: 70, challenger_completion_rate: 30, champion_requests: 12, challenger_requests: 5, champion_avg_rt: 500, challenger_avg_rt: 650 },
  { date: 'Jul 30', champion_completion_rate: 75, challenger_completion_rate: 38, champion_requests: 13, challenger_requests: 6, champion_avg_rt: 505, challenger_avg_rt: 660 },
  { date: 'Jul 31', champion_completion_rate: 78, challenger_completion_rate: 32, champion_requests: 14, challenger_requests: 6, champion_avg_rt: 495, challenger_avg_rt: 680 },
  { date: 'Aug 1',  champion_completion_rate: 85, challenger_completion_rate: 40, champion_requests: 16, challenger_requests: 7, champion_avg_rt: 480, challenger_avg_rt: 640 },
];

export const MOCK_REQUEST_COMPARISON: RequestComparisonItem[] = [
  {
    id: 'req-1',
    request_id: 'REQ-001',
    session_id: 'SES-94021',
    timestamp: 'Aug 1, 10:30:15 AM',
    champion_status: 'Completed',
    challenger_status: 'Dropped',
    challenger_drop_reason: 'High Risk Score',
    champion_path: 'S1 → D1 → S2 → D2 → S3',
    challenger_path: 'S1 → D1 → S2 (Dropped)',
    champion_response_time: 456,
    challenger_response_time: 712,
    winner: 'Champion',
    input_payload: {
      user_id: 'USR-88219',
      amount: 1450.00,
      currency: 'USD',
      merchant_category: 'Electronics',
      device_trust_score: 0.94,
      location: { country: 'US', ip: '192.168.1.1' }
    },
    champion_executions: [
      { step_id: 'step-1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 45, input_payload: { raw: 'input' }, output_payload: { valid: true } },
      { step_id: 'step-2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'completed', duration_ms: 110, input_payload: { valid: true }, output_payload: { riskScore: 0.18, decision: 'pass' } },
      { step_id: 'step-3', node_id: 's2', node_name: 'Data Enrichment', node_type: 'service', status: 'completed', duration_ms: 180, input_payload: { user_id: 'USR-88219' }, output_payload: { enriched: true, userTier: 'VIP' } },
      { step_id: 'step-4', node_id: 'd2', node_name: 'Fraud Check', node_type: 'decision', status: 'completed', duration_ms: 70, input_payload: { fraudFlag: false }, output_payload: { approved: true } },
      { step_id: 'step-5', node_id: 's3', node_name: 'Final Processing', node_type: 'service', status: 'completed', duration_ms: 51, input_payload: { action: 'authorize' }, output_payload: { status: 'SUCCESS', transaction_id: 'TXN-99812' } },
    ],
    challenger_executions: [
      { step_id: 'step-1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 95, input_payload: { raw: 'input' }, output_payload: { valid: true } },
      { step_id: 'step-2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'completed', duration_ms: 240, input_payload: { valid: true }, output_payload: { riskScore: 0.82, decision: 'flag' } },
      { step_id: 'step-3', node_id: 's2', node_name: 'Data Enrichment', node_type: 'service', status: 'dropped', duration_ms: 377, input_payload: { user_id: 'USR-88219' }, drop_reason: 'High Risk Score thresholds exceeded (0.82 > 0.75)' },
    ],
  },
  {
    id: 'req-2',
    request_id: 'REQ-002',
    session_id: 'SES-94022',
    timestamp: 'Aug 1, 10:28:42 AM',
    champion_status: 'Completed',
    challenger_status: 'Completed',
    champion_path: 'S1 → D1 → S2 → D2 → S3',
    challenger_path: 'S1 → D1 → S2 → D2 → S3',
    champion_response_time: 423,
    challenger_response_time: 589,
    winner: 'Champion',
    input_payload: {
      user_id: 'USR-77310',
      amount: 230.50,
      currency: 'USD',
      merchant_category: 'Groceries',
      device_trust_score: 0.99,
      location: { country: 'US', ip: '10.0.0.12' }
    },
    champion_executions: [
      { step_id: 'step-1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 38, input_payload: {}, output_payload: { valid: true } },
      { step_id: 'step-2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'completed', duration_ms: 95, input_payload: {}, output_payload: { riskScore: 0.05 } },
      { step_id: 'step-3', node_id: 's2', node_name: 'Data Enrichment', node_type: 'service', status: 'completed', duration_ms: 160, input_payload: {}, output_payload: { enriched: true } },
      { step_id: 'step-4', node_id: 'd2', node_name: 'Fraud Check', node_type: 'decision', status: 'completed', duration_ms: 80, input_payload: {}, output_payload: { approved: true } },
      { step_id: 'step-5', node_id: 's3', node_name: 'Final Processing', node_type: 'service', status: 'completed', duration_ms: 50, input_payload: {}, output_payload: { status: 'SUCCESS' } },
    ],
    challenger_executions: [
      { step_id: 'step-1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 60, input_payload: {}, output_payload: { valid: true } },
      { step_id: 'step-2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'completed', duration_ms: 180, input_payload: {}, output_payload: { riskScore: 0.09 } },
      { step_id: 'step-3', node_id: 's2', node_name: 'Data Enrichment', node_type: 'service', status: 'completed', duration_ms: 190, input_payload: {}, output_payload: { enriched: true } },
      { step_id: 'step-4', node_id: 'd2', node_name: 'Fraud Check', node_type: 'decision', status: 'completed', duration_ms: 99, input_payload: {}, output_payload: { approved: true } },
      { step_id: 'step-5', node_id: 's3', node_name: 'Final Processing', node_type: 'service', status: 'completed', duration_ms: 60, input_payload: {}, output_payload: { status: 'SUCCESS' } },
    ],
  },
  {
    id: 'req-3',
    request_id: 'REQ-003',
    session_id: 'SES-94023',
    timestamp: 'Aug 1, 10:27:33 AM',
    champion_status: 'Dropped',
    challenger_status: 'Dropped',
    champion_drop_reason: 'Rule Condition Not Met',
    challenger_drop_reason: 'High Risk Score',
    champion_path: 'S1 → D1 (Dropped)',
    challenger_path: 'S1 → D1 (Dropped)',
    champion_response_time: 156,
    challenger_response_time: 334,
    winner: 'Challenger',
    input_payload: {
      user_id: 'USR-10293',
      amount: 8900.00,
      currency: 'EUR',
      merchant_category: 'Crypto Exchange',
      device_trust_score: 0.42,
      location: { country: 'DE', ip: '82.165.1.5' }
    },
    champion_executions: [
      { step_id: 'step-1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 40, input_payload: {}, output_payload: { valid: true } },
      { step_id: 'step-2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'dropped', duration_ms: 116, input_payload: {}, drop_reason: 'Rule Condition Not Met: User limit exceeded' },
    ],
    challenger_executions: [
      { step_id: 'step-1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 84, input_payload: {}, output_payload: { valid: true } },
      { step_id: 'step-2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'dropped', duration_ms: 250, input_payload: {}, drop_reason: 'High Risk Score (0.91)' },
    ],
  },
  {
    id: 'req-4',
    request_id: 'REQ-004',
    session_id: 'SES-94024',
    timestamp: 'Aug 1, 10:26:11 AM',
    champion_status: 'Completed',
    challenger_status: 'Dropped',
    challenger_drop_reason: 'Data Validation Failed',
    champion_path: 'S1 → D1 → S2 → D2 → S3',
    challenger_path: 'S1 → D1 → S2 (Dropped)',
    champion_response_time: 512,
    challenger_response_time: 701,
    winner: 'Champion',
    input_payload: {
      user_id: 'USR-44129',
      amount: 45.00,
      currency: 'USD',
      merchant_category: 'Streaming Service',
      device_trust_score: 0.88,
      location: { country: 'US', ip: '72.14.201.1' }
    },
    champion_executions: [
      { step_id: 'step-1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 42, input_payload: {}, output_payload: { valid: true } },
      { step_id: 'step-2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'completed', duration_ms: 120, input_payload: {}, output_payload: { riskScore: 0.12 } },
      { step_id: 'step-3', node_id: 's2', node_name: 'Data Enrichment', node_type: 'service', status: 'completed', duration_ms: 210, input_payload: {}, output_payload: { enriched: true } },
      { step_id: 'step-4', node_id: 'd2', node_name: 'Fraud Check', node_type: 'decision', status: 'completed', duration_ms: 80, input_payload: {}, output_payload: { approved: true } },
      { step_id: 'step-5', node_id: 's3', node_name: 'Final Processing', node_type: 'service', status: 'completed', duration_ms: 60, input_payload: {}, output_payload: { status: 'SUCCESS' } },
    ],
    challenger_executions: [
      { step_id: 'step-1', node_id: 's1', node_name: 'Request Validation', node_type: 'service', status: 'completed', duration_ms: 90, input_payload: {}, output_payload: { valid: true } },
      { step_id: 'step-2', node_id: 'd1', node_name: 'Risk Evaluation', node_type: 'decision', status: 'completed', duration_ms: 211, input_payload: {}, output_payload: { riskScore: 0.15 } },
      { step_id: 'step-3', node_id: 's2', node_name: 'Data Enrichment', node_type: 'service', status: 'dropped', duration_ms: 400, input_payload: {}, drop_reason: 'Data Validation Failed: Missing device token' },
    ],
  },
  {
    id: 'req-5',
    request_id: 'REQ-005',
    session_id: 'SES-94025',
    timestamp: 'Aug 1, 10:24:50 AM',
    champion_status: 'Completed',
    challenger_status: 'Completed',
    champion_path: 'S1 → D1 → S2 → D2 → S3',
    challenger_path: 'S1 → D1 → S2 → D2 → S3',
    champion_response_time: 480,
    challenger_response_time: 620,
    winner: 'Champion',
    input_payload: { user_id: 'USR-55102', amount: 310.00, currency: 'USD' },
    champion_executions: [],
    challenger_executions: [],
  },
  {
    id: 'req-6',
    request_id: 'REQ-006',
    session_id: 'SES-94026',
    timestamp: 'Aug 1, 10:22:15 AM',
    champion_status: 'Dropped',
    champion_drop_reason: 'High Risk Score',
    challenger_status: 'Dropped',
    challenger_drop_reason: 'High Risk Score',
    champion_path: 'S1 → D1 (Dropped)',
    challenger_path: 'S1 (Dropped)',
    champion_response_time: 140,
    challenger_response_time: 190,
    winner: 'Champion',
    input_payload: { user_id: 'USR-66291', amount: 12000.00, currency: 'USD' },
    champion_executions: [],
    challenger_executions: [],
  },
  {
    id: 'req-7',
    request_id: 'REQ-007',
    session_id: 'SES-94027',
    timestamp: 'Aug 1, 10:20:00 AM',
    champion_status: 'Completed',
    challenger_status: 'Dropped',
    challenger_drop_reason: 'High Risk Score',
    champion_path: 'S1 → D1 → S2 → D2 → S3',
    challenger_path: 'S1 → D1 (Dropped)',
    champion_response_time: 495,
    challenger_response_time: 280,
    winner: 'Champion',
    input_payload: { user_id: 'USR-77182', amount: 670.00, currency: 'USD' },
    champion_executions: [],
    challenger_executions: [],
  },
  {
    id: 'req-8',
    request_id: 'REQ-008',
    session_id: 'SES-94028',
    timestamp: 'Aug 1, 10:18:30 AM',
    champion_status: 'Completed',
    challenger_status: 'Completed',
    champion_path: 'S1 → D1 → S2 → D2 → S3',
    challenger_path: 'S1 → D1 → S2 → D2 → S3',
    champion_response_time: 410,
    challenger_response_time: 540,
    winner: 'Champion',
    input_payload: { user_id: 'USR-88219', amount: 120.00, currency: 'USD' },
    champion_executions: [],
    challenger_executions: [],
  },
  {
    id: 'req-9',
    request_id: 'REQ-009',
    session_id: 'SES-94029',
    timestamp: 'Aug 1, 10:15:10 AM',
    champion_status: 'Dropped',
    champion_drop_reason: 'Data Validation Failed',
    challenger_status: 'Dropped',
    challenger_drop_reason: 'Data Validation Failed',
    champion_path: 'S1 (Dropped)',
    challenger_path: 'S1 (Dropped)',
    champion_response_time: 98,
    challenger_response_time: 145,
    winner: 'Champion',
    input_payload: { user_id: 'USR-99120', amount: 0.00, currency: 'USD' },
    champion_executions: [],
    challenger_executions: [],
  },
  {
    id: 'req-10',
    request_id: 'REQ-010',
    session_id: 'SES-94030',
    timestamp: 'Aug 1, 10:12:05 AM',
    champion_status: 'Completed',
    challenger_status: 'Dropped',
    challenger_drop_reason: 'Fraud Check Threshold',
    champion_path: 'S1 → D1 → S2 → D2 → S3',
    challenger_path: 'S1 → D1 → S2 → D2 (Dropped)',
    champion_response_time: 530,
    challenger_response_time: 685,
    winner: 'Champion',
    input_payload: { user_id: 'USR-00129', amount: 2400.00, currency: 'USD' },
    champion_executions: [],
    challenger_executions: [],
  },
];
