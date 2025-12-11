import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { strategyService, StrategyConfig, TradeSignal } from '../../services/strategyService';
import { tradingService } from '../../services/tradingService';
import { useApp } from '../../context/AppContext';

export const AutoTradingPanel = ({ symbol }: { symbol: string }) => {
  const { addToast } = useApp();
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({ trades: 0, pnl: 0, wins: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStrategies(strategyService.getStrategies());
  }, []);

  const activeStrategy = strategies.find(s => s.id === activeStrategyId);

  const toggleBot = () => {
    if (isRunning) {
      stopBot();
    } else {
      if (!activeStrategyId) {
        addToast("Please select a strategy first", "warning");
        return;
      }
      startBot();
    }
  };

  const startBot = () => {
    setIsRunning(true);
    addToast(`Auto-Trading started on ${symbol}`, "success");
    addLog(`Bot started: ${activeStrategy?.name}`);
    
    intervalRef.current = setInterval(async () => {
      if (!activeStrategy) return;
      
      const signal: TradeSignal = await strategyService.evaluate(activeStrategy, symbol);
      
      if (signal.action !== 'HOLD') {
        try {
          // Execute Trade
          const trade = await tradingService.placeOrder({
            symbol,
            side: signal.action.toLowerCase() as 'buy' | 'sell',
            type: 'market',
            price: signal.price || 0,
            amount: (activeStrategy.params.tradeAmount || 100) / (signal.price || 1)
          });
          
          addLog(`${signal.action} Executed @ ${signal.price?.toFixed(2)} (${signal.reason})`);
          addToast(`${signal.action} Order Filled`, "success");
          
          setMetrics(prev => ({
            ...prev,
            trades: prev.trades + 1,
            // Mock PnL update
            pnl: prev.pnl + (Math.random() * 10 - 4),
            wins: Math.random() > 0.4 ? prev.wins + 1 : prev.wins
          }));

        } catch (e: any) {
          addLog(`Error: ${e.message}`);
        }
      }
    }, 5000); // Check every 5 seconds (Fast for demo)
  };

  const stopBot = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    addToast("Auto-Trading stopped", "info");
    addLog("Bot stopped by user");
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 10)]);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="glass-card flex flex-col h-full border-t-4 border-t-cyan-500">
      <div className="p-4 border-b border-white/5 bg-cyan-900/10 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Activity className="text-cyan-400" />
          Auto-Trading Bot
        </h3>
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
          {isRunning ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Strategy Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Strategy</label>
          <div className="relative">
            <select 
              value={activeStrategyId}
              onChange={(e) => setActiveStrategyId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            >
              <option value="">Select Strategy...</option>
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Settings className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-white/5 rounded-lg p-2 text-center">
             <div className="text-[10px] text-slate-500 uppercase">Trades</div>
             <div className="font-mono font-bold text-white">{metrics.trades}</div>
           </div>
           <div className="bg-white/5 rounded-lg p-2 text-center">
             <div className="text-[10px] text-slate-500 uppercase">P&L</div>
             <div className={`font-mono font-bold ${metrics.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
               {metrics.pnl >= 0 ? '+' : ''}{metrics.pnl.toFixed(2)}
             </div>
           </div>
           <div className="bg-white/5 rounded-lg p-2 text-center">
             <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
             <div className="font-mono font-bold text-cyan-400">
               {metrics.trades > 0 ? ((metrics.wins / metrics.trades) * 100).toFixed(0) : 0}%
             </div>
           </div>
        </div>

        {/* Logs Console */}
        <div className="flex-1 bg-black/40 rounded-lg p-3 font-mono text-[10px] space-y-1 h-32 overflow-y-auto border border-white/5">
           {logs.length === 0 && <span className="text-slate-600 italic">System ready. Select strategy to begin.</span>}
           {logs.map((log, i) => (
             <div key={i} className="text-slate-300 border-b border-white/5 pb-1 last:border-0">{log}</div>
           ))}
        </div>

        {/* Controls */}
        <button
          onClick={toggleBot}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
            isRunning 
              ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' 
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/20'
          }`}
        >
          {isRunning ? (
            <><Square fill="currentColor" size={18} /> Stop Strategy</>
          ) : (
            <><Play fill="currentColor" size={18} /> Run Strategy</>
          )}
        </button>
      </div>
    </div>
  );
};