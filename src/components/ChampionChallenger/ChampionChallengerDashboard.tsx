import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Grid,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RequestComparisonItem } from './championChallengerMock';
import { FunnelOverviewTab } from './FunnelOverviewTab';
import { StepAnalysisTab } from './StepAnalysisTab';
import { RequestComparisonTab } from './RequestComparisonTab';
import { DropAnalysisTab } from './DropAnalysisTab';
import { PerformanceTab } from './PerformanceTab';
import { NodeLevelTab } from './NodeLevelTab';
import { MetricsExplorerTab } from './MetricsExplorerTab';
import { AlertsTab } from './AlertsTab';
import { ExecutionPayloadModal } from './ExecutionPayloadModal';

export const ChampionChallengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [comparisonModel, setComparisonModel] = useState<string>('Champion vs Challenger');
  const [dateRange, setDateRange] = useState<string>('Jul 25, 2025 - Aug 1, 2025');
  const [selectedRequest, setSelectedRequest] = useState<RequestComparisonItem | null>(null);

  const handleExportReport = () => {
    toast.success('Champion vs Challenger report exported successfully!');
  };

  const tabs = [
    { id: 'overview', label: 'Funnel Overview' },
    { id: 'step', label: 'Step Analysis' },
    { id: 'requests', label: 'Request Comparison' },
    { id: 'drop', label: 'Drop Analysis' },
    { id: 'performance', label: 'Performance' },
    { id: 'node', label: 'Node Level' },
    { id: 'metrics', label: 'Metrics Explorer' },
    { id: 'alerts', label: 'Alerts' },
  ];

  return (
    <div className="min-h-full bg-gray-50 text-gray-900 font-sans p-6 md:p-8 space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Champion vs Challenger – Funnel Comparison
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">
            Compare how requests flow through Langgraph nodes in Champion and Challenger
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Comparison Selector Dropdown */}
          <div className="relative">
            <select
              value={comparisonModel}
              onChange={(e) => setComparisonModel(e.target.value)}
              className="appearance-none bg-white border border-gray-300 hover:border-gray-400 rounded-xl px-4 py-2 pr-9 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="Champion vs Challenger">Comparison: Champion vs Challenger</option>
              <option value="Champion vs Challenger B">Comparison: Champion vs Challenger B (V2.5)</option>
              <option value="Champion V1 vs Champion V2">Comparison: Champion V1 vs Champion V2</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Date Picker Range button */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 shadow-sm">
            <Calendar size={14} className="text-gray-500" />
            <span>{dateRange}</span>
          </div>

          {/* Grid Toggle Icon Button */}
          <button
            className="p-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl text-gray-600 hover:text-gray-900 transition-all shadow-sm"
            title="Toggle Grid View"
          >
            <Grid size={16} />
          </button>

          {/* Export Report Button */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-gray-200 scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Display */}
      <div className="pt-2">
        {activeTab === 'overview' && <FunnelOverviewTab onSelectRequest={setSelectedRequest} />}
        {activeTab === 'step' && <StepAnalysisTab />}
        {activeTab === 'requests' && <RequestComparisonTab onSelectRequest={setSelectedRequest} />}
        {activeTab === 'drop' && <DropAnalysisTab />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'node' && <NodeLevelTab />}
        {activeTab === 'metrics' && <MetricsExplorerTab />}
        {activeTab === 'alerts' && <AlertsTab />}
      </div>

      {/* Execution Payload Detail Modal */}
      {selectedRequest && (
        <ExecutionPayloadModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </div>
  );
};

export default ChampionChallengerDashboard;
