import React from 'react';

export const PerformanceTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Champion P50 Latency</div>
          <p className="text-2xl font-bold text-blue-600 font-mono mt-1">456 ms</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Challenger P50 Latency</div>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">620 ms</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Champion P99 Latency</div>
          <p className="text-2xl font-bold text-blue-600 font-mono mt-1">530 ms</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Challenger P99 Latency</div>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">712 ms</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-2">Throughput & Memory Profiling</h3>
        <p className="text-xs text-gray-500 mb-6">
          System latency percentile distribution and memory footprint comparison.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <h4 className="font-bold text-blue-700 font-sans">Champion Performance Benchmarks</h4>
            <div className="flex justify-between text-gray-600">
              <span>Avg Node Duration:</span>
              <span className="text-gray-900 font-bold">102ms</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Peak Memory Usage:</span>
              <span className="text-gray-900 font-bold">142 MB</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>RPS Capacity:</span>
              <span className="text-gray-900 font-bold">450 req/sec</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <h4 className="font-bold text-emerald-700 font-sans">Challenger Performance Benchmarks</h4>
            <div className="flex justify-between text-gray-600">
              <span>Avg Node Duration:</span>
              <span className="text-gray-900 font-bold">135ms</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Peak Memory Usage:</span>
              <span className="text-gray-900 font-bold">188 MB</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>RPS Capacity:</span>
              <span className="text-gray-900 font-bold">310 req/sec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
