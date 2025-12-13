import React, { useState } from 'react';
import { HTSSignalCard } from './HTSSignalCard';
import { useHTSAnalysis } from '../../hooks/useHTSAnalysis';
import { RefreshCw, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface HTSAnalysisPanelProps {
  symbols?: string[];
  autoRefresh?: boolean;
}

/**
 * HTS Analysis Panel Component
 * Main UI panel for displaying HTS analysis results
 */
export function HTSAnalysisPanel({ 
  symbols = ['BTC', 'ETH', 'SOL', 'BNB'], 
  autoRefresh = true 
}: HTSAnalysisPanelProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(symbols);
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);

  // Use HTS analysis hook
  const { signals, loading, error, refresh, lastUpdate } = useHTSAnalysis(
    selectedSymbols,
    autoRefreshEnabled,
    30000 // 30 seconds refresh interval
  );

  // Available symbols
  const availableSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOT', 'MATIC', 'AVAX'];
  
  // Available timeframes
  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <h2 className="text-xl font-bold text-white">HTS Analysis</h2>
              <p className="text-sm text-slate-400">Hybrid Trading System - Multi-Indicator Analysis</p>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="text-xs text-slate-400">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Symbol Selector */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Symbols</label>
            <div className="flex flex-wrap gap-2">
              {availableSymbols.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => {
                    setSelectedSymbols(prev => 
                      prev.includes(symbol) 
                        ? prev.filter(s => s !== symbol)
                        : [...prev, symbol]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedSymbols.includes(symbol)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Selector */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Timeframe</label>
            <div className="flex gap-2">
              {timeframes.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeframe === tf.value
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Refresh Toggle */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Options</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  autoRefreshEnabled
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Activity size={14} className={autoRefreshEnabled ? 'animate-pulse' : ''} />
                Auto
              </button>
              
              <button
                onClick={refresh}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-50 text-xs font-bold transition-all"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {loading && (
        <div className="glass-card p-4 border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            <div>
              <div className="text-cyan-300 font-semibold">Analyzing Markets...</div>
              <div className="text-slate-400 text-sm">Fetching data and calculating signals</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-red-300 font-semibold">Analysis Error</div>
              <div className="text-slate-400 text-sm">{error.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!loading && !error && signals.length > 0 && (
        <div className="glass-card p-4 border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-green-300 font-semibold">Analysis Complete</div>
              <div className="text-slate-400 text-sm">
                Found {signals.length} signal{signals.length !== 1 ? 's' : ''} • 
                Top score: {signals[0]?.final_score.toFixed(0)} ({signals[0]?.action})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signals Grid */}
      {!loading && signals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.map((signal, index) => (
            <HTSSignalCard key={`${signal.symbol}-${index}`} signal={signal} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && signals.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-white mb-2">No Signals Yet</h3>
          <p className="text-slate-400">
            Select symbols and click Refresh to start analysis
          </p>
        </div>
      )}

      {/* Info Footer */}
      <div className="glass-card p-4 bg-blue-500/5 border border-blue-500/20">
        <div className="flex items-start gap-2 text-sm">
          <div className="text-blue-400 mt-0.5">ℹ️</div>
          <div>
            <div className="text-blue-300 font-semibold mb-1">About HTS Analysis</div>
            <div className="text-slate-300 text-xs space-y-1">
              <div>• Combines 5 analysis layers: Core Indicators, Smart Money Concepts, Patterns, Sentiment, and ML</div>
              <div>• Score above 70 = Strong signal • Score 50-70 = Moderate • Below 50 = Weak</div>
              <div>• Always verify signals with your own analysis before trading</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
