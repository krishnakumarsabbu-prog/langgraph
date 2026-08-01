import React from 'react';
import { FUNNEL_STAGES } from './championChallengerMock';

export const StepAnalysisTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-2">Step-by-Step Node Execution Comparison</h3>
        <p className="text-xs text-gray-500 mb-6">
          Detailed metrics for each stage in the LangGraph workflow pipeline comparing Champion vs Challenger.
        </p>

        <div className="space-y-4">
          {FUNNEL_STAGES.map((stage, idx) => (
            <div key={stage.id} className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-mono font-bold flex items-center justify-center text-xs border border-blue-200">
                    0{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{stage.stage_name}</h4>
                    <span className="text-xs text-gray-500 font-mono">{stage.node_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-gray-500">Champion Retention: </span>
                    <span className="text-blue-700 font-bold">
                      {stage.champion_out}/{stage.champion_in} ({((stage.champion_out / stage.champion_in) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Challenger Retention: </span>
                    <span className="text-emerald-700 font-bold">
                      {stage.challenger_out}/{stage.challenger_in} ({((stage.challenger_out / stage.challenger_in) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Comparison Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-blue-700 font-medium">
                    <span>Champion Flow</span>
                    <span>Drop Rate: {stage.champion_drop_pct}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                    <div
                      style={{ width: `${(stage.champion_out / stage.champion_in) * 100}%` }}
                      className="h-full bg-blue-600 rounded-full transition-all"
                    ></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-emerald-700 font-medium">
                    <span>Challenger Flow</span>
                    <span>Drop Rate: {stage.challenger_drop_pct}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                    <div
                      style={{ width: `${(stage.challenger_out / stage.challenger_in) * 100}%` }}
                      className="h-full bg-emerald-600 rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
