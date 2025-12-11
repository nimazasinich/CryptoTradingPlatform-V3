import React from 'react';
import { StrategySelector } from '../components/Strategy/StrategySelector';
import { AutoTradeToggle } from '../components/Strategy/AutoTradeToggle';
import { SignalDisplay } from '../components/Strategy/SignalDisplay';
import { PerformanceMetrics } from '../components/Strategy/PerformanceMetrics';
import { Settings, Info, Target, Zap } from 'lucide-react';

export default function StrategyManager() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="text-4xl">🎯</span>
            Strategy Manager
          </h1>
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
        <AutoTradeToggle />
      </div>

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
