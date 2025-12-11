---

## PHASE 9: CONFIGURATION SYSTEM (30 MINUTES)

### STEP 9.1: Create Configuration Files

**File**: `src/config/scoring.config.json`

```json
{
  "detectorWeights": {
    "rsi": 0.09,
    "macd": 0.09,
    "maCross": 0.09,
    "bollinger": 0.09,
    "volume": 0.07,
    "adx": 0.09,
    "roc": 0.05,
    "marketStructure": 0.05,
    "supportResistance": 0.09,
    "reversal": 0.08,
    "sentiment": 0.08,
    "news": 0.06,
    "whales": 0.02,
    "mlPrediction": 0.15
  },
  "thresholds": {
    "buyScore": 0.70,
    "sellScore": 0.30,
    "minConfidence": 0.70,
    "neutralEpsilon": 0.05
  }
}
```

**File**: `src/config/strategy.config.json`

```json
{
  "multiTimeframe": {
    "anyThreshold": 0.65,
    "majorityThreshold": 0.60
  },
  "confluence": {
    "required": true,
    "threshold": 0.60,
    "weights": {
      "ai": 0.5,
      "tech": 0.35,
      "context": 0.15
    }
  },
  "counterTrend": {
    "enabled": true,
    "requireAdjTFConfirm": true,
    "minConfluence": 0.70
  },
  "contextGating": {
    "badNewsHold": {
      "enabled": true,
      "newsThreshold": -0.35,
      "sentimentThreshold": -0.25
    },
    "shockReduction": {
      "enabled": true,
      "confluenceThreshold": 0.45,
      "leverageReduction": 0.30
    }
  },
  "futures": {
    "entryMode": "ATR",
    "atrMultiplier": 1.2,
    "riskRewardRatio": 2.0,
    "positionLadder": [0.4, 0.35, 0.25],
    "trailingStop": {
      "enabled": true,
      "startAt": "TP1",
      "atrMultiplier": 1.0
    }
  }
}
```

**File**: `src/config/risk.config.json`

```json
{
  "spot": {
    "maxPositionSize": 500,
    "maxDailyLoss": 150,
    "maxOpenPositions": 5,
    "maxRiskPerTrade": 2.5
  },
  "futures": {
    "maxPositionSize": 300,
    "maxDailyLoss": 100,
    "maxOpenPositions": 3,
    "maxRiskPerTrade": 2.0,
    "minLeverage": 2,
    "maxLeverage": 10,
    "liquidationBuffer": 0.35,
    "volatilityGate": {
      "enabled": true,
      "atrZScoreMax": 3.0,
      "leverageReduction": 0.30
    }
  },
  "cooldown": {
    "enabled": true,
    "afterConsecutiveSL": 2,
    "bars": 20,
    "barDurationMs": 900000
  }
}
```

### STEP 9.2: Create Config Manager

**File**: `src/engine/ConfigManager.ts`

```typescript
import scoringConfig from '@/config/scoring.config.json';
import strategyConfig from '@/config/strategy.config.json';
import riskConfig from '@/config/risk.config.json';

export class ConfigManager {
  private static instance: ConfigManager;
  private configs: Map<string, any> = new Map();
  private lastReload: number = Date.now();
  private reloadInterval: number = 30000; // 30 seconds
  
  private constructor() {
    this.loadConfigs();
    this.startAutoReload();
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  private loadConfigs() {
    this.configs.set('scoring', scoringConfig);
    this.configs.set('strategy', strategyConfig);
    this.configs.set('risk', riskConfig);
  }
  
  private startAutoReload() {
    setInterval(() => {
      this.loadConfigs();
      this.lastReload = Date.now();
      console.log('Configs reloaded at', new Date(this.lastReload).toISOString());
    }, this.reloadInterval);
  }
  
  get<T>(configName: string): T {
    return this.configs.get(configName) as T;
  }
  
  getDetectorWeights() {
    return this.get<typeof scoringConfig>('scoring').detectorWeights;
  }
  
  getStrategyConfig() {
    return this.get<typeof strategyConfig>('strategy');
  }
  
  getRiskConfig() {
    return this.get<typeof riskConfig>('risk');
  }
}
```

---

## PHASE 10: AUTO-TRADE SERVICE (1 HOUR)

### STEP 10.1: Create Auto-Trade Service

**File**: `src/services/autoTradeService.ts`

**Purpose**: Execute trades automatically based on signals

**Implementation**:
```typescript
import { SignalAggregator } from './strategy/SignalAggregator';
import { RiskManager } from './strategy/RiskManager';
import { AutoTradeState, Signal, Position, TradeResult } from '@/types/strategy';
import { marketDataService } from './marketDataService';

export class AutoTradeService {
  private static instance: AutoTradeService;
  private state: AutoTradeState;
  private signalAggregator: SignalAggregator;
  private riskManager: RiskManager;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.state = {
      enabled: false,
      activeSignals: [],
      openPositions: [],
      performance: this.initializePerformance(),
      lastUpdate: Date.now(),
      cooldownUntil: {}
    };
    
    this.signalAggregator = new SignalAggregator();
    this.riskManager = new RiskManager(/* config */);
  }
  
  static getInstance(): AutoTradeService {
    if (!AutoTradeService.instance) {
      AutoTradeService.instance = new AutoTradeService();
    }
    return AutoTradeService.instance;
  }
  
  async start(symbols: string[] = ['BTC/USDT', 'ETH/USDT']) {
    if (this.state.enabled) {
      console.log('Auto-trade already running');
      return;
    }
    
    this.state.enabled = true;
    console.log('🤖 Auto-trade started for:', symbols);
    
    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      for (const symbol of symbols) {
        await this.monitorSymbol(symbol);
      }
      
      // Update open positions
      await this.updateOpenPositions();
      
      this.state.lastUpdate = Date.now();
    }, 60000); // Check every 1 minute
  }
  
  stop() {
    if (!this.state.enabled) return;
    
    this.state.enabled = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('🛑 Auto-trade stopped');
  }
  
  private async monitorSymbol(symbol: string) {
    try {
      // Fetch candles for multiple timeframes
      const [candles15m, candles1h, candles4h] = await Promise.all([
        marketDataService.getCandles(symbol, '15m', 200),
        marketDataService.getCandles(symbol, '1h', 200),
        marketDataService.getCandles(symbol, '4h', 200)
      ]);
      
      // Generate signal
      const signal = await this.signalAggregator.generateCombinedSignal(
        symbol,
        candles15m,
        candles1h,
        candles4h
      );
      
      if (signal) {
        console.log('📊 Signal generated:', signal);
        
        // Add to active signals
        this.state.activeSignals.push(signal);
        
        // Execute trade (simulated or real)
        await this.executeSignal(signal);
      }
    } catch (error) {
      console.error(`Error monitoring ${symbol}:`, error);
    }
  }
  
  private async executeSignal(signal: Signal) {
    // This is where you would execute the actual trade
    // For now, we'll simulate it
    
    console.log('⚡ Executing signal:', signal.id);
    
    // Create position
    const position: Position = {
      id: `pos-${Date.now()}`,
      symbol: signal.symbol,
      side: signal.type === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice: signal.entry_price,
      amount: 100, // Calculate based on risk management
      leverage: 5,  // From entry plan
      stopLoss: signal.stop_loss,
      takeProfit: [signal.target_price],
      currentPnl: 0,
      openedAt: Date.now()
    };
    
    this.state.openPositions.push(position);
    this.riskManager.addPosition(position);
    
    // In production: Call exchange API to place order
    // await exchangeAPI.placeOrder({ ... });
  }
  
  private async updateOpenPositions() {
    for (const position of this.state.openPositions) {
      try {
        // Fetch current price
        const currentPrice = await marketDataService.getCurrentPrice(position.symbol);
        
        // Calculate P&L
        const pnl = this.calculatePnl(position, currentPrice);
        position.currentPnl = pnl;
        
        // Check exit conditions
        if (this.shouldExitPosition(position, currentPrice)) {
          await this.exitPosition(position, currentPrice);
        }
      } catch (error) {
        console.error(`Error updating position ${position.id}:`, error);
      }
    }
  }
  
  private calculatePnl(position: Position, currentPrice: number): number {
    const priceChange = position.side === 'LONG'
      ? (currentPrice - position.entryPrice) / position.entryPrice
      : (position.entryPrice - currentPrice) / position.entryPrice;
    
    return position.amount * priceChange * position.leverage;
  }
  
  private shouldExitPosition(position: Position, currentPrice: number): boolean {
    // Check stop loss
    if (position.side === 'LONG' && currentPrice <= position.stopLoss) return true;
    if (position.side === 'SHORT' && currentPrice >= position.stopLoss) return true;
    
    // Check take profit
    for (const tp of position.takeProfit) {
      if (position.side === 'LONG' && currentPrice >= tp) return true;
      if (position.side === 'SHORT' && currentPrice <= tp) return true;
    }
    
    return false;
  }
  
  private async exitPosition(position: Position, exitPrice: number) {
    console.log('🚪 Exiting position:', position.id);
    
    // Calculate final P&L
    const finalPnl = this.calculatePnl(position, exitPrice);
    
    // Create trade result
    const result: TradeResult = {
      id: `trade-${Date.now()}`,
      signal: this.findSignalForPosition(position),
      entryPrice: position.entryPrice,
      exitPrice,
      pnl: finalPnl,
      pnlPercent: (finalPnl / position.amount) * 100,
      duration: Date.now() - position.openedAt,
      status: finalPnl > 0 ? 'WIN' : finalPnl < 0 ? 'LOSS' : 'BREAKEVEN',
      timestamp: Date.now()
    };
    
    // Record trade
    this.riskManager.recordTrade(result);
    
    // Update performance
    this.updatePerformance(result);
    
    // Remove position
    this.state.openPositions = this.state.openPositions.filter(p => p.id !== position.id);
    this.riskManager.removePosition(position.id);
    
    // In production: Close position on exchange
    // await exchangeAPI.closePosition(position.id);
  }
  
  private updatePerformance(result: TradeResult) {
    const perf = this.state.performance;
    
    perf.totalTrades++;
    if (result.status === 'WIN') perf.winningTrades++;
    if (result.status === 'LOSS') perf.losingTrades++;
    
    perf.winRate = perf.totalTrades > 0 
      ? (perf.winningTrades / perf.totalTrades) * 100 
      : 0;
    
    perf.totalPnl += result.pnl;
    
    if (result.status === 'WIN') {
      perf.avgWin = perf.winningTrades > 0
        ? (perf.avgWin * (perf.winningTrades - 1) + result.pnl) / perf.winningTrades
        : result.pnl;
    }
    
    if (result.status === 'LOSS') {
      perf.avgLoss = perf.losingTrades > 0
        ? (perf.avgLoss * (perf.losingTrades - 1) + Math.abs(result.pnl)) / perf.losingTrades
        : Math.abs(result.pnl);
    }
    
    perf.profitFactor = perf.avgLoss > 0 ? perf.avgWin / perf.avgLoss : 0;
  }
  
  private findSignalForPosition(position: Position): Signal {
    // Find the signal that created this position
    return this.state.activeSignals.find(s => s.symbol === position.symbol) || {
      id: 'unknown',
      symbol: position.symbol,
      type: position.side === 'LONG' ? 'BUY' : 'SELL',
      entry_price: position.entryPrice,
      stop_loss: position.stopLoss,
      target_price: position.takeProfit[0],
      confidence: 0.5,
      reasoning: 'No signal found',
      timestamp: new Date().toISOString()
    };
  }
  
  private initializePerformance() {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    };
  }
  
  getState(): AutoTradeState {
    return { ...this.state };
  }
  
  isEnabled(): boolean {
    return this.state.enabled;
  }
}

// Export singleton instance
export const autoTradeService = AutoTradeService.getInstance();
```

---

## PHASE 11: UI COMPONENTS (2 HOURS)

### STEP 11.1: Create Strategy Selector Component

**File**: `src/components/Strategy/StrategySelector.tsx`

**Purpose**: Elegant dropdown to select trading strategy

**Implementation**:
```typescript
import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const strategies: Strategy[] = [
  {
    id: 'dreammaker',
    name: 'DreamMaker Multi-Engine',
    description: '3 parallel engines with 14 detectors (Recommended)',
    icon: '🎯'
  },
  {
    id: 'advanced',
    name: 'Advanced 5-Layer',
    description: 'Extreme selectivity with mathematical scoring',
    icon: '⭐'
  },
  {
    id: 'confluence',
    name: 'Multi-Timeframe Confluence',
    description: '15m/1h/4h analysis with convergence',
    icon: '📊'
  }
];

export function StrategySelector() {
  const [selectedId, setSelectedId] = useState('dreammaker');
  const [isOpen, setIsOpen] = useState(false);
  
  const selected = strategies.find(s => s.id === selectedId)!;
  
  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card p-4 flex items-center justify-between hover:scale-[1.02] transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{selected.icon}</span>
          <div className="text-left">
            <div className="text-white font-semibold">{selected.name}</div>
            <div className="text-slate-300 text-sm">{selected.description}</div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 animate-fadeIn">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => {
                setSelectedId(strategy.id);
                setIsOpen(false);
              }}
              className="w-full p-3 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center gap-3"
            >
              <span className="text-2xl">{strategy.icon}</span>
              <div className="flex-1 text-left">
                <div className="text-white font-medium">{strategy.name}</div>
                <div className="text-slate-400 text-xs">{strategy.description}</div>
              </div>
              {strategy.id === selectedId && (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### STEP 11.2: Create Auto-Trade Toggle Component

**File**: `src/components/Strategy/AutoTradeToggle.tsx`

**Purpose**: Beautiful on/off switch with status indicator

**Implementation**:
```typescript
import React, { useState, useEffect } from 'react';
import { Power, Activity, AlertCircle } from 'lucide-react';
import { autoTradeService } from '@/services/autoTradeService';

export function AutoTradeToggle() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<'idle' | 'active' | 'error'>('idle');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const state = autoTradeService.getState();
      setEnabled(state.enabled);
      setStatus(state.enabled ? 'active' : 'idle');
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleToggle = async () => {
    try {
      if (enabled) {
        autoTradeService.stop();
      } else {
        await autoTradeService.start();
      }
    } catch (error) {
      console.error('Toggle error:', error);
      setStatus('error');
    }
  };
  
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Power className="w-5 h-5" />
            Auto-Trade Engine
          </h3>
          <p className="text-slate-300 text-sm mt-1">
            {enabled ? 'Trading actively' : 'Idle - manual mode'}
          </p>
        </div>
        
        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          className={`relative w-16 h-9 rounded-full transition-all duration-300 ${
            enabled 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50' 
              : 'bg-slate-700'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform duration-300 ${
              enabled ? 'translate-x-7' : ''
            }`}
          />
        </button>
      </div>
      
      {/* Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {status === 'active' && (
          <>
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-green-400">Monitoring markets...</span>
          </>
        )}
        {status === 'idle' && (
          <>
            <div className="w-4 h-4 rounded-full bg-slate-500" />
            <span className="text-slate-400">Standby</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-400">Error - check logs</span>
          </>
        )}
      </div>
    </div>
  );
}
```

### STEP 11.3: Create Signal Display Component

**File**: `src/components/Strategy/SignalDisplay.tsx`

**Purpose**: Show live signals with confidence and details

**Implementation**:
```typescript
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';
import { autoTradeService } from '@/services/autoTradeService';
import { Signal } from '@/types/strategy';

export function SignalDisplay() {
  const [signals, setSignals] = useState<Signal[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const state = autoTradeService.getState();
      setSignals(state.activeSignals.slice(-5)); // Last 5 signals
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (signals.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Target className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400">No active signals</p>
        <p className="text-slate-500 text-sm mt-1">
          Waiting for high-quality opportunities...
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="glass-card p-5 hover:scale-[1.01] transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {signal.type === 'BUY' ? (
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
              )}
              <div>
                <div className="text-white font-semibold">{signal.symbol}</div>
                <div className="text-slate-400 text-sm">
                  {new Date(signal.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            {/* Confidence Badge */}
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              signal.confidence >= 0.8 
                ? 'bg-green-500/20 text-green-400'
                : signal.confidence >= 0.7
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-slate-500/20 text-slate-400'
            }`}>
              {(signal.confidence * 100).toFixed(0)}% Confidence
            </div>
          </div>
          
          {/* Price Levels */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Entry</div>
              <div className="text-white font-mono">${signal.entry_price.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Target</div>
              <div className="text-green-400 font-mono">${signal.target_price.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Stop Loss</div>
              <div className="text-red-400 font-mono">${signal.stop_loss.toFixed(2)}</div>
            </div>
          </div>
          
          {/* Reasoning */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-slate-300 text-sm flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{signal.reasoning}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### STEP 11.4: Create Performance Metrics Component

**File**: `src/components/Strategy/PerformanceMetrics.tsx`

**Implementation**:
```typescript
import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, DollarSign, Percent } from 'lucide-react';
import { autoTradeService } from '@/services/autoTradeService';
import { PerformanceMetrics } from '@/types/strategy';

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const state = autoTradeService.getState();
      setMetrics(state.performance);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!metrics) return null;
  
  const statCards = [
    {
      icon: Target,
      label: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      color: metrics.winRate >= 60 ? 'green' : metrics.winRate >= 50 ? 'yellow' : 'red'
    },
    {
      icon: DollarSign,
      label: 'Total P&L',
      value: `${metrics.totalPnl.toFixed(2)}`,
      color: metrics.totalPnl >= 0 ? 'green' : 'red'
    },
    {
      icon: TrendingUp,
      label: 'Profit Factor',
      value: metrics.profitFactor.toFixed(2),
      color: metrics.profitFactor >= 2 ? 'green' : metrics.profitFactor >= 1 ? 'yellow' : 'red'
    },
    {
      icon: Percent,
      label: 'Trades',
      value: `${metrics.totalTrades}`,
      color: 'purple'
    }
  ];
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => (
        <div
          key={idx}
          className="glass-card p-5 hover:scale-[1.02] transition-all duration-300"
        >
          <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
            <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
          </div>
          <div className="text-slate-400 text-sm mb-1">{stat.label}</div>
          <div className={`text-2xl font-bold text-${stat.color}-400`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## PHASE 12: MAIN STRATEGY MANAGER PAGE (1 HOUR)

### STEP 12.1: Create Strategy Manager View

**File**: `src/views/StrategyManager.tsx`

**Purpose**: Main page that combines all strategy components

**Implementation**:
```typescript
import React from 'react';
import { StrategySelector } from '@/components/Strategy/StrategySelector';
import { AutoTradeToggle } from '@/components/Strategy/AutoTradeToggle';
import { SignalDisplay } from '@/components/Strategy/SignalDisplay';
import { PerformanceMetrics } from '@/components/Strategy/PerformanceMetrics';
import { Settings, Info } from 'lucide-react';

export function StrategyManager() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            🎯 Strategy Manager
          </h1>
          <p className="text-slate-300">
            Automated trading with DreamMaker multi-engine system
          </p>
        </div>
        
        <button className="glass-card p-3 hover:scale-[1.05] transition-all# DREAMMAKER AUTO-TRADING STRATEGY IMPLEMENTATION GUIDE

## YOUR MISSION
You are tasked with implementing a sophisticated auto-trading strategy system into the existing CryptoOne Trading Platform. This system includes three parallel signal engines, 14 detectors, multi-timeframe analysis, and comprehensive risk management. You will integrate this seamlessly into the existing codebase without breaking any current functionality.

---

## REFERENCE DOCUMENTS
You have been provided with:
1. **realendpoint.txt** - API endpoints for data fetching
2. **AI_STUDIO_BUILD_GUIDE_v2.txt** - Project structure and design system
3. **DreamMaker Strategy Summary** (Persian) - High-level overview
4. **Signal Generation Report** (English) - Complete technical specification

**Use documents #3 and #4 as your PRIMARY reference for implementing the strategy system.**

---

## CRITICAL RULES - READ FIRST

### ✅ MANDATORY REQUIREMENTS:
- **CREATE BACKUP BEFORE STARTING** - This is NOT optional
- Write COMPLETE, PRODUCTION-READY code (NO placeholders, NO pseudo code)
- Maintain existing application functionality (ZERO breaking changes)
- Follow existing design system (glassmorphic, purple gradients, smooth animations)
- Integrate with existing API service layer (`src/services/`)
- Use existing TypeScript types and extend as needed
- Test each component thoroughly before moving to next
- Ensure all new features are accessible from existing navigation
- Maintain responsive design on all screen sizes

### ❌ ABSOLUTE PROHIBITIONS:
- NO pseudo code like "// TODO: implement signal generation"
- NO placeholder functions that return mock data
- NO breaking existing routes, components, or services
- NO removing existing functionality to make room for new features
- NO hardcoded API keys or sensitive data
- NO ignoring TypeScript errors
- NO skipping error handling
- NO missing edge cases

---

## PHASE 0: PREPARATION & BACKUP (CRITICAL - 10 MINUTES)

### STEP 0.1: Create Complete Backup
```bash
# Create a backup branch
git add .
git commit -m "Backup before DreamMaker strategy implementation"
git branch backup-before-dreammaker-$(date +%Y%m%d-%H%M%S)

# Tag the current state
git tag pre-dreammaker-implementation

# Verify backup created
git branch | grep backup
git tag | grep pre-dreammaker
```

### STEP 0.2: Document Current State
```bash
# Create a snapshot document
cat > implementation-snapshot.md << 'EOF'
# Pre-Implementation Snapshot

## Date: $(date)

## Current Routes Working:
- [ ] Dashboard
- [ ] Market Analysis
- [ ] Trading Hub
- [ ] AI Lab
- [ ] Risk Management
- [ ] Settings
- [ ] Admin

## Current Features Working:
- [ ] Sidebar navigation
- [ ] Price ticker
- [ ] Market overview
- [ ] News feed
- [ ] Sentiment gauge
- [ ] All forms and inputs

## Dependencies Installed:
$(npm list --depth=0)

## Build Status:
$(npm run build 2>&1 | tail -5)

## TypeScript Status:
$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l) errors
EOF

# Fill this out manually before proceeding
```

### STEP 0.3: Verify Project Health
```bash
# Ensure project builds successfully
npm run build

# Ensure TypeScript compiles
npx tsc --noEmit

# Ensure dev server starts
npm run dev &
sleep 5
curl http://localhost:5173
kill %1

# If ANY of the above fail, DO NOT PROCEED
# Fix existing issues first
```

---

## PHASE 1: ARCHITECTURE PLANNING (15 MINUTES)

### STEP 1.1: Understand Existing Structure

**Current Project Structure** (from AI_STUDIO_BUILD_GUIDE):
```
src/
├── components/
│   ├── Sidebar/
│   ├── Dashboard/
│   └── Trading/
├── views/
│   ├── Dashboard.tsx
│   ├── MarketAnalysis.tsx
│   ├── TradingHub.tsx
│   ├── AILab.tsx
│   └── ...
├── services/
│   ├── marketDataService.ts
│   ├── aiService.ts
│   └── ...
├── types/
│   └── index.ts
└── config/
    └── api.ts
```

### STEP 1.2: Plan New Structure

**New Components to Add**:
```
src/
├── components/
│   └── Strategy/                    [NEW]
│       ├── StrategySelector.tsx     [NEW] - Strategy selection UI
│       ├── AutoTradeToggle.tsx      [NEW] - On/Off switch with status
│       ├── StrategyConfig.tsx       [NEW] - Configuration panel
│       ├── SignalDisplay.tsx        [NEW] - Live signals display
│       └── PerformanceMetrics.tsx   [NEW] - Win rate, P&L stats
│
├── views/
│   └── StrategyManager.tsx          [NEW] - Main strategy page
│
├── services/
│   ├── strategy/                    [NEW FOLDER]
│   │   ├── AdvancedSignalEngine.ts  [NEW] - 5-layer validation
│   │   ├── StrategyEngine.ts        [NEW] - Multi-timeframe analysis
│   │   ├── DetectorRegistry.ts      [NEW] - 14 detector system
│   │   ├── FeatureExtractor.ts      [NEW] - Technical indicators
│   │   ├── RiskManager.ts           [NEW] - Position sizing & leverage
│   │   └── SignalAggregator.ts      [NEW] - Combine all engines
│   │
│   └── autoTradeService.ts          [NEW] - Auto-trade execution
│
├── engine/                          [NEW FOLDER]
│   ├── detectors/                   [NEW FOLDER]
│   │   ├── CoreDetectors.ts         [NEW] - RSI, MACD, MA, etc.
│   │   ├── SMCDetectors.ts          [NEW] - Smart Money Concepts
│   │   ├── PatternDetectors.ts      [NEW] - Elliott, Harmonic, etc.
│   │   ├── SentimentDetectors.ts    [NEW] - Fear/Greed, News, Whales
│   │   └── MLDetector.ts            [NEW] - Machine learning
│   │
│   ├── ScoreAggregator.ts           [NEW] - Category scoring
│   └── ConfigManager.ts             [NEW] - Hot-reload configs
│
├── types/
│   └── strategy.ts                  [NEW] - All strategy types
│
└── config/
    ├── scoring.config.json          [NEW] - Detector weights
    ├── strategy.config.json         [NEW] - Strategy parameters
    └── risk.config.json             [NEW] - Risk limits
```

**Integration Points**:
1. Add new route to `App.tsx`: `/strategy-manager`
2. Add new menu item to `Sidebar.tsx`: "🎯 Strategies"
3. Extend `types/index.ts` with strategy types
4. Connect to existing `marketDataService.ts` for OHLCV data
5. Use existing `apiService.ts` for external API calls

---

## PHASE 2: TYPE DEFINITIONS (30 MINUTES)

### STEP 2.1: Create Strategy Types File

**File**: `src/types/strategy.ts`

**Instructions**:
Create a NEW file with ALL type definitions needed for the strategy system. Reference the Signal Generation Report (document #4) for exact property names and types.

**Required Interfaces** (implement ALL of these):

```typescript
// ============= CORE TYPES =============

export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type StrategyMode = 'FIXED' | 'ATR' | 'STRUCT';
export type Timeframe = '15m' | '1h' | '4h';

// ============= CANDLE DATA =============

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============= SIGNAL STRUCTURES =============

export interface Signal {
  id: string;
  symbol: string;
  type: SignalType;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export interface AdvancedSignal extends Signal {
  score: {
    layer1_priceAction: number;      // 0-30
    layer2_indicators: number;        // 0-25
    layer3_timeframes: number;        // 0-20
    layer4_volume: number;            // 0-15
    layer5_riskManagement: number;    // 0-10
    totalScore: number;               // 0-100
    isValid: boolean;
  };
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  timeframe: string;
  contributingFactors: string[];
}

// ============= DETECTOR SYSTEM =============

export interface DetectorResult {
  name: string;
  score: number;        // [-1, +1]
  weight: number;
  category: 'CORE' | 'SMC' | 'PATTERNS' | 'SENTIMENT' | 'ML';
  description: string;
}

export interface TimeframeResult {
  timeframe: Timeframe;
  score: number;        // [0, 1]
  direction: TrendDirection;
  detectors: DetectorResult[];
  normalized: number;   // [-1, +1]
}

// ============= STRATEGY OUTPUT =============

export interface StrategyOutput {
  symbol: string;
  results: TimeframeResult[];
  direction: TrendDirection;
  final_score: number;
  action: SignalType;
  rationale: string;
  confluence: ConfluenceScore;
  entryPlan: EntryPlan;
  context: MarketContext;
  timestamp: number;
}

export interface ConfluenceScore {
  enabled: boolean;
  score: number;
  agreement: number;
  ai: number;
  tech: number;
  context: number;
  passed: boolean;
}

export interface EntryPlan {
  mode: StrategyMode;
  sl: number;
  tp: [number, number, number];
  ladder: [number, number, number];
  trailing: TrailingStop;
  leverage: number;
}

export interface TrailingStop {
  enabled: boolean;
  startAt: 'TP1' | 'TP2' | 'ENTRY';
  distance: number;
}

export interface MarketContext {
  sentiment01: number;
  news01: number;
  whales01: number;
}

// ============= TECHNICAL FEATURES =============

export interface TechnicalFeatures {
  // Price action
  trend: TrendDirection;
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
  
  // Indicators
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  adx: number;
  stochastic: { k: number; d: number };
  roc: number;
  
  // Volume
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  
  // Support/Resistance
  support: number;
  resistance: number;
}

// ============= CONFIGURATION =============

export interface StrategyConfig {
  enabled: boolean;
  selectedStrategy: string;
  autoTradeEnabled: boolean;
  
  // Scoring
  buyThreshold: number;
  sellThreshold: number;
  minConfidence: number;
  
  // Risk
  maxPositionSize: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  maxRiskPerTrade: number;
  
  // Leverage
  minLeverage: number;
  maxLeverage: number;
  liquidationBuffer: number;
  
  // Confluence
  confluenceRequired: boolean;
  confluenceThreshold: number;
  
  // Cooldown
  cooldownEnabled: boolean;
  cooldownBars: number;
  consecutiveSLTrigger: number;
}

export interface DetectorWeights {
  // Core (40%)
  rsi: number;
  macd: number;
  maCross: number;
  bollinger: number;
  volume: number;
  adx: number;
  roc: number;
  
  // SMC (25%)
  marketStructure: number;
  supportResistance: number;
  
  // Patterns (20%)
  reversal: number;
  
  // Sentiment (10%)
  sentiment: number;
  news: number;
  whales: number;
  
  // ML (5%)
  mlPrediction: number;
}

export interface RiskConfig {
  spot: {
    maxPositionSize: number;
    maxDailyLoss: number;
    maxOpenPositions: number;
    maxRiskPerTrade: number;
  };
  futures: {
    maxPositionSize: number;
    maxDailyLoss: number;
    maxOpenPositions: number;
    maxRiskPerTrade: number;
    minLeverage: number;
    maxLeverage: number;
  };
}

// ============= PERFORMANCE TRACKING =============

export interface TradeResult {
  id: string;
  signal: Signal;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  duration: number;
  status: 'WIN' | 'LOSS' | 'BREAKEVEN';
  timestamp: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

// ============= AUTO-TRADE STATE =============

export interface AutoTradeState {
  enabled: boolean;
  activeSignals: Signal[];
  openPositions: Position[];
  performance: PerformanceMetrics;
  lastUpdate: number;
  cooldownUntil: Record<string, number>;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  amount: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number[];
  currentPnl: number;
  openedAt: number;
}
```

**Verification**:
- [ ] All interfaces defined
- [ ] No TypeScript errors
- [ ] Exported properly
- [ ] Can import in other files

---

## PHASE 3: FEATURE EXTRACTION & INDICATORS (45 MINUTES)

### STEP 3.1: Create Feature Extractor

**File**: `src/services/strategy/FeatureExtractor.ts`

**Purpose**: Calculate all technical indicators from OHLCV candle data

**Instructions**:
Implement a class that takes an array of `Candle` objects and returns `TechnicalFeatures`. This must include:

1. **Trend Detection**:
   - Identify higher highs, higher lows, lower highs, lower lows
   - Determine overall trend direction

2. **Technical Indicators** (MUST implement all):
   - RSI (14 period)
   - MACD (12, 26, 9)
   - SMA (20, 50)
   - EMA (12, 26)
   - Bollinger Bands (20, 2)
   - ATR (14)
   - ADX (14)
   - Stochastic (14, 3)
   - ROC (12)

3. **Volume Analysis**:
   - Current volume
   - Average volume (20 periods)
   - Volume ratio

4. **Support/Resistance**:
   - Find recent swing highs (resistance)
   - Find recent swing lows (support)

**Example Structure**:
```typescript
export class FeatureExtractor {
  extract(candles: Candle[]): TechnicalFeatures {
    // Validate input
    if (candles.length < 50) {
      throw new Error('Minimum 50 candles required');
    }
    
    return {
      // Implement ALL calculations
      trend: this.detectTrend(candles),
      higherHighs: this.checkHigherHighs(candles),
      // ... all other properties
      rsi: this.calculateRSI(candles, 14),
      macd: this.calculateMACD(candles),
      // ... continue
    };
  }
  
  private calculateRSI(candles: Candle[], period: number): number {
    // REAL implementation - NOT pseudo code
    // Calculate gains and losses
    // Apply RSI formula: RSI = 100 - (100 / (1 + RS))
    // Return value between 0-100
  }
  
  // Implement ALL other private methods
}
```

**Critical Requirements**:
- All calculations must be mathematically correct
- Handle edge cases (not enough data, division by zero)
- Use proper mathematical formulas (no shortcuts)
- Return accurate values

**Verification**:
```typescript
// Test with sample data
const candles: Candle[] = [/* sample OHLCV data */];
const extractor = new FeatureExtractor();
const features = extractor.extract(candles);

console.log('RSI:', features.rsi);  // Should be 0-100
console.log('MACD:', features.macd); // Should have value, signal, histogram
// Verify all values are reasonable
```

---

## PHASE 4: DETECTOR IMPLEMENTATION (2 HOURS)

### STEP 4.1: Core Detectors

**File**: `src/engine/detectors/CoreDetectors.ts`

**Instructions**:
Implement 7 core technical indicator detectors. Each detector:
- Takes `TechnicalFeatures` as input
- Returns score in range [-1, +1]
- Implements logic from Signal Generation Report (document #4, Section 2.1)

**Required Detectors**:

1. **RSI Detector** (Weight: 0.09)
```typescript
export function detectRSI(features: TechnicalFeatures): number {
  const rsi = features.rsi;
  
  // Oversold zone (<30) - bullish signal
  if (rsi < 30) {
    return 1 - (rsi / 30); // Returns 0.33 to 1.0
  }
  
  // Overbought zone (>70) - bearish signal
  if (rsi > 70) {
    return -(rsi - 70) / 30; // Returns -0.33 to -1.0
  }
  
  // Neutral zone (30-70)
  return (rsi - 50) / 20; // Returns -1.0 to +1.0
}
```

2. **MACD Detector** (Weight: 0.09)
```typescript
export function detectMACD(features: TechnicalFeatures): number {
  const { value, signal, histogram } = features.macd;
  
  // Normalize histogram (typical range: -5 to +5)
  const normalizedHistogram = histogram / 10;
  
  // Check crossover
  const bullishCross = value > signal && histogram > 0;
  const bearishCross = value < signal && histogram < 0;
  
  let score = normalizedHistogram;
  
  // Boost signal on crossover
  if (bullishCross) score = Math.max(score, 0.5);
  if (bearishCross) score = Math.min(score, -0.5);
  
  return Math.max(-1, Math.min(1, score));
}
```

3. **MA Cross Detector** (Weight: 0.09)
4. **Bollinger Bands Detector** (Weight: 0.09)
5. **Volume Detector** (Weight: 0.07)
6. **ADX Detector** (Weight: 0.09)
7. **ROC Detector** (Weight: 0.05)

**Implement ALL 7 detectors following the formulas in document #4, Section 2.1.**

### STEP 4.2: SMC Detectors

**File**: `src/engine/detectors/SMCDetectors.ts`

**Required Detectors**:
1. Market Structure Detector (Weight: 0.05)
2. Support/Resistance Detector (Weight: 0.09)

**Implementation Notes**:
- Market Structure: Check for HH/HL (bullish) or LH/LL (bearish)
- Support/Resistance: Calculate position between levels

### STEP 4.3: Pattern Detectors

**File**: `src/engine/detectors/PatternDetectors.ts`

**Required Detector**:
1. Reversal Detector (Weight: 0.08)

**Implementation**:
- Combine multiple reversal signals:
  - Bollinger Band re-entry: ±0.3
  - RSI oversold/overbought: ±0.3
  - Pin bar/hammer candles: ±0.2
  - Fibonacci retracement: ±0.3
- Sum and clamp to [-1, +1]

### STEP 4.4: Sentiment Detectors

**File**: `src/engine/detectors/SentimentDetectors.ts`

**Required Detectors**:
1. Sentiment Detector (Weight: 0.08) - Fear & Greed Index
2. News Detector (Weight: 0.06) - News sentiment analysis
3. Whales Detector (Weight: 0.02) - Large transaction tracking

**Implementation Notes**:
- Use existing API service for data fetching
- Implement proper error handling (fallback to neutral 0.5 on failure)
- Cache results to avoid excessive API calls

### STEP 4.5: ML Detector

**File**: `src/engine/detectors/MLDetector.ts`

**Required Detector**:
1. ML/AI Detector (Weight: 0.15)

**Implementation** (Heuristic for now):
- Combine RSI, MACD, and ROC signals
- Average and normalize to [-1, +1]
- Note: This is a placeholder for future neural network integration

---

## PHASE 5: SCORING & AGGREGATION (1 HOUR)

### STEP 5.1: Create Detector Registry

**File**: `src/services/strategy/DetectorRegistry.ts`

**Purpose**: Central registry of all detectors with their weights

```typescript
import { DetectorWeights } from '@/types/strategy';
import * as CoreDetectors from '@/engine/detectors/CoreDetectors';
import * as SMCDetectors from '@/engine/detectors/SMCDetectors';
// ... import all detector modules

export interface DetectorDefinition {
  name: string;
  weight: number;
  category: 'CORE' | 'SMC' | 'PATTERNS' | 'SENTIMENT' | 'ML';
  fn: (features: TechnicalFeatures) => number;
  description: string;
}

export class DetectorRegistry {
  private detectors: DetectorDefinition[] = [];
  
  constructor(weights: DetectorWeights) {
    this.registerDetectors(weights);
  }
  
  private registerDetectors(weights: DetectorWeights) {
    // Register all 14 detectors
    this.detectors = [
      {
        name: 'RSI',
        weight: weights.rsi,
        category: 'CORE',
        fn: CoreDetectors.detectRSI,
        description: 'Relative Strength Index oversold/overbought detection'
      },
      // ... register all 14 detectors
    ];
  }
  
  getAll(): DetectorDefinition[] {
    return this.detectors;
  }
  
  getByCategory(category: string): DetectorDefinition[] {
    return this.detectors.filter(d => d.category === category);
  }
}
```

### STEP 5.2: Create Score Aggregator

**File**: `src/engine/ScoreAggregator.ts`

**Purpose**: Aggregate detector scores into final decision

**Implementation**:
```typescript
export class ScoreAggregator {
  aggregate(results: DetectorResult[]): {
    finalScore: number;
    direction: TrendDirection;
    categoryScores: Record<string, number>;
  } {
    // Group by category
    const categories = this.groupByCategory(results);
    
    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(categories);
    
    // Weighted average: Core(40%) + SMC(25%) + Patterns(20%) + Sentiment(10%) + ML(5%)
    const finalScore = 
      categoryScores.CORE * 0.40 +
      categoryScores.SMC * 0.25 +
      categoryScores.PATTERNS * 0.20 +
      categoryScores.SENTIMENT * 0.10 +
      categoryScores.ML * 0.05;
    
    // Determine direction
    const direction = this.determineDirection(finalScore);
    
    return { finalScore, direction, categoryScores };
  }
  
  private calculateCategoryScores(
    categories: Record<string, DetectorResult[]>
  ): Record<string, number> {
    // For each category: weighted average of detector scores
    // Formula: Σ(score × weight) / Σ(weight)
  }
  
  private determineDirection(score: number): TrendDirection {
    if (score > 0.05) return 'BULLISH';
    if (score < -0.05) return 'BEARISH';
    return 'NEUTRAL';
  }
}
```

---

## PHASE 6: STRATEGY ENGINES (2 HOURS)

### STEP 6.1: Advanced Signal Engine (5-Layer System)

**File**: `src/services/strategy/AdvancedSignalEngine.ts`

**Purpose**: Extreme selectivity with 0-100 point scoring system

**Implementation Structure**:
```typescript
export class AdvancedSignalEngine {
  async generateSignal(
    symbol: string,
    candles: Candle[]
  ): Promise<AdvancedSignal | null> {
    // Validate minimum data
    if (candles.length < 50) return null;
    
    // Extract features
    const features = this.featureExtractor.extract(candles);
    
    // Score each layer
    const layer1 = this.scoreLayer1_PriceAction(features, candles);     // 0-30
    const layer2 = this.scoreLayer2_Indicators(features);               // 0-25
    const layer3 = this.scoreLayer3_Timeframes(candles);                // 0-20
    const layer4 = this.scoreLayer4_Volume(features);                   // 0-15
    const layer5 = this.scoreLayer5_RiskManagement(features, candles);  // 0-10
    
    const totalScore = layer1 + layer2 + layer3 + layer4 + layer5;
    
    // Threshold: 75 points minimum
    if (totalScore < 75) return null;
    
    // Determine direction (requires 2/3 directional layers to agree)
    const direction = this.determineDirection(layer1, layer2, layer3);
    if (!direction) return null;
    
    // Calculate entry plan
    const entryPlan = this.calculateEntryPlan(features, candles, direction);
    
    // Risk-reward minimum: 3:1
    if (entryPlan.riskRewardRatio < 3) return null;
    
    // Build signal
    return {
      id: `adv-${symbol}-${Date.now()}`,
      symbol,
      type: direction,
      entry_price: candles[candles.length - 1].close,
      stop_loss: entryPlan.stopLoss,
      target_price: entryPlan.takeProfit1,
      takeProfit1: entryPlan.takeProfit1,
      takeProfit2: entryPlan.takeProfit2,
      takeProfit3: entryPlan.takeProfit3,
      riskRewardRatio: entryPlan.riskRewardRatio,
      confidence: this.calculateConfidence(totalScore, features),
      reasoning: this.buildReasoning(layer1, layer2, layer3, layer4, layer5),
      timestamp: new Date().toISOString(),
      timeframe: '1h',
      contributingFactors: this.identifyContributingFactors(features),
      score: {
        layer1_priceAction: layer1,
        layer2_indicators: layer2,
        layer3_timeframes: layer3,
        layer4_volume: layer4,
        layer5_riskManagement: layer5,
        totalScore,
        isValid: true
      }
    };
  }
  
  private scoreLayer1_PriceAction(
    features: TechnicalFeatures,
    candles: Candle[]
  ): number {
    // 0-30 points
    // Implement as per document #4, Section 1.1
    let score = 0;
    
    // Trend structure (0-15 points)
    if (features.higherHighs && features.higherLows) score += 15;
    else if (features.lowerHighs && features.lowerLows) score += 15;
    else score += 5; // Mixed/choppy
    
    // Candlestick patterns (0-10 points)
    // Detect engulfing, hammer, shooting star
    
    // Support/Resistance proximity (0-5 points)
    // Check if price is near key levels
    
    return Math.min(30, score);
  }
  
  // Implement ALL 5 layers following document #4 specifications
}
```

**Critical Requirements**:
- Implement ALL 5 layers with correct scoring ranges
- Direction determination requires 2/3 agreement
- Minimum threshold: 75 points
- Minimum R:R: 3:1
- Cooldown: 4 hours per symbol

### STEP 6.2: Multi-Timeframe Strategy Engine

**File**: `src/services/strategy/StrategyEngine.ts`

**Purpose**: Analyze 15m, 1h, 4h timeframes simultaneously with 14 detectors

**Implementation Structure**:
```typescript
export class StrategyEngine {
  private detectorRegistry: DetectorRegistry;
  private featureExtractor: FeatureExtractor;
  private scoreAggregator: ScoreAggregator;
  
  async analyzeMultiTimeframe(
    symbol: string,
    candles15m: Candle[],
    candles1h: Candle[],
    candles4h: Candle[]
  ): Promise<StrategyOutput> {
    // Analyze each timeframe independently
    const tf15m = await this.analyzeTimeframe('15m', candles15m);
    const tf1h = await this.analyzeTimeframe('1h', candles1h);
    const tf4h = await this.analyzeTimeframe('4h', candles4h);
    
    const results = [tf15m, tf1h, tf4h];
    
    // Multi-timeframe decision making
    const mtfDecision = this.makeMTFDecision(results);
    
    // Calculate confluence
    const confluence = this.calculateConfluence(results, mtfDecision.direction);
    
    // Check reversal rules
    const reversalCheck = this.checkReversalRules(results, confluence);
    
    // Apply context gating
    const context = await this.getMarketContext(symbol);
    const gatedAction = this.applyContextGating(mtfDecision.action, context, confluence);
    
    // Build entry plan
    const entryPlan = this.buildEntryPlan(candles1h, gatedAction, context);
    
    return {
      symbol,
      results,
      direction: mtfDecision.direction,
      final_score: mtfDecision.score,
      action: gatedAction,
      rationale: this.buildRationale(mtfDecision, confluence, context),
      confluence,
      entryPlan,
      context,
      timestamp: Date.now()
    };
  }
  
  private async analyzeTimeframe(
    timeframe: Timeframe,
    candles: Candle[]
  ): Promise<TimeframeResult> {
    // Extract features
    const features = this.featureExtractor.extract(candles);
    
    // Run all detectors
    const detectorResults: DetectorResult[] = [];
    const allDetectors = this.detectorRegistry.getAll();
    
    for (const detector of allDetectors) {
      try {
        const score = detector.fn(features);
        detectorResults.push({
          name: detector.name,
          score: Math.max(-1, Math.min(1, score)), // Clamp to [-1, +1]
          weight: detector.weight,
          category: detector.category,
          description: detector.description
        });
      } catch (error) {
        console.error(`Detector ${detector.name} failed:`, error);
        // Graceful degradation: neutral score
        detectorResults.push({
          name: detector.name,
          score: 0,
          weight: detector.weight,
          category: detector.category,
          description: detector.description
        });
      }
    }
    
    // Aggregate scores
    const aggregated = this.scoreAggregator.aggregate(detectorResults);
    
    // Calculate weighted score: Σ(score × weight) / Σ(weight)
    let signedSum = 0;
    let weightSum = 0;
    
    for (const result of detectorResults) {
      signedSum += result.score * result.weight;
      weightSum += Math.abs(result.weight);
    }
    
    const normalized = signedSum / weightSum; // [-1, +1]
    const finalScore = (normalized + 1) / 2;   // [0, 1]
    
    return {
      timeframe,
      score: finalScore,
      direction: aggregated.direction,
      detectors: detectorResults,
      normalized
    };
  }
  
  private makeMTFDecision(results: TimeframeResult[]): {
    direction: TrendDirection;
    action: SignalType;
    score: number;
  } {
    // Count votes
    let bullishVotes = 0;
    let bearishVotes = 0;
    
    for (const tf of results) {
      if (tf.direction === 'BULLISH') bullishVotes++;
      if (tf.direction === 'BEARISH') bearishVotes++;
    }
    
    const majorityDir = bullishVotes > bearishVotes ? 'BULLISH' :
                        bearishVotes > bullishVotes ? 'BEARISH' : 'NEUTRAL';
    
    // Check thresholds
    const anyHighScore = results.some(tf => tf.score >= 0.65);
    const anyLowScore = results.some(tf => tf.score <= 0.35);
    const majorityMet = majorityDir === 'BULLISH' 
      ? results.filter(tf => tf.score >= 0.60).length >= 2
      : results.filter(tf => tf.score <= 0.40).length >= 2;
    
    // Determine action
    let action: SignalType = 'HOLD';
    
    if (majorityDir === 'BULLISH' && (anyHighScore || majorityMet)) {
      action = 'BUY';
    } else if (majorityDir === 'BEARISH' && (anyLowScore || majorityMet)) {
      action = 'SELL';
    }
    
    // Average score
    const avgScore = results.reduce((sum, tf) => sum + tf.score, 0) / results.length;
    
    return {
      direction: majorityDir,
      action,
      score: avgScore
    };
  }
  
  private calculateConfluence(
    results: TimeframeResult[],
    direction: TrendDirection
  ): ConfluenceScore {
    // Agreement: fraction of timeframes matching direction
    let agreementCount = 0;
    for (const tf of results) {
      if (tf.direction === direction) agreementCount++;
    }
    const agreement = agreementCount / results.length;
    
    // Calculate AI, Tech, Context contributions
    const aiScores: number[] = [];
    const techScores: number[] = [];
    const contextScores: number[] = [];
    
    for (const tf of results) {
      for (const detector of tf.detectors) {
        if (detector.category === 'ML') aiScores.push(detector.score);
        if (['CORE', 'SMC', 'PATTERNS'].includes(detector.category)) {
          techScores.push(detector.score);
        }
        if (detector.category === 'SENTIMENT') contextScores.push(detector.score);
      }
    }
    
    const ai = aiScores.length > 0 
      ? aiScores.reduce((a, b) => a + b, 0) / aiScores.length 
      : 0.5;
    const tech = techScores.length > 0 
      ? techScores.reduce((a, b) => a + b, 0) / techScores.length 
      : 0.5;
    const context = contextScores.length > 0 
      ? contextScores.reduce((a, b) => a + b, 0) / contextScores.length 
      : 0.5;
    
    // Confluence formula: agreement × (ai×0.5 + tech×0.35 + context×0.15)
    const score = agreement * (ai * 0.5 + tech * 0.35 + context * 0.15);
    
    // Threshold: 0.60 (configurable)
    const threshold = 0.60;
    const passed = score >= threshold;
    
    return {
      enabled: true,
      score,
      agreement,
      ai,
      tech,
      context,
      passed
    };
  }
  
  private applyContextGating(
    action: SignalType,
    context: MarketContext,
    confluence: ConfluenceScore
  ): SignalType {
    // Bad News Hold: news < -0.35 AND sentiment < -0.25
    if (context.news01 < -0.35 && context.sentiment01 < -0.25) {
      return 'HOLD';
    }
    
    // Confluence requirement
    if (!confluence.passed) {
      return 'HOLD';
    }
    
    return action;
  }
  
  private buildEntryPlan(
    candles: Candle[],
    action: SignalType,
    context: MarketContext
  ): EntryPlan {
    const currentPrice = candles[candles.length - 1].close;
    const features = this.featureExtractor.extract(candles);
    const atr = features.atr;
    
    // ATR-based stop loss
    const atrMultiplier = 1.2;
    let sl: number;
    let tp: [number, number, number];
    
    if (action === 'BUY') {
      sl = currentPrice - (atr * atrMultiplier);
      const risk = currentPrice - sl;
      tp = [
        currentPrice + (risk * 2), // TP1: 2R
        currentPrice + (risk * 3), // TP2: 3R
        currentPrice + (risk * 4)  // TP3: 4R
      ];
    } else if (action === 'SELL') {
      sl = currentPrice + (atr * atrMultiplier);
      const risk = sl - currentPrice;
      tp = [
        currentPrice - (risk * 2), // TP1: 2R
        currentPrice - (risk * 3), // TP2: 3R
        currentPrice - (risk * 4)  // TP3: 4R
      ];
    } else {
      // HOLD - no entry plan
      sl = currentPrice;
      tp = [currentPrice, currentPrice, currentPrice];
    }
    
    // Calculate dynamic leverage
    const leverage = this.calculateLeverage(currentPrice, sl, context);
    
    return {
      mode: 'ATR',
      sl,
      tp,
      ladder: [0.4, 0.35, 0.25], // 40%, 35%, 25%
      trailing: {
        enabled: true,
        startAt: 'TP1',
        distance: atr * 1.0
      },
      leverage
    };
  }
  
  private calculateLeverage(
    currentPrice: number,
    stopLoss: number,
    context: MarketContext
  ): number {
    const slDistance = Math.abs(currentPrice - stopLoss) / currentPrice;
    
    // Base calculation
    const accountRisk = 0.02; // 2% account risk
    let leverage = Math.min(10, Math.max(2, accountRisk / slDistance));
    
    // Apply liquidation buffer (35%)
    leverage = leverage * (1 - 0.35);
    
    // Volatility gate - reduce leverage if high volatility
    // (would need ATR z-score calculation here)
    
    // Round to 1 decimal
    return Math.round(leverage * 10) / 10;
  }
}
```

---

## PHASE 7: RISK MANAGER (1 HOUR)

### STEP 7.1: Create Risk Manager

**File**: `src/services/strategy/RiskManager.ts`

**Purpose**: Position sizing, leverage calculation, cooldown management

**Implementation**:
```typescript
import { RiskConfig, Position, TradeResult } from '@/types/strategy';

export class RiskManager {
  private cooldowns: Map<string, number> = new Map();
  private consecutiveLosses: Map<string, number> = new Map();
  private openPositions: Position[] = [];
  private tradeHistory: TradeResult[] = [];
  
  constructor(private config: RiskConfig) {}
  
  canTrade(symbol: string): { allowed: boolean; reason?: string } {
    // Check cooldown
    const cooldownUntil = this.cooldowns.get(symbol);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      return {
        allowed: false,
        reason: `Cooldown active until ${new Date(cooldownUntil).toLocaleString()}`
      };
    }
    
    // Check max open positions
    if (this.openPositions.length >= this.config.futures.maxOpenPositions) {
      return {
        allowed: false,
        reason: `Max open positions (${this.config.futures.maxOpenPositions}) reached`
      };
    }
    
    // Check daily loss limit
    const todayPnl = this.calculateDailyPnl();
    if (todayPnl <= -this.config.futures.maxDailyLoss) {
      return {
        allowed: false,
        reason: `Daily loss limit reached: ${todayPnl.toFixed(2)}`
      };
    }
    
    return { allowed: true };
  }
  
  activateCooldown(symbol: string, bars: number = 20, barDurationMs: number = 15 * 60 * 1000) {
    const cooldownMs = bars * barDurationMs;
    const until = Date.now() + cooldownMs;
    this.cooldowns.set(symbol, until);
    
    console.log(`Cooldown activated for ${symbol} until ${new Date(until).toLocaleString()}`);
  }
  
  recordTrade(result: TradeResult) {
    this.tradeHistory.push(result);
    
    // Track consecutive losses
    const symbol = result.signal.symbol;
    if (result.status === 'LOSS') {
      const current = this.consecutiveLosses.get(symbol) || 0;
      this.consecutiveLosses.set(symbol, current + 1);
      
      // Activate cooldown after 2 consecutive losses
      if (current + 1 >= 2) {
        this.activateCooldown(symbol);
      }
    } else if (result.status === 'WIN' || result.status === 'BREAKEVEN') {
      // Reset consecutive losses
      this.consecutiveLosses.set(symbol, 0);
      // Clear cooldown
      this.cooldowns.delete(symbol);
    }
  }
  
  calculatePositionSize(
    balance: number,
    entryPrice: number,
    stopLoss: number,
    leverage: number
  ): number {
    const riskPercent = this.config.futures.maxRiskPerTrade / 100;
    const riskAmount = balance * riskPercent;
    const slDistance = Math.abs(entryPrice - stopLoss) / entryPrice;
    const positionSize = riskAmount / slDistance / entryPrice;
    
    // Apply max position size limit
    return Math.min(positionSize, this.config.futures.maxPositionSize);
  }
  
  private calculateDailyPnl(): number {
    const today = new Date().setHours(0, 0, 0, 0);
    return this.tradeHistory
      .filter(t => t.timestamp >= today)
      .reduce((sum, t) => sum + t.pnl, 0);
  }
  
  addPosition(position: Position) {
    this.openPositions.push(position);
  }
  
  removePosition(id: string) {
    this.openPositions = this.openPositions.filter(p => p.id !== id);
  }
  
  getOpenPositions(): Position[] {
    return [...this.openPositions];
  }
}
```

---

## PHASE 8: SIGNAL AGGREGATOR & ORCHESTRATION (45 MINUTES)

### STEP 8.1: Create Signal Aggregator

**File**: `src/services/strategy/SignalAggregator.ts`

**Purpose**: Combine signals from both engines and decide final output

**Implementation**:
```typescript
import { AdvancedSignalEngine } from './AdvancedSignalEngine';
import { StrategyEngine } from './StrategyEngine';
import { RiskManager } from './RiskManager';

export class SignalAggregator {
  private advancedEngine: AdvancedSignalEngine;
  private strategyEngine: StrategyEngine;
  private riskManager: RiskManager;
  
  constructor() {
    this.advancedEngine = new AdvancedSignalEngine();
    this.strategyEngine = new StrategyEngine();
    this.riskManager = new RiskManager(/* load from config */);
  }
  
  async generateCombinedSignal(
    symbol: string,
    candles15m: Candle[],
    candles1h: Candle[],
    candles4h: Candle[]
  ): Promise<Signal | null> {
    // Check if trading is allowed
    const riskCheck = this.riskManager.canTrade(symbol);
    if (!riskCheck.allowed) {
      console.log(`Trade blocked: ${riskCheck.reason}`);
      return null;
    }
    
    // Run both engines in parallel
    const [advancedSignal, strategyOutput] = await Promise.all([
      this.advancedEngine.generateSignal(symbol, candles1h),
      this.strategyEngine.analyzeMultiTimeframe(symbol, candles15m, candles1h, candles4h)
    ]);
    
    // Decide final signal based on agreement
    if (advancedSignal && strategyOutput.action !== 'HOLD') {
      // Both engines agree
      if (advancedSignal.type === strategyOutput.action) {
        // High confidence - both engines agree
        return {
          ...advancedSignal,
          confidence: Math.min(1.0, advancedSignal.confidence * 1.2)
        };
      }
    }
    
    // Use advanced engine signal if it exists and has high score
    if (advancedSignal && advancedSignal.score.totalScore >= 85) {
      return advancedSignal;
    }
    
    // Use strategy engine signal if confluence is strong
    if (strategyOutput.confluence.score >= 0.70 && strategyOutput.action !== 'HOLD') {
      return this.convertStrategyOutputToSignal(strategyOutput);
    }
    
    return null;
  }
  
  private convertStrategyOutputToSignal(output: StrategyOutput): Signal {
    return {
      id: `mtf-${output.symbol}-${output.timestamp}`,
      symbol: output.symbol,
      type: output.action,
      entry_price: output.entryPlan.tp[0], // Use current price
      stop_loss: output.entryPlan.sl,
      target_price: output.entryPlan.tp[0],
      confidence: output.confluence.score,
      reasoning: output.rationale,
      timestamp: new Date(output.timestamp).toISOString()
    };
  }
}