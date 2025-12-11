import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Zap, TrendingUp } from 'lucide-react';

interface MetricData {
  timestamp: number;
  value: number;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  apiLatency: number;
  requestRate: number;
}

const MiniChart = ({ data, color, label, unit }: { data: MetricData[], color: string, label: string, unit: string }) => {
  if (data.length === 0) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 200;
  const height = 60;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const latest = values[values.length - 1];

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">{label}</span>
        <span className="text-lg font-bold font-mono" style={{ color }}>
          {latest.toFixed(1)}{unit}
        </span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path 
          d={`M0,${height} L${points.split(' ').map((p, i) => {
            if (i === 0) return `M${p}`;
            return `L${p}`;
          }).join(' ')} L${width},${height} Z`}
          fill={`url(#gradient-${label})`}
        />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        
        {/* Current value indicator */}
        <circle 
          cx={width} 
          cy={height - ((latest - min) / range) * height} 
          r="3" 
          fill={color}
          className="animate-pulse"
        />
      </svg>
      
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>Min: {min.toFixed(1)}{unit}</span>
        <span>Max: {max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
};

const GaugeChart = ({ value, max, label, color }: { value: number, max: number, label: string, color: string }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono" style={{ color }}>{percentage.toFixed(0)}%</span>
          <span className="text-[10px] text-slate-500 uppercase">{label}</span>
        </div>
      </div>
      <div className="text-xs text-slate-300 mt-2 font-mono">
        {value.toFixed(1)} / {max} {label === 'CPU' ? 'cores' : 'GB'}
      </div>
    </div>
  );
};

export const PerformanceCharts = () => {
  const [cpuHistory, setCpuHistory] = useState<MetricData[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<MetricData[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<MetricData[]>([]);
  const [requestHistory, setRequestHistory] = useState<MetricData[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    apiLatency: 0,
    requestRate: 0
  });

  const MAX_POINTS = 60; // Keep last 60 data points

  const getSystemMetrics = (): SystemMetrics => {
    // Simulate realistic system metrics
    return {
      cpu: 15 + Math.random() * 25, // 15-40%
      memory: 40 + Math.random() * 20, // 40-60%
      apiLatency: 50 + Math.random() * 100, // 50-150ms
      requestRate: 10 + Math.random() * 40 // 10-50 req/s
    };
  };

  useEffect(() => {
    // Initial data
    const initialData = Array.from({ length: MAX_POINTS }, (_, i) => {
      const metrics = getSystemMetrics();
      const timestamp = Date.now() - (MAX_POINTS - i) * 1000;
      return {
        cpu: { timestamp, value: metrics.cpu },
        memory: { timestamp, value: metrics.memory },
        latency: { timestamp, value: metrics.apiLatency },
        requests: { timestamp, value: metrics.requestRate }
      };
    });

    setCpuHistory(initialData.map(d => d.cpu));
    setMemoryHistory(initialData.map(d => d.memory));
    setLatencyHistory(initialData.map(d => d.latency));
    setRequestHistory(initialData.map(d => d.requests));

    // Update every second
    const interval = setInterval(() => {
      const metrics = getSystemMetrics();
      const timestamp = Date.now();

      setCurrentMetrics(metrics);

      setCpuHistory(prev => [...prev.slice(-MAX_POINTS + 1), { timestamp, value: metrics.cpu }]);
      setMemoryHistory(prev => [...prev.slice(-MAX_POINTS + 1), { timestamp, value: metrics.memory }]);
      setLatencyHistory(prev => [...prev.slice(-MAX_POINTS + 1), { timestamp, value: metrics.apiLatency }]);
      setRequestHistory(prev => [...prev.slice(-MAX_POINTS + 1), { timestamp, value: metrics.requestRate }]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Real-time Gauges */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="text-cyan-400" size={20} />
          System Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GaugeChart 
            value={currentMetrics.cpu} 
            max={100} 
            label="CPU" 
            color="#3b82f6"
          />
          <GaugeChart 
            value={currentMetrics.memory} 
            max={100} 
            label="Memory" 
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Cpu className="text-blue-400" size={20} />
            </div>
            <h4 className="font-bold text-white">CPU Usage</h4>
          </div>
          <MiniChart 
            data={cpuHistory} 
            color="#3b82f6" 
            label="CPU" 
            unit="%"
          />
        </div>

        {/* Memory Usage */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <HardDrive className="text-purple-400" size={20} />
            </div>
            <h4 className="font-bold text-white">Memory Usage</h4>
          </div>
          <MiniChart 
            data={memoryHistory} 
            color="#8b5cf6" 
            label="Memory" 
            unit="%"
          />
        </div>

        {/* API Latency */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Zap className="text-green-400" size={20} />
            </div>
            <h4 className="font-bold text-white">API Latency</h4>
          </div>
          <MiniChart 
            data={latencyHistory} 
            color="#10b981" 
            label="Latency" 
            unit="ms"
          />
        </div>

        {/* Request Rate */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <TrendingUp className="text-cyan-400" size={20} />
            </div>
            <h4 className="font-bold text-white">Request Rate</h4>
          </div>
          <MiniChart 
            data={requestHistory} 
            color="#06b6d4" 
            label="Requests" 
            unit="/s"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="glass-card p-6">
        <h4 className="font-bold text-white mb-4">Current Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/5">
            <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">Avg CPU (1m)</div>
            <div className="text-xl font-bold font-mono text-blue-400">
              {(cpuHistory.slice(-60).reduce((sum, d) => sum + d.value, 0) / Math.min(60, cpuHistory.length)).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/5">
            <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">Avg Memory (1m)</div>
            <div className="text-xl font-bold font-mono text-purple-400">
              {(memoryHistory.slice(-60).reduce((sum, d) => sum + d.value, 0) / Math.min(60, memoryHistory.length)).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/5">
            <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">Avg Latency (1m)</div>
            <div className="text-xl font-bold font-mono text-green-400">
              {(latencyHistory.slice(-60).reduce((sum, d) => sum + d.value, 0) / Math.min(60, latencyHistory.length)).toFixed(0)}ms
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/5">
            <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">Total Requests (1m)</div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {(requestHistory.slice(-60).reduce((sum, d) => sum + d.value, 0)).toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
