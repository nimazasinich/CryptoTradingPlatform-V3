
import React, { useEffect, useState } from 'react';
import { Activity, Server, Database, Wifi } from 'lucide-react';
import { systemService } from '../../services/systemService';

const HealthIndicator = ({ label, status, ping, icon: Icon }: any) => (
  <div className="glass-card p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${status === 'healthy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-slate-500">{status === 'healthy' ? 'Operational' : 'Issues Detected'}</div>
      </div>
    </div>
    <div className="text-right">
       <div className={`text-sm font-mono ${ping < 100 ? 'text-green-400' : 'text-yellow-400'}`}>{ping}ms</div>
       <div className="text-[10px] text-slate-500">Latency</div>
    </div>
  </div>
);

export const SystemHealth = () => {
  const [health, setHealth] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
       try {
         const start = Date.now();
         // Feature 1.3.1 & 1.3.2: Use all three API methods
         const [healthData, statusData, providerData] = await Promise.all([
           systemService.getHealth(),
           systemService.getStatus(),
           systemService.getProviders()
         ]);
         const ping = Date.now() - start;
         
         setHealth({ ...healthData, ping });
         setSystemStatus(statusData);
         setProviders(providerData);
       } catch (e) {
         setHealth({ status: 'error', ping: 0 });
       }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Map providers to health indicators
  const indicators = [
    { 
      label: "API Gateway", 
      status: health?.status || 'checking', 
      ping: health?.ping || 0, 
      icon: Server 
    },
    ...providers.map((provider, idx) => ({
      label: provider.name,
      status: provider.status === 'operational' ? 'healthy' : 'error',
      ping: provider.latency || 0,
      icon: idx === 0 ? Activity : idx === 1 ? Database : Wifi
    }))
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       {indicators.slice(0, 4).map((indicator, idx) => (
         <HealthIndicator key={idx} {...indicator} />
       ))}
    </div>
  );
};
