import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BUSINESS_RULE_IMPACTS,
  CHALLENGER_MODELS,
  AI_INSIGHTS,
  BusinessRuleImpact,
} from './championChallengerMock';
import {
  Grid,
  GitBranch,
  Cpu,
  BarChart3,
  Sparkles,
  Search,
  CheckCircle2,
  Award,
} from 'lucide-react';

export const BottomAnalyticsPanels: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'journey' | 'performance' | 'stat_sig' | 'insights'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRule, setSelectedRule] = useState<BusinessRuleImpact | null>(BUSINESS_RULE_IMPACTS[0]);

  const filteredRules = BUSINESS_RULE_IMPACTS.filter((r) =>
    r.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ruleId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-6 select-none">
      {/* Bottom Tabs Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          {[
            { id: 'rules', label: 'Rule Impact Matrix', icon: Grid },
            { id: 'journey', label: 'Request Journey Explorer', icon: GitBranch },
            { id: 'performance', label: 'Performance & Cost', icon: Cpu },
            { id: 'stat_sig', label: 'Statistical Significance', icon: BarChart3 },
            { id: 'insights', label: 'AI Insights & Action Plan', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
          Live Analytics Engine
        </span>
      </div>

      {/* Tab 1: Rule Impact Matrix Heatmap */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Cross-Candidate Rule Impact Heatmap</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Rule-level fallout distribution comparing Champion against active Challengers (Sort by impact, search, or click to sample)
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search rule ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 font-sans">
                  <th className="py-3 px-3">Rule Identifier</th>
                  <th className="py-3 px-3 text-center text-blue-700">Champ (v1.2)</th>
                  {CHALLENGER_MODELS.map((c) => (
                    <th key={c.id} className="py-3 px-3 text-center" style={{ color: c.color }}>
                      {c.name.split(' ')[0]} ({c.version})
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right">Max Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRules.map((rule) => {
                  const maxDelta = rule.deltaDrops;
                  return (
                    <tr
                      key={rule.ruleId}
                      onClick={() => setSelectedRule(rule)}
                      className={`hover:bg-gray-50 cursor-pointer transition-all ${
                        selectedRule?.ruleId === rule.ruleId ? 'bg-blue-50/50 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="text-gray-900 font-bold block font-sans">{rule.ruleName}</span>
                        <span className="text-[10px] text-gray-500">{rule.ruleId} • {rule.category}</span>
                      </td>
                      <td className="py-3 px-3 text-center bg-blue-50 font-bold text-blue-800">
                        {rule.championDrops.toLocaleString()}
                      </td>
                      {CHALLENGER_MODELS.map((c) => {
                        const drops = rule.allChallengerDrops[c.id] || rule.championDrops;
                        const diff = drops - rule.championDrops;
                        return (
                          <td
                            key={c.id}
                            className={`py-3 px-3 text-center font-bold ${
                              diff < 0
                                ? 'bg-emerald-50 text-emerald-800'
                                : diff > 0
                                ? 'bg-red-50 text-red-800'
                                : 'text-gray-800'
                            }`}
                          >
                            {drops.toLocaleString()}
                            <span className="text-[9px] block font-normal opacity-80">
                              ({diff > 0 ? `+${diff}` : diff})
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-right font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            maxDelta < 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {maxDelta > 0 ? `+${maxDelta}` : maxDelta}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Request Journey Explorer */}
      {activeTab === 'journey' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Sankey / Flow Request Journey Graph</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Traffic distribution and branch fallout overlaid across decision rules
            </p>
          </div>

          {/* Visual Flow Diagram */}
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-center">
              {/* Step 1: Input */}
              <div className="p-3.5 rounded-xl bg-white border border-blue-200 text-blue-900 font-bold min-w-[140px] shadow-xs">
                <div>100,000 Requests</div>
                <div className="text-[10px] text-gray-500 font-sans mt-0.5">Batch Input</div>
              </div>

              <div className="text-gray-400 font-bold">↓</div>

              {/* Step 2: Validation */}
              <div className="p-3.5 rounded-xl bg-white border border-blue-200 text-blue-800 font-bold min-w-[140px] shadow-xs">
                <div>Validation Node</div>
                <div className="text-[10px] text-emerald-700 font-sans mt-0.5">Pass 98,450</div>
              </div>

              <div className="text-gray-400 font-bold">↓</div>

              {/* Step 3: Risk Evaluation Branch */}
              <div className="p-4 rounded-xl bg-white border border-purple-200 text-purple-900 font-bold space-y-2 min-w-[220px] shadow-xs">
                <div>Risk Evaluation Node</div>
                <div className="flex justify-between text-[11px] pt-2 border-t border-gray-200">
                  <span className="text-emerald-700">Pass 79,350</span>
                  <span className="text-red-600">Drop 14,750</span>
                </div>
              </div>
            </div>

            {/* Drop Branches Detail */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200 text-xs font-mono">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
                <div className="font-bold font-sans">RULE_14 (High Device Risk)</div>
                <div>4,120 drops in Champion</div>
                <div className="text-emerald-700 font-bold">3,010 drops in Challenger A (-1,110)</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold font-sans">RULE_09 (Velocity &gt; 5)</div>
                <div>2,880 drops in Champion</div>
                <div className="text-red-700 font-bold">3,400 drops in Challenger A (+520)</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                <div className="font-bold font-sans">RULE_22 (Geo Mismatch)</div>
                <div>2,010 drops in Champion</div>
                <div className="text-gray-800 font-bold">1,980 drops in Challenger A (-30)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Performance & Cost Panel */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Telemetry & Computational Cost Panel</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Infrastructure metrics, latency overhead, false positive estimates, and compute costs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Champion Latency</span>
              <div className="text-xl font-bold text-gray-900 font-mono">512 ms</div>
              <span className="text-[11px] text-emerald-700 font-mono font-bold block">-24 ms vs platform avg</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">CPU Compute Cost</span>
              <div className="text-xl font-bold text-gray-900 font-mono">$12.40 / 100k</div>
              <span className="text-[11px] text-amber-700 font-mono font-bold block">+3.2% vs Champion</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">Data Transfer Payload</span>
              <div className="text-xl font-bold text-gray-900 font-mono">2.4 GB</div>
              <span className="text-[11px] text-gray-500 font-mono block">Stable throughput</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs text-gray-500 font-medium">False Positive Estimate</span>
              <div className="text-xl font-bold text-emerald-700 font-mono">1.8%</div>
              <span className="text-[11px] text-emerald-700 font-mono font-bold block">-0.4% Improvement</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Statistical Significance */}
      {activeTab === 'stat_sig' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Hypothesis Testing & Statistical Significance</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Rigorous A/B confidence interval and p-value validation for Challenger A vs Champion
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-emerald-700" />
                <span className="text-sm font-bold text-gray-900">Challenger A vs Champion Benchmark</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Statistically Significant (p &lt; 0.01)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs">
                <span className="text-gray-500 text-[10px] block font-sans">Conversion Uplift</span>
                <span className="text-emerald-700 font-bold text-base">+2.80%</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs">
                <span className="text-gray-500 text-[10px] block font-sans">p-Value</span>
                <span className="text-gray-900 font-bold text-base">0.004</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs">
                <span className="text-gray-500 text-[10px] block font-sans">95% Confidence Interval</span>
                <span className="text-blue-700 font-bold text-sm">[+1.1%, +4.5%]</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-xs">
                <span className="text-gray-500 text-[10px] block font-sans">Win Probability</span>
                <span className="text-emerald-700 font-bold text-base">94.2%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: AI Insights Panel */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" /> Automated AI Insights & Financial Projections
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Generative decision recommendations based on rule fallout and traffic simulation
            </p>
          </div>

          <div className="space-y-3">
            {AI_INSIGHTS.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    {insight.title}
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                    {insight.financialImpact}
                  </span>
                </div>
                <p className="text-xs text-gray-700">{insight.description}</p>
                <div className="text-[11px] font-mono text-blue-700 font-bold pt-1 border-t border-gray-200">
                  💡 Recommendation: {insight.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
