export interface CandidateModel {
  id: string;
  name: string;
  version: string;
  color: string;
  isChampion?: boolean;
  dropRate?: number;
  outputCount?: number;
  latencyMs?: number;
}

export interface WorkflowNode {
  id: string;
  order: number;
  name: string;
  type: 'service' | 'decision' | 'llm' | 'transform';
  inputCount: number;
  outputCount: number;
  droppedCount: number;
  dropPct: number;
  avgLatencyMs: number;
  errorPct: number;
  ruleCount: number;
  championConversionPct: number;
  bestChallengerConversionPct: number;
  bestChallengerDeltaPct: number;
  bestChallengerId: string;
}

export interface ChallengerModelData {
  id: string;
  name: string;
  version: string;
  color: string; // Emerald #10B981, Violet #8B5CF6, Amber #F59E0B, Rose #F43F5E, Cyan #06B6D4
  badgeBg: string;
  badgeText: string;
  outputCount: number;
  outputDelta: number; // e.g. +143
  dropPct: number;
  latencyDeltaMs: number; // e.g. -3ms
  errorDeltaPct: number; // e.g. -0.1%
  confidenceScore: number; // e.g. 0.96
  winProbabilityPct: number; // e.g. 94%
  pValue: number; // e.g. 0.004
  ciRange: string; // e.g. "[+1.1%, +4.5%]"
  sparklineData: number[];
}

export interface BusinessRuleImpact {
  ruleId: string;
  ruleName: string;
  category: string;
  championDrops: number;
  bestChallengerDrops: number;
  deltaDrops: number; // e.g. -111
  allChallengerDrops: Record<string, number>;
}

export interface RequestDiffSample {
  requestId: string;
  sessionId: string;
  timestamp: string;
  winningChallengerId: string;
  championPath: string;
  challengerPath: string;
  championStatus: 'PASS' | 'DROP';
  challengerStatus: 'PASS' | 'DROP';
  dropReason?: string;
  confidenceDelta: number;
  latencyDeltaMs: number;
}

export interface AIInsightItem {
  id: string;
  type: 'positive' | 'warning' | 'critical' | 'recommendation';
  title: string;
  description: string;
  financialImpact: string;
  recommendedAction: string;
}

export interface DynamicRequestItem {
  id: string;
  request_id: string;
  session_id: string;
  timestamp: string;
  winnerCandidateId: string;
  results: Record<string, { status: 'Completed' | 'Dropped'; responseTime: number }>;
  pathDiffs?: Record<string, string>;
}

// 8 Workflow Stages
export const MASTER_WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: 'node-1',
    order: 1,
    name: '1 Request Validation',
    type: 'service',
    inputCount: 100000,
    outputCount: 98450,
    droppedCount: 1550,
    dropPct: 1.55,
    avgLatencyMs: 12,
    errorPct: 0.05,
    ruleCount: 4,
    championConversionPct: 98.45,
    bestChallengerConversionPct: 99.10,
    bestChallengerDeltaPct: 0.65,
    bestChallengerId: 'chall-a',
  },
  {
    id: 'node-2',
    order: 2,
    name: '2 Device Intelligence',
    type: 'service',
    inputCount: 98450,
    outputCount: 94100,
    droppedCount: 4350,
    dropPct: 4.42,
    avgLatencyMs: 28,
    errorPct: 0.12,
    ruleCount: 8,
    championConversionPct: 95.58,
    bestChallengerConversionPct: 97.20,
    bestChallengerDeltaPct: 1.62,
    bestChallengerId: 'chall-a',
  },
  {
    id: 'node-3',
    order: 3,
    name: '3 Risk Evaluation',
    type: 'decision',
    inputCount: 94100,
    outputCount: 79350,
    droppedCount: 14750,
    dropPct: 15.67,
    avgLatencyMs: 42,
    errorPct: 0.20,
    ruleCount: 18,
    championConversionPct: 84.33,
    bestChallengerConversionPct: 87.13,
    bestChallengerDeltaPct: 2.80,
    bestChallengerId: 'chall-a',
  },
  {
    id: 'node-4',
    order: 4,
    name: '4 Velocity Check',
    type: 'decision',
    inputCount: 79350,
    outputCount: 72100,
    droppedCount: 7250,
    dropPct: 9.14,
    avgLatencyMs: 18,
    errorPct: 0.08,
    ruleCount: 12,
    championConversionPct: 90.86,
    bestChallengerConversionPct: 92.40,
    bestChallengerDeltaPct: 1.54,
    bestChallengerId: 'chall-b',
  },
  {
    id: 'node-5',
    order: 5,
    name: '5 Geo Analysis',
    type: 'decision',
    inputCount: 72100,
    outputCount: 68400,
    droppedCount: 3700,
    dropPct: 5.13,
    avgLatencyMs: 22,
    errorPct: 0.15,
    ruleCount: 9,
    championConversionPct: 94.87,
    bestChallengerConversionPct: 95.80,
    bestChallengerDeltaPct: 0.93,
    bestChallengerId: 'chall-a',
  },
  {
    id: 'node-6',
    order: 6,
    name: '6 Fraud Score',
    type: 'decision',
    inputCount: 68400,
    outputCount: 62100,
    droppedCount: 6300,
    dropPct: 9.21,
    avgLatencyMs: 65,
    errorPct: 0.35,
    ruleCount: 24,
    championConversionPct: 90.79,
    bestChallengerConversionPct: 93.10,
    bestChallengerDeltaPct: 2.31,
    bestChallengerId: 'chall-a',
  },
  {
    id: 'node-7',
    order: 7,
    name: '7 Decision Node',
    type: 'decision',
    inputCount: 62100,
    outputCount: 59800,
    droppedCount: 2300,
    dropPct: 3.70,
    avgLatencyMs: 15,
    errorPct: 0.04,
    ruleCount: 6,
    championConversionPct: 96.30,
    bestChallengerConversionPct: 97.40,
    bestChallengerDeltaPct: 1.10,
    bestChallengerId: 'chall-a',
  },
  {
    id: 'node-8',
    order: 8,
    name: '8 Final Processing',
    type: 'service',
    inputCount: 59800,
    outputCount: 59450,
    droppedCount: 350,
    dropPct: 0.58,
    avgLatencyMs: 35,
    errorPct: 0.02,
    ruleCount: 3,
    championConversionPct: 99.42,
    bestChallengerConversionPct: 99.80,
    bestChallengerDeltaPct: 0.38,
    bestChallengerId: 'chall-a',
  },
];

// Champion + 5 Detailed Challengers (expandable to 20+)
export const CHAMPION_MODEL = {
  id: 'champion',
  name: 'Champion (Production v1.2)',
  version: 'v1.2',
  color: '#3B82F6', // Blue
  badgeBg: 'bg-blue-500/20',
  badgeText: 'text-blue-400',
  outputCount: 79350,
  dropPct: 15.67,
  latencyMs: 42,
  errorPct: 0.20,
};

export const AVAILABLE_CANDIDATES: CandidateModel[] = [
  { id: 'champion', name: 'Champion (Production v1.2)', version: 'v1.2', color: '#3B82F6', isChampion: true, dropRate: 15.67, outputCount: 79350, latencyMs: 42 },
  { id: 'chall-a', name: 'Challenger A (Optimized XGBoost)', version: 'v2.4', color: '#10B981', isChampion: false, dropRate: 12.91, outputCount: 81950, latencyMs: 39 },
  { id: 'chall-b', name: 'Challenger B (Low-Latency Flash)', version: 'v3.0', color: '#8B5CF6', isChampion: false, dropRate: 17.00, outputCount: 78100, latencyMs: 28 },
  { id: 'chall-c', name: 'Challenger C (Strict Risk Guardian)', version: 'v3.1', color: '#F59E0B', isChampion: false, dropRate: 20.08, outputCount: 75200, latencyMs: 50 },
  { id: 'chall-d', name: 'Challenger D (Experimental Hybrid)', version: 'v4.0', color: '#F43F5E', isChampion: false, dropRate: 12.43, outputCount: 82400, latencyMs: 36 },
  { id: 'chall-e', name: 'Challenger E (Graph Neural Net)', version: 'v1.0-gNN', color: '#06B6D4', isChampion: false, dropRate: 14.13, outputCount: 80800, latencyMs: 60 },
];

export const CHALLENGER_MODELS: ChallengerModelData[] = [
  {
    id: 'chall-a',
    name: 'Challenger A (Optimized XGBoost v2.4)',
    version: 'v2.4',
    color: '#10B981', // Emerald
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    outputCount: 81950,
    outputDelta: 2600,
    dropPct: 12.91,
    latencyDeltaMs: -3,
    errorDeltaPct: -0.10,
    confidenceScore: 0.96,
    winProbabilityPct: 94,
    pValue: 0.004,
    ciRange: '[+1.8%, +3.8%]',
    sparklineData: [72, 75, 79, 82, 85, 87],
  },
  {
    id: 'chall-b',
    name: 'Challenger B (Low-Latency Flash v3.0)',
    version: 'v3.0',
    color: '#8B5CF6', // Violet
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    outputCount: 78100,
    outputDelta: -1250,
    dropPct: 17.00,
    latencyDeltaMs: -14,
    errorDeltaPct: -0.05,
    confidenceScore: 0.89,
    winProbabilityPct: 62,
    pValue: 0.082,
    ciRange: '[-0.5%, +1.2%]',
    sparklineData: [68, 70, 72, 74, 76, 78],
  },
  {
    id: 'chall-c',
    name: 'Challenger C (Strict Risk Guardian v3.1)',
    version: 'v3.1',
    color: '#F59E0B', // Amber
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    outputCount: 75200,
    outputDelta: -4150,
    dropPct: 20.08,
    latencyDeltaMs: +8,
    errorDeltaPct: -0.15,
    confidenceScore: 0.94,
    winProbabilityPct: 15,
    pValue: 0.001,
    ciRange: '[-5.2%, -2.1%]',
    sparklineData: [85, 82, 78, 76, 75, 75],
  },
  {
    id: 'chall-d',
    name: 'Challenger D (Experimental Hybrid v4.0)',
    version: 'v4.0',
    color: '#F43F5E', // Rose
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-400',
    outputCount: 82400,
    outputDelta: 3050,
    dropPct: 12.43,
    latencyDeltaMs: -6,
    errorDeltaPct: -0.08,
    confidenceScore: 0.92,
    winProbabilityPct: 89,
    pValue: 0.012,
    ciRange: '[+1.2%, +4.1%]',
    sparklineData: [70, 74, 78, 81, 84, 86],
  },
  {
    id: 'chall-e',
    name: 'Challenger E (Graph Neural Net v1.0)',
    version: 'v1.0-gNN',
    color: '#06B6D4', // Cyan
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-400',
    outputCount: 80800,
    outputDelta: 1450,
    dropPct: 14.13,
    latencyDeltaMs: +18,
    errorDeltaPct: -0.18,
    confidenceScore: 0.95,
    winProbabilityPct: 78,
    pValue: 0.035,
    ciRange: '[+0.3%, +2.9%]',
    sparklineData: [71, 73, 76, 79, 80, 81],
  },
];

// Business Rules Impact at Risk Evaluation (Node 3)
export const BUSINESS_RULE_IMPACTS: BusinessRuleImpact[] = [
  {
    ruleId: 'RULE_14',
    ruleName: 'High Device Risk Score (> 0.75)',
    category: 'Device Intelligence',
    championDrops: 4120,
    bestChallengerDrops: 3010,
    deltaDrops: -1110,
    allChallengerDrops: { 'chall-a': 3010, 'chall-b': 3880, 'chall-c': 4550, 'chall-d': 2900, 'chall-e': 3400 },
  },
  {
    ruleId: 'RULE_09',
    ruleName: 'Transaction Velocity > 5 in 10m',
    category: 'Velocity & Pattern',
    championDrops: 2880,
    bestChallengerDrops: 3400,
    deltaDrops: 520,
    allChallengerDrops: { 'chall-a': 3400, 'chall-b': 2710, 'chall-c': 1990, 'chall-d': 3500, 'chall-e': 2900 },
  },
  {
    ruleId: 'RULE_22',
    ruleName: 'IP Geo Mismatch vs Billing',
    category: 'Geolocation',
    championDrops: 2010,
    bestChallengerDrops: 1980,
    deltaDrops: -30,
    allChallengerDrops: { 'chall-a': 1980, 'chall-b': 2050, 'chall-c': 2440, 'chall-d': 1870, 'chall-e': 1990 },
  },
  {
    ruleId: 'RULE_05',
    ruleName: 'Synthetic Identity Cluster match',
    category: 'Identity Fraud',
    championDrops: 1850,
    bestChallengerDrops: 1420,
    deltaDrops: -430,
    allChallengerDrops: { 'chall-a': 1420, 'chall-b': 1790, 'chall-c': 2100, 'chall-d': 1380, 'chall-e': 1510 },
  },
  {
    ruleId: 'RULE_31',
    ruleName: 'Blacklisted Merchant Network',
    category: 'Merchant Risk',
    championDrops: 1450,
    bestChallengerDrops: 1100,
    deltaDrops: -350,
    allChallengerDrops: { 'chall-a': 1100, 'chall-b': 1350, 'chall-c': 1680, 'chall-d': 1050, 'chall-e': 1220 },
  },
];

// Sample Request Journey Path Diffs
export const REQUEST_DIFF_SAMPLES: RequestDiffSample[] = [
  {
    requestId: 'REQ-00921',
    sessionId: 'SES-94021',
    timestamp: 'Aug 1, 20:15:10',
    winningChallengerId: 'chall-a',
    championStatus: 'DROP',
    challengerStatus: 'PASS',
    championPath: 'S1 → S2 → RiskEval → DROP (RULE_14: High Device Risk)',
    challengerPath: 'S1 → S2 → RiskEval → VelocityCheck → GeoAnalysis → Decision → PASS',
    dropReason: 'High Device Risk threshold exceeded (0.82 > 0.75)',
    confidenceDelta: +0.18,
    latencyDeltaMs: -12,
  },
  {
    requestId: 'REQ-00922',
    sessionId: 'SES-94022',
    timestamp: 'Aug 1, 20:14:02',
    winningChallengerId: 'chall-a',
    championStatus: 'PASS',
    challengerStatus: 'PASS',
    championPath: 'S1 → S2 → RiskEval → VelocityCheck → GeoAnalysis → Decision → PASS',
    challengerPath: 'S1 → S2 → RiskEval → VelocityCheck → GeoAnalysis → Decision → PASS',
    confidenceDelta: +0.05,
    latencyDeltaMs: -5,
  },
  {
    requestId: 'REQ-00923',
    sessionId: 'SES-94023',
    timestamp: 'Aug 1, 20:12:44',
    winningChallengerId: 'chall-b',
    championStatus: 'DROP',
    challengerStatus: 'PASS',
    championPath: 'S1 → S2 → RiskEval → DROP (RULE_09: Velocity > 5)',
    challengerPath: 'S1 → S2 → RiskEval → VelocityCheck → GeoAnalysis → PASS',
    dropReason: 'Velocity limit exceeded',
    confidenceDelta: +0.22,
    latencyDeltaMs: -18,
  },
];

export const DYNAMIC_REQUESTS: DynamicRequestItem[] = [
  {
    id: 'req-1',
    request_id: 'REQ-00921',
    session_id: 'SES-94021',
    timestamp: 'Aug 1, 20:15:10',
    winnerCandidateId: 'chall-a',
    results: {
      champion: { status: 'Dropped', responseTime: 412 },
      'chall-a': { status: 'Completed', responseTime: 388 },
      'chall-b': { status: 'Completed', responseTime: 360 },
      'chall-c': { status: 'Dropped', responseTime: 440 },
      'chall-d': { status: 'Completed', responseTime: 375 },
      'chall-e': { status: 'Completed', responseTime: 410 },
    },
  },
  {
    id: 'req-2',
    request_id: 'REQ-00922',
    session_id: 'SES-94022',
    timestamp: 'Aug 1, 20:14:02',
    winnerCandidateId: 'chall-a',
    results: {
      champion: { status: 'Completed', responseTime: 390 },
      'chall-a': { status: 'Completed', responseTime: 372 },
      'chall-b': { status: 'Completed', responseTime: 350 },
      'chall-c': { status: 'Completed', responseTime: 420 },
      'chall-d': { status: 'Completed', responseTime: 368 },
      'chall-e': { status: 'Completed', responseTime: 405 },
    },
  },
  {
    id: 'req-3',
    request_id: 'REQ-00923',
    session_id: 'SES-94023',
    timestamp: 'Aug 1, 20:12:44',
    winnerCandidateId: 'chall-b',
    results: {
      champion: { status: 'Dropped', responseTime: 450 },
      'chall-a': { status: 'Dropped', responseTime: 410 },
      'chall-b': { status: 'Completed', responseTime: 340 },
      'chall-c': { status: 'Dropped', responseTime: 480 },
      'chall-d': { status: 'Completed', responseTime: 355 },
      'chall-e': { status: 'Dropped', responseTime: 430 },
    },
  },
];

export const AI_INSIGHTS: AIInsightItem[] = [
  {
    id: 'ins-1',
    type: 'positive',
    title: 'Challenger A Boosts Overall Yield by +2.8%',
    description: 'Challenger A reduces false-positive fallout on RULE_14 (High Device Risk) by 1,110 requests without increasing fraudulent leakage.',
    financialImpact: '+$1.2M Annual Approved Revenue',
    recommendedAction: 'Promote Challenger A to Shadow Traffic (25% split)',
  },
  {
    id: 'ins-2',
    type: 'warning',
    title: 'Challenger C Over-rejection Alert',
    description: 'Challenger C causes a +12.4% increase in drops at Risk Evaluation, leading to severe conversion fallout.',
    financialImpact: '-$840k Annual Lost Revenue',
    recommendedAction: 'Deprecate Challenger C from active candidate benchmark',
  },
  {
    id: 'ins-3',
    type: 'recommendation',
    title: 'RULE_09 Contributes 41% of Model Variance',
    description: 'Velocity threshold in Challenger A causes a minor +520 drop shift. Tuning RULE_09 parameters will optimize Challenger A yield further.',
    financialImpact: '+$350k Potential Recovery',
    recommendedAction: 'Refine RULE_09 velocity window from 10m to 15m sliding window',
  },
];
