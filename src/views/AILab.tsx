
import React, { useState, useEffect } from 'react';
import { Bot, LineChart, Search, BrainCircuit, RefreshCw, Filter, TrendingUp } from 'lucide-react';
import { SignalCard } from '../components/AI/SignalCard';
import { MarketScanner } from '../components/AI/MarketScanner';
import { BacktestPanel } from '../components/AI/BacktestPanel';
import { StrategyBuilder } from '../components/AI/StrategyBuilder';
import { aiService } from '../services/aiService';
import { AISignal } from '../types';

const TABS = [
  { id: 'signals', label: 'AI Signals', icon: Bot },
  { id: 'scanner', label: 'Market Scanner', icon: Search },
  { id: 'backtest', label: 'Backtesting', icon: LineChart },
  { id: 'strategy', label: 'Strategy Builder', icon: BrainCircuit },
];

const COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'AVAX'];

interface AILabProps {
  defaultTab?: string;
}

export default function AILab({ defaultTab = 'signals' }: AILabProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [minConfidence, setMinConfidence] = useState(0);
  const [signalTypeFilter, setSignalTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (activeTab === 'signals') {
      fetchSignals();
      const interval = setInterval(fetchSignals, 30000); // Auto-refresh every 30s
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedSymbol]);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const parsedSignals = await aiService.getSignals(selectedSymbol);
      
      if (parsedSignals.length > 0) {
        setSignals(parsedSignals);
      } else {
        // Fallback demonstration signals if API is quiet
        setSignals([
          {
            id: '1',
            symbol: 'BTC',
            type: 'BUY',
            entry_price: 64250,
            target_price: 68000,
            stop_loss: 62500,
            confidence: 88,
            reasoning: 'Strong bullish divergence on 4H RSI coupled with increasing volume breakout above key resistance.',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            symbol: 'ETH',
            type: 'SELL',
            entry_price: 3450,
            target_price: 3200,
            stop_loss: 3550,
            confidence: 75,
            reasoning: 'Rejection at major resistance level with bearish engulfing pattern. Declining on-chain activity.',
            timestamp: new Date().toISOString()
          },
          {
            id: '3',
            symbol: 'SOL',
            type: 'BUY',
            entry_price: 145.20,
            target_price: 165.00,
            stop_loss: 138.50,
            confidence: 92,
            reasoning: 'Golden Cross formation on daily chart with strong ecosystem growth metrics and increasing TVL.',
            timestamp: new Date().toISOString()
          },
          {
            id: '4',
            symbol: 'BNB',
            type: 'BUY',
            entry_price: 610.50,
            target_price: 680.00,
            stop_loss: 585.00,
            confidence: 81,
            reasoning: 'Breaking out of symmetrical triangle pattern with strong volume confirmation.',
            timestamp: new Date().toISOString()
          },
          {
            id: '5',
            symbol: 'ADA',
            type: 'SELL',
            entry_price: 0.58,
            target_price: 0.52,
            stop_loss: 0.61,
            confidence: 68,
            reasoning: 'Failed to maintain support level. RSI showing weakness with declining momentum.',
            timestamp: new Date().toISOString()
          },
          {
            id: '6',
            symbol: 'XRP',
            type: 'BUY',
            entry_price: 0.52,
            target_price: 0.58,
            stop_loss: 0.49,
            confidence: 79,
            reasoning: 'Bullish pennant formation with increasing accumulation by whales. Legal clarity improving.',
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSignals = signals.filter(signal => {
    if (signal.confidence < minConfidence) return false;
    if (signalTypeFilter !== 'ALL' && signal.type !== signalTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BrainCircuit className="text-purple-400" size={32} />
          AI Trading Lab
        </h1>
        <p className="text-slate-300">Leverage machine learning models for market analysis and automated trading strategies.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/30 scale-[1.02]' 
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:scale-[1.01]'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'signals' && (
          <div className="space-y-6">
            {/* Signals Controls */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-purple-400" size={20} />
                  <span className="text-sm text-slate-300 font-medium">Symbol:</span>
                  <select 
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-medium focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {COINS.map(coin => (
                      <option key={coin} value={coin}>{coin}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showFilters ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-slate-300 border border-white/10 hover:text-white hover:bg-white/10'}`}
                >
                  <Filter size={16} />
                  Filters
                </button>
              </div>

              <button
                onClick={fetchSignals}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-all hover:shadow-lg hover:shadow-purple-900/30"
              >
                <RefreshCw size={16} className={loading ? 'motion-safe:animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="glass-card p-4 space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Min Confidence: {minConfidence}%</label>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Signal Type</label>
                    <div className="flex gap-2">
                      {(['ALL', 'BUY', 'SELL'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setSignalTypeFilter(type)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                            signalTypeFilter === type 
                              ? type === 'BUY' ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : type === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Signals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-80 rounded-xl bg-white/5 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  </div>
                ))
              ) : filteredSignals.length === 0 ? (
                <div className="col-span-full glass-card p-12 text-center">
                  <Bot className="mx-auto mb-4 text-slate-600" size={48} />
                  <h3 className="text-xl font-bold text-white mb-2">No Signals Found</h3>
                  <p className="text-slate-300">Try adjusting your filters or check back later.</p>
                </div>
              ) : (
                filteredSignals.map((signal, index) => (
                  <div key={signal.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                    <SignalCard signal={signal} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'scanner' && <MarketScanner />}
        {activeTab === 'backtest' && <BacktestPanel />}
        {activeTab === 'strategy' && <StrategyBuilder />}
      </div>
    </div>
  );
}
