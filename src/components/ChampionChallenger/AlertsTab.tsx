import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Bell } from 'lucide-react';
import { CandidateModel } from './championChallengerMock';

interface AlertsTabProps {
  candidates?: CandidateModel[];
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ candidates = [] }) => {
  const alerts = [
    {
      id: 'alt-1',
      severity: 'high',
      title: 'Challenger C Over-rejection Alert (>20% drop rate)',
      message: 'Challenger C (Strict Risk Guardian v3.1) experienced an elevated fallout rate at Risk Evaluation.',
      timestamp: 'Aug 1, 10:25:00 AM',
    },
    {
      id: 'alt-2',
      severity: 'medium',
      title: 'Challenger E Latency Divergence (+18ms)',
      message: 'Graph Neural Net v1.0 average response time is +18ms higher than Champion baseline (42ms).',
      timestamp: 'Aug 1, 09:40:12 AM',
    },
    {
      id: 'alt-3',
      severity: 'info',
      title: 'Challenger A Statistical Win Confirmed (p=0.004)',
      message: 'Challenger A yields +2.8% conversion boost with 94.2% win probability over 100,000 requests.',
      timestamp: 'Aug 1, 08:00:00 AM',
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            <span>Champion-Challenger Active Alerts</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Automated degradation warnings and statistical divergence notifications across {candidates.length || 6} models
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono bg-red-50 text-red-700 border border-red-200 font-semibold">
          2 Unresolved Alerts
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            className={`p-4 rounded-xl border flex items-start gap-4 ${
              alt.severity === 'high'
                ? 'bg-red-50/60 border-red-200 text-red-900'
                : alt.severity === 'medium'
                ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                : 'bg-[#F0FDF4] border-emerald-200 text-emerald-900'
            }`}
          >
            {alt.severity === 'high' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            ) : alt.severity === 'medium' ? (
              <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900">{alt.title}</h4>
                <span className="text-[11px] font-mono text-gray-500">{alt.timestamp}</span>
              </div>
              <p className="text-xs text-gray-700 mt-1">{alt.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
