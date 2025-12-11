
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Terminal, Monitor } from 'lucide-react';
import { SystemHealth } from '../components/Admin/SystemHealth';
import { LogViewer } from '../components/Admin/LogViewer';
import { SystemMonitoring } from '../components/Admin/SystemMonitoring';
import { PerformanceCharts } from '../components/Admin/PerformanceCharts';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('health');

  // Sync with URL if needed, similar to Settings
  useEffect(() => {
    const path = window.location.pathname.split('/').pop();
    if (path && ['health', 'monitoring', 'logs'].includes(path)) {
      setActiveTab(path);
    }
  }, []);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
       <div className="flex justify-between items-center">
         <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-2">
             <ShieldCheck className="text-red-500" />
             Admin Console
           </h1>
           <p className="text-slate-300">System monitoring and maintenance dashboard.</p>
         </div>
         
         <div className="flex bg-white/5 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('health')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'health' ? 'bg-purple-600 text-white' : 'text-slate-300'}`}
           >
             Health
           </button>
           <button 
             onClick={() => setActiveTab('monitoring')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'monitoring' ? 'bg-purple-600 text-white' : 'text-slate-300'}`}
           >
             Monitoring
           </button>
           <button 
             onClick={() => setActiveTab('logs')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-purple-600 text-white' : 'text-slate-300'}`}
           >
             Logs
           </button>
         </div>
       </div>

       {activeTab === 'health' && (
         <div className="space-y-6 animate-fade-in">
            <SystemHealth />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="glass-card p-6 h-64 flex flex-col items-center justify-center">
                  <Activity size={48} className="text-purple-500 mb-4" />
                  <div className="text-2xl font-bold text-white">99.98%</div>
                  <div className="text-sm text-slate-500">System Uptime (30d)</div>
               </div>
               <div className="glass-card p-6 h-64 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">45ms</div>
                  <div className="text-sm text-slate-500">Avg API Latency</div>
               </div>
            </div>
         </div>
       )}

       {activeTab === 'monitoring' && (
         <div className="animate-fade-in">
           <PerformanceCharts />
           <div className="mt-6">
             <SystemMonitoring />
           </div>
         </div>
       )}

       {activeTab === 'logs' && (
         <div className="animate-fade-in">
           <LogViewer />
         </div>
       )}
    </div>
  );
}
