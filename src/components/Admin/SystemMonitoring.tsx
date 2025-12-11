
import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Wifi } from 'lucide-react';

const MonitoringChart = ({ data, color }: { data: number[], color: string }) => (
  <div className="h-24 w-full flex items-end gap-1 mt-4">
    {data.map((val, i) => (
      <div 
        key={i} 
        className={`w-full rounded-t-sm opacity-50 ${color}`} 
        style={{ height: `${val}%` }} 
      />
    ))}
  </div>
);

const MetricCard = ({ title, value, unit, data, color, icon: Icon }: any) => (
  <div className="glass-card p-6">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="text-slate-400 text-sm font-medium uppercase">{title}</h4>
        <div className="text-2xl font-bold text-white mt-1">
          {value} <span className="text-sm text-slate-500">{unit}</span>
        </div>
      </div>
      <div className={`p-2 rounded-lg bg-white/5 ${color.replace('bg-', 'text-')}`}>
        <Icon size={20} />
      </div>
    </div>
    <MonitoringChart data={data} color={color} />
  </div>
);

export const SystemMonitoring = () => {
  const [metrics, setMetrics] = useState({
    cpu: [] as number[],
    memory: [] as number[],
    requests: [] as number[],
    db: [] as number[]
  });

  useEffect(() => {
    // Initialize data
    setMetrics({
      cpu: Array(20).fill(0).map(() => Math.random() * 40 + 10),
      memory: Array(20).fill(0).map(() => Math.random() * 30 + 40),
      requests: Array(20).fill(0).map(() => Math.random() * 60 + 20),
      db: Array(20).fill(0).map(() => Math.random() * 20 + 5),
    });

    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: [...prev.cpu.slice(1), Math.random() * 40 + 20],
        memory: [...prev.memory.slice(1), Math.random() * 30 + 45],
        requests: [...prev.requests.slice(1), Math.random() * 60 + 30],
        db: [...prev.db.slice(1), Math.random() * 20 + 10],
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="CPU Usage" 
          value={Math.round(metrics.cpu[metrics.cpu.length-1])} 
          unit="%" 
          data={metrics.cpu} 
          color="bg-purple-500"
          icon={Activity}
        />
        <MetricCard 
          title="Memory" 
          value={Math.round(metrics.memory[metrics.memory.length-1])} 
          unit="MB" 
          data={metrics.memory} 
          color="bg-cyan-500"
          icon={Server}
        />
        <MetricCard 
          title="Requests" 
          value={Math.round(metrics.requests[metrics.requests.length-1])} 
          unit="req/s" 
          data={metrics.requests} 
          color="bg-green-500"
          icon={Wifi}
        />
        <MetricCard 
          title="DB Latency" 
          value={Math.round(metrics.db[metrics.db.length-1])} 
          unit="ms" 
          data={metrics.db} 
          color="bg-orange-500"
          icon={Database}
        />
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Active Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white/5">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">admin@crypto.one</td>
                <td className="px-6 py-4 text-slate-400">192.168.1.42</td>
                <td className="px-6 py-4 text-slate-400">New York, US</td>
                <td className="px-6 py-4 text-slate-400">2h 15m</td>
                <td className="px-6 py-4"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">Active</span></td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">trader_pro</td>
                <td className="px-6 py-4 text-slate-400">10.0.0.15</td>
                <td className="px-6 py-4 text-slate-400">London, UK</td>
                <td className="px-6 py-4 text-slate-400">45m</td>
                <td className="px-6 py-4"><span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold">Idle</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
