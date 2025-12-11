import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity, Settings, TrendingUp, AlertCircle, BarChart2, Target, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { strategyService, StrategyConfig, TradeSignal } from '../../services/strategyService';
import { tradingService, Position } from '../../services/tradingService';
import { marketService } from '../../services/marketService';
import { useApp } from '../../context/AppContext';

interface BotMetrics {
  trades: number;
  pnl: number;
  wins: number;
  losses: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
}

export const AutoTradingPanel = ({ symbol }: { symbol: string }) => {
  const { addToast } = useApp();
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<BotMetrics>({
    trades: 0,
    pnl: 0,
    wins: 0,
    losses: 0,
    avgWin: 0,
    avgLoss: 0,
    maxDrawdown: 0
  });
  const [currentPrice, setCurrentPrice] = useState(0);
  const [lastSignal, setLastSignal] = useState<TradeSignal | null>(null);
  const [openPosition, setOpenPosition] = useState<Position | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStrategies(strategyService.getStrategies());
  }, []);

  // Monitor current price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const rate = await marketService.getRate(`${symbol}/USDT`);
        if (rate && rate.price) {
          setCurrentPrice(rate.price);
        }
      } catch (e) {
        console.error('Failed to fetch price:', e);
      }
    };
    
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Check for open positions
  useEffect(() => {
    const checkPosition = async () => {
      const positions = await tradingService.getPositions();
      const pos = positions.find(p => p.symbol === symbol);
      setOpenPosition(pos || null);
    };
    
    checkPosition();
    const interval = setInterval(checkPosition, 2000);
    return () => clearInterval(interval);
  }, [symbol]);

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

  const startBot = async () => {
    if (!activeStrategy) return;

    setIsRunning(true);
    addToast(`Auto-Trading Bot activated on ${symbol}`, "success");
    addLog(`🤖 Bot started with strategy: ${activeStrategy.name}`);
    addLog(`📊 Monitoring ${symbol} - Target: $${activeStrategy.params.tradeAmount} per trade`);
    
    // Main trading loop
    intervalRef.current = setInterval(async () => {
      await executeTradingCycle();
    }, 10000); // Check every 10 seconds

    // Position monitoring loop (more frequent)
    positionCheckRef.current = setInterval(async () => {
      await monitorPositions();
    }, 5000); // Check every 5 seconds
  };

  const executeTradingCycle = async () => {
    if (!activeStrategy) return;

    try {
      // Evaluate strategy
      const signal: TradeSignal = await strategyService.evaluate(activeStrategy, symbol);
      setLastSignal(signal);

      if (signal.action === 'HOLD') {
        addLog(`⏸️ ${signal.reason || 'No trading signal'}`);
        return;
      }

      // Check if we already have a position
      const positions = await tradingService.getPositions();
      const existingPosition = positions.find(p => p.symbol === symbol);

      if (existingPosition) {
        addLog(`⚠️ Position already open for ${symbol}, skipping entry signal`);
        return;
      }

      // Check entry conditions
      const shouldEnter = await strategyService.checkEntryConditions(activeStrategy, symbol);
      
      if (!shouldEnter) {
        addLog(`❌ Entry conditions not met (confidence: ${signal.confidence}%)`);
        return;
      }

      // Calculate position size
      const balance = await tradingService.getBalance('USDT');
      const positionSize = strategyService.calculatePositionSize(
        activeStrategy,
        balance,
        signal.price || currentPrice
      );

      // Execute trade
      if (signal.action === 'BUY') {
        try {
          const order = await tradingService.placeOrder({
            symbol: `${symbol}/USDT`,
            side: 'buy',
            type: 'market',
            price: signal.price || currentPrice,
            amount: positionSize
          });

          addLog(`✅ BUY Order Filled: ${positionSize.toFixed(6)} ${symbol} @ $${(signal.price || currentPrice).toFixed(2)}`);
          addLog(`📈 Reason: ${signal.reason}`);
          
          // Set stop loss and take profit
          if (signal.stopLoss || signal.takeProfit) {
            await tradingService.updatePositionRisk(symbol, signal.stopLoss, signal.takeProfit);
            addLog(`🛡️ Risk management: SL=$${signal.stopLoss?.toFixed(2)} TP=$${signal.takeProfit?.toFixed(2)}`);
          }

          addToast(`BUY order executed: ${positionSize.toFixed(4)} ${symbol}`, "success");
          
          setMetrics(prev => ({
            ...prev,
            trades: prev.trades + 1
          }));

        } catch (e: any) {
          addLog(`❌ Order failed: ${e.message}`);
          addToast(e.message, "error");
        }
      }

    } catch (e: any) {
      addLog(`⚠️ Error in trading cycle: ${e.message}`);
      console.error('Trading cycle error:', e);
    }
  };

  const monitorPositions = async () => {
    if (!activeStrategy) return;

    try {
      const positions = await tradingService.getPositions();
      const position = positions.find(p => p.symbol === symbol);

      if (!position) return;

      // Calculate unrealized PnL
      const unrealizedPnL = (currentPrice - position.entryPrice) * position.amount;

      // Check exit conditions
      const exitCheck = await strategyService.checkExitConditions(
        activeStrategy,
        position,
        currentPrice
      );

      if (exitCheck.shouldExit) {
        try {
          const result = await tradingService.closePosition(symbol);
          
          if (result) {
            const isWin = result.pnl && result.pnl > 0;
            
            addLog(`${isWin ? '💰' : '📉'} Position closed: ${result.pnl >= 0 ? '+' : ''}${result.pnl.toFixed(2)} USDT`);
            addLog(`📊 Exit reason: ${exitCheck.reason}`);
            
            addToast(
              `Position closed: ${result.pnl >= 0 ? '+' : ''}${result.pnl.toFixed(2)} USDT`,
              isWin ? 'success' : 'error'
            );

            // Update metrics
            setMetrics(prev => {
              const newWins = isWin ? prev.wins + 1 : prev.wins;
              const newLosses = isWin ? prev.losses : prev.losses + 1;
              const newPnL = prev.pnl + result.pnl;
              
              return {
                ...prev,
                pnl: newPnL,
                wins: newWins,
                losses: newLosses,
                avgWin: newWins > 0 ? (prev.avgWin * prev.wins + (isWin ? result.pnl : 0)) / newWins : 0,
                avgLoss: newLosses > 0 ? (prev.avgLoss * prev.losses + (!isWin ? Math.abs(result.pnl) : 0)) / newLosses : 0,
                maxDrawdown: Math.min(prev.maxDrawdown, newPnL)
              };
            });
          }
        } catch (e: any) {
          addLog(`❌ Failed to close position: ${e.message}`);
        }
      } else {
        // Manage trailing stop
        await strategyService.manageRisk(position, currentPrice, activeStrategy);
      }

    } catch (e: any) {
      console.error('Position monitoring error:', e);
    }
  };

  const stopBot = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (positionCheckRef.current) clearInterval(positionCheckRef.current);
    
    setIsRunning(false);
    addToast("Auto-Trading Bot stopped", "info");
    addLog(`🛑 Bot stopped by user`);
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const resetMetrics = () => {
    setMetrics({
      trades: 0,
      pnl: 0,
      wins: 0,
      losses: 0,
      avgWin: 0,
      avgLoss: 0,
      maxDrawdown: 0
    });
    setLogs([]);
    addToast("Metrics reset", "info");
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (positionCheckRef.current) clearInterval(positionCheckRef.current);
    };
  }, []);

  const winRate = metrics.trades > 0 ? (metrics.wins / metrics.trades) * 100 : 0;
  const profitFactor = metrics.avgLoss > 0 ? metrics.avgWin / metrics.avgLoss : 0;

  return (
    <div className="glass-card flex flex-col h-full border-t-4 border-t-cyan-500 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Activity className="text-cyan-400" size={20} />
          Auto-Trading Bot
        </h3>
        <motion.div
          animate={{ scale: isRunning ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: isRunning ? Infinity : 0, duration: 2 }}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 ${
            isRunning ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
          {isRunning ? 'Active' : 'Inactive'}
        </motion.div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        {/* Strategy Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Strategy</label>
          <div className="relative">
            <select 
              value={activeStrategyId}
              onChange={(e) => setActiveStrategyId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm appearance-none outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Strategy...</option>
              {strategies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Settings className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          </div>
          
          {activeStrategy && (
            <div className="bg-slate-900/30 rounded-lg p-3 text-xs space-y-1">
              <p className="text-slate-400">{activeStrategy.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px]">
                  Risk: {activeStrategy.params.stopLossPercent}%
                </span>
                <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded text-[10px]">
                  Target: {activeStrategy.params.takeProfitPercent}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance</label>
            <button
              onClick={resetMetrics}
              className="text-[10px] text-slate-500 hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-lg p-2.5 text-center border border-white/5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Trades</div>
              <div className="font-mono font-bold text-white text-lg">{metrics.trades}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 text-center border border-white/5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">P&L</div>
              <div className={`font-mono font-bold text-lg ${metrics.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.pnl >= 0 ? '+' : ''}{metrics.pnl.toFixed(0)}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 text-center border border-white/5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Win Rate</div>
              <div className="font-mono font-bold text-cyan-400 text-lg">
                {winRate.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
              <div className="text-[9px] text-slate-500 uppercase">Wins/Losses</div>
              <div className="font-mono text-xs">
                <span className="text-green-400">{metrics.wins}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-red-400">{metrics.losses}</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
              <div className="text-[9px] text-slate-500 uppercase">Profit Factor</div>
              <div className="font-mono text-xs text-white">{profitFactor.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Current Signal */}
        {lastSignal && isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-3 border ${
              lastSignal.action === 'BUY' 
                ? 'bg-green-500/10 border-green-500/30' 
                : lastSignal.action === 'SELL'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-slate-500/10 border-slate-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Last Signal</span>
              <span className={`text-xs font-bold ${
                lastSignal.action === 'BUY' ? 'text-green-400' : 
                lastSignal.action === 'SELL' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {lastSignal.action}
              </span>
            </div>
            <p className="text-xs text-slate-300">{lastSignal.reason}</p>
            {lastSignal.confidence && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-black/20 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${lastSignal.confidence}%` }}
                  />
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">{lastSignal.confidence}%</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Open Position Display */}
        {openPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Open Position</span>
              <span className={`text-xs font-bold ${openPosition.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                {openPosition.side.toUpperCase()}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Entry:</span>
                <span className="text-white font-mono">${openPosition.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current:</span>
                <span className="text-white font-mono">${currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1">
                <span className="text-slate-400">Unrealized P&L:</span>
                <span className={`font-mono font-bold ${openPosition.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {openPosition.unrealizedPnL >= 0 ? '+' : ''}{openPosition.unrealizedPnL.toFixed(2)} USDT
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Activity Logs */}
        <div className="space-y-2 flex-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Log</label>
          <div className="bg-black/40 rounded-lg p-3 font-mono text-[10px] space-y-1 h-40 overflow-y-auto border border-white/5 custom-scrollbar">
            {logs.length === 0 && (
              <span className="text-slate-600 italic">System ready. Select a strategy and start trading.</span>
            )}
            <AnimatePresence initial={false}>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-slate-300 border-b border-white/5 pb-1 last:border-0 leading-relaxed"
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-2 shrink-0">
          <button
            onClick={toggleBot}
            disabled={!activeStrategyId}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRunning 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/30' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/30'
            }`}
          >
            {isRunning ? (
              <>
                <Square fill="currentColor" size={18} />
                <span>Stop Strategy</span>
              </>
            ) : (
              <>
                <Play fill="currentColor" size={18} />
                <span>Run Strategy</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-500 italic">
            {isRunning ? '⚠️ Bot is monitoring and will execute trades automatically' : 'Select a strategy and click Run to start'}
          </p>
        </div>
      </div>
    </div>
  );
};