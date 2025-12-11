
import React from 'react';

export const LogViewer = () => {
  const logs = [
    { time: '10:42:15', level: 'INFO', module: 'Auth', message: 'User login successful: admin@crypto.one' },
    { time: '10:41:55', level: 'WARN', module: 'MarketData', message: 'Rate limit approaching for endpoint /api/coins/top' },
    { time: '10:40:22', level: 'INFO', module: 'OrderEngine', message: 'Limit order executed: BTC/USDT #88291' },
    { time: '10:38:05', level: 'ERROR', module: 'WebSocket', message: 'Connection lost. Reconnecting...' },
    { time: '10:38:06', level: 'INFO', module: 'WebSocket', message: 'Reconnected successfully.' },
  ];

  return (
    <div className="glass-card flex flex-col h-[500px]">
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <h3 className="font-bold text-white">System Logs</h3>
        <div className="flex gap-2">
           <input type="text" placeholder="Filter logs..." className="bg-slate-900/50 border border-white/10 rounded px-3 py-1 text-xs text-white outline-none focus:border-purple-500" />
           <button className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded text-slate-300">Export</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
         {logs.map((log, i) => (
           <div key={i} className="flex gap-4 p-2 hover:bg-white/5 rounded transition-colors">
              <span className="text-slate-500 w-20">{log.time}</span>
              <span className={`w-12 font-bold ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'}`}>
                {log.level}
              </span>
              <span className="text-purple-400 w-24">{log.module}</span>
              <span className="text-slate-300">{log.message}</span>
           </div>
         ))}
      </div>
    </div>
  );
};
