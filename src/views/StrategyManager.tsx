import React, { useState, useEffect } from 'react';
import { StrategySelector } from '../components/Strategy/StrategySelector';
import { AutoTradeToggle } from '../components/Strategy/AutoTradeToggle';
import { SignalDisplay } from '../components/Strategy/SignalDisplay';
import { PerformanceMetrics } from '../components/Strategy/PerformanceMetrics';
import { HTSAnalysisPanel } from '../components/Strategy/HTSAnalysisPanel';
import { Settings, Info, Target, Zap, Activity, BarChart3, TrendingUp, X } from 'lucide-react';
import { useScoringUpdates } from '../hooks/useWebSocket';
import { strategyService } from '../services/strategyService';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function StrategyManager() {
  const { addToast } = useApp();
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [scoringSnapshot, setScoringSnapshot] = useState<any>(null);
  const [isScoring, setIsScoring] = useState(false);
  
  // Feature 2.2: Backtesting state
  const [backtesting, setBacktesting] = useState(false);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [showBacktestModal, setShowBacktestModal] = useState(false);
  const [backtestSymbol, setBacktestSymbol] = useState('BTC');
  const [backtestPeriod, setBacktestPeriod] = useState(90); // days
  const [backtestBalance, setBacktestBalance] = useState(10000);
  const [showBacktestConfig, setShowBacktestConfig] = useState(false);
  
  // HTS Analysis state
  const [showHTSAnalysis, setShowHTSAnalysis] = useState(false);

  // Feature 1.1.4: Real-time scoring updates via WebSocket
  useScoringUpdates((data) => {
    try {
      if (data && autoTradeEnabled) {
        setScoringSnapshot(data);
        setIsScoring(true);
        // Remove scoring indicator after 2 seconds
        setTimeout(() => setIsScoring(false), 2000);
      }
    } catch (error) {
      console.error('Scoring update error:', error);
    }
  }, autoTradeEnabled);

  // Feature 2.2.1: Run backtest
  const handleBacktest = async (strategyId: string) => {
    setBacktesting(true);
    setShowBacktestConfig(false);
    
    try {
      addToast('Running backtest...', 'info', 2000);
      
      const strategies = strategyService.getStrategies();
      const strategy = strategies.find(s => s.id === strategyId);
      
      if (!strategy) {
        throw new Error('Strategy not found');
      }
      
      const startDate = new Date(Date.now() - backtestPeriod * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const results = await strategyService.backtest(
        strategy,
        backtestSymbol,
        startDate,
        endDate,
        backtestBalance
      );
      
      setBacktestResults(results);
      setShowBacktestModal(true);
      addToast('Backtest completed!', 'success', 3000);
    } catch (error: any) {
      addToast(`Backtest failed: ${error.message}`, 'error', 5000);
      console.error('Backtest error:', error);
    } finally {
      setBacktesting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🎯</span>
              Strategy Manager
            </h1>
            {autoTradeEnabled && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Activity size={14} className={isScoring ? 'animate-pulse text-purple-400' : 'text-purple-400'} />
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  {isScoring ? 'Scoring...' : 'Active'}
                </span>
              </div>
            )}
          </div>
          <p className="text-slate-300">
            Automated trading with DreamMaker multi-engine system
          </p>
        </div>
        
        <button className="glass-card p-3 hover:scale-[1.05] transition-all duration-300">
          <Settings className="w-6 h-6 text-slate-300" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-4 border border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-blue-300 font-semibold mb-1">DreamMaker Strategy System</h3>
            <p className="text-slate-300 text-sm">
              Combines 3 parallel signal engines with 14 detectors across multiple timeframes. 
              Features advanced risk management, confluence scoring, and dynamic leverage calculation.
            </p>
          </div>
        </div>
      </div>

      {/* HTS Strategy Toggle */}
      <div className="glass-card p-6 border-l-4 border-l-purple-500">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2 mb-1">
              <span className="text-2xl">🎯</span>
              HTS (Hybrid Trading System)
            </h3>
            <p className="text-slate-400 text-sm">
              Advanced multi-layer analysis combining technical indicators, Smart Money Concepts, and more
            </p>
          </div>
          <button
            onClick={() => setShowHTSAnalysis(!showHTSAnalysis)}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              showHTSAnalysis
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {showHTSAnalysis ? 'Hide HTS Analysis' : 'Show HTS Analysis'}
          </button>
        </div>

        {/* HTS Quick Stats */}
        {!showHTSAnalysis && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Analysis Layers</div>
              <div className="text-white font-bold">5</div>
              <div className="text-xs text-slate-500">Core, SMC, Patterns, Sentiment, ML</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Supported Symbols</div>
              <div className="text-white font-bold">8+</div>
              <div className="text-xs text-slate-500">BTC, ETH, SOL, BNB, and more</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Auto-Refresh</div>
              <div className="text-green-400 font-bold">30s</div>
              <div className="text-xs text-slate-500">Real-time signal updates</div>
            </div>
          </div>
        )}
      </div>

      {/* HTS Analysis Panel */}
      {showHTSAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <HTSAnalysisPanel 
            symbols={['BTC', 'ETH', 'SOL', 'BNB']} 
            autoRefresh={true}
          />
        </motion.div>
      )}

      {/* Strategy Selection */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Select Strategy
        </h2>
        <StrategySelector />
      </div>

      {/* Auto-Trade Toggle */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Trading Engine
        </h2>
        <AutoTradeToggle onStatusChange={setAutoTradeEnabled} />
      </div>

      {/* Real-time Scoring Snapshot */}
      {scoringSnapshot && autoTradeEnabled && (
        <div className="glass-card p-6 border-l-4 border-l-purple-500 animate-fade-in">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Live Scoring Snapshot
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-slate-400 text-sm mb-1">Symbol</div>
              <div className="text-white font-mono text-lg">{scoringSnapshot.symbol || 'BTC'}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-slate-400 text-sm mb-1">Confluence Score</div>
              <div className="text-white font-mono text-lg">{scoringSnapshot.confluence || '--'}%</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-slate-400 text-sm mb-1">Entry Price</div>
              <div className="text-white font-mono text-lg">
                ${(scoringSnapshot.entry_plan?.entry_price || 0).toLocaleString()}
              </div>
            </div>
          </div>
          {scoringSnapshot.timeframes && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {Object.entries(scoringSnapshot.timeframes).map(([tf, data]: [string, any]) => (
                <div key={tf} className="bg-black/20 p-3 rounded-lg">
                  <div className="text-slate-400 text-xs uppercase mb-1">{tf}</div>
                  <div className={`text-sm font-bold ${
                    data.trend === 'bullish' ? 'text-green-400' : 
                    data.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {data.trend || 'neutral'} ({data.score || 0})
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-xs text-slate-500">
            Last updated: {new Date(scoringSnapshot.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Feature 2.2: Strategy Backtesting Section */}
      <div className="glass-card p-6 border-l-4 border-l-cyan-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Strategy Backtesting
          </h3>
          <button
            onClick={() => setShowBacktestConfig(!showBacktestConfig)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            {showBacktestConfig ? 'Hide' : 'Show'} Config
          </button>
        </div>
        
        {showBacktestConfig && (
          <div className="bg-cyan-500/5 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Symbol</label>
                <select
                  value={backtestSymbol}
                  onChange={(e) => setBacktestSymbol(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="BTC">BTC/USDT</option>
                  <option value="ETH">ETH/USDT</option>
                  <option value="SOL">SOL/USDT</option>
                  <option value="BNB">BNB/USDT</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Period</label>
                <select
                  value={backtestPeriod}
                  onChange={(e) => setBacktestPeriod(parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="30">1 Month</option>
                  <option value="90">3 Months</option>
                  <option value="180">6 Months</option>
                  <option value="365">1 Year</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Starting Balance</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={backtestBalance}
                  onChange={(e) => setBacktestBalance(parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => handleBacktest('dreammaker')}
          disabled={backtesting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all"
        >
          {backtesting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running Backtest...
            </>
          ) : (
            <>
              <BarChart3 size={18} />
              Run Backtest on Selected Strategy
            </>
          )}
        </button>
      </div>

      {/* Feature 2.2.2: Backtest Results Modal */}
      <AnimatePresence>
        {showBacktestModal && backtestResults && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="text-cyan-400" />
                  Backtest Results
                </h2>
                <button
                  onClick={() => setShowBacktestModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="text-slate-300" size={20} />
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-slate-400 text-xs mb-1">Total P&L</div>
                  <div className={`text-2xl font-bold ${backtestResults.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${backtestResults.totalPnL?.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {((backtestResults.totalPnL / backtestBalance) * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-slate-400 text-xs mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {backtestResults.winRate?.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-slate-400 text-xs mb-1">Max Drawdown</div>
                  <div className="text-2xl font-bold text-red-400">
                    -{backtestResults.maxDrawdown?.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-slate-400 text-xs mb-1">Sharpe Ratio</div>
                  <div className="text-2xl font-bold text-white">
                    {backtestResults.sharpeRatio?.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Trade List */}
              <div>
                <h3 className="text-white font-bold mb-3">Trade History</h3>
                <div className="bg-white/5 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {backtestResults.trades && backtestResults.trades.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-400 border-b border-white/10">
                        <tr>
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">Action</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-right py-2">P&L</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300">
                        {backtestResults.trades.slice(0, 20).map((trade: any, idx: number) => (
                          <tr key={idx} className="border-b border-white/5">
                            <td className="py-2">{new Date(trade.date).toLocaleDateString()}</td>
                            <td className="py-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                trade.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {trade.action}
                              </span>
                            </td>
                            <td className="text-right py-2 font-mono">${trade.price?.toFixed(2)}</td>
                            <td className={`text-right py-2 font-mono ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-slate-500 py-8">No trades executed</div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowBacktestModal(false)}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">Performance Overview</h2>
        <PerformanceMetrics />
      </div>

      {/* Active Signals */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">Active Signals</h2>
        <SignalDisplay />
      </div>

      {/* System Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="text-white font-semibold mb-2">14 Detectors</h3>
          <p className="text-slate-300 text-sm">
            Core indicators, SMC, patterns, sentiment, and ML analysis
          </p>
        </div>
        
        <div className="glass-card p-5">
          <div className="text-2xl mb-2">⏱️</div>
          <h3 className="text-white font-semibold mb-2">Multi-Timeframe</h3>
          <p className="text-slate-300 text-sm">
            15min, 1hour, and 4hour synchronized analysis
          </p>
        </div>
        
        <div className="glass-card p-5">
          <div className="text-2xl mb-2">🛡️</div>
          <h3 className="text-white font-semibold mb-2">Risk Management</h3>
          <p className="text-slate-300 text-sm">
            Dynamic position sizing, cooldowns, and stop-loss automation
          </p>
        </div>
        
        <div className="glass-card p-5">
          <div className="text-2xl mb-2">📈</div>
          <h3 className="text-white font-semibold mb-2">5-Layer Validation</h3>
          <p className="text-slate-300 text-sm">
            Price action, indicators, timeframes, volume, and risk scoring
          </p>
        </div>
        
        <div className="glass-card p-5">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="text-white font-semibold mb-2">Confluence System</h3>
          <p className="text-slate-300 text-sm">
            AI, technical, and context signals must align for execution
          </p>
        </div>
        
        <div className="glass-card p-5">
          <div className="text-2xl mb-2">⚡</div>
          <h3 className="text-white font-semibold mb-2">Real-Time Execution</h3>
          <p className="text-slate-300 text-sm">
            Automated trade execution with trailing stops and position laddering
          </p>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          Current Configuration
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-300">Min Confidence:</span>
            <span className="text-white ml-2 font-mono">70%</span>
          </div>
          <div>
            <span className="text-slate-300">Confluence Threshold:</span>
            <span className="text-white ml-2 font-mono">60%</span>
          </div>
          <div>
            <span className="text-slate-300">Max Risk Per Trade:</span>
            <span className="text-white ml-2 font-mono">2%</span>
          </div>
          <div>
            <span className="text-slate-300">Max Open Positions:</span>
            <span className="text-white ml-2 font-mono">3</span>
          </div>
          <div>
            <span className="text-slate-300">Leverage Range:</span>
            <span className="text-white ml-2 font-mono">2x - 10x</span>
          </div>
          <div>
            <span className="text-slate-300">Stop Loss Mode:</span>
            <span className="text-white ml-2 font-mono">ATR-based</span>
          </div>
        </div>
      </div>
    </div>
  );
}
