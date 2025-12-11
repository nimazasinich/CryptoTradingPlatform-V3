
import React, { useState, useEffect } from 'react';
import { Bot, LineChart, Search, BrainCircuit } from 'lucide-react';
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

export default function AILab() {
  const [activeTab, setActiveTab] = useState('signals');
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'signals') {
      fetchSignals();
    }
  }, [activeTab]);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const parsedSignals = await aiService.getSignals('BTC');
      
      if (parsedSignals.length > 0) {
        setSignals(parsedSignals);
      } else {
        // Fallback simulation if API is quiet
        setSignals([
          {
            id: '1',
            symbol: 'BTC',
            type: 'BUY',
            entry_price: 64250,
            target_price: 68000,
            stop_loss: 62500,
            confidence: 88,
            reasoning: 'Strong bullish divergence on 4H RSI coupled with increasing volume breakout.',
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
            reasoning: 'Rejection at major resistance level with bearish engulfing pattern.',
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
            reasoning: 'Golden Cross formation on daily chart and ecosystem growth metrics.',
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

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BrainCircuit className="text-purple-400" size={32} />
          AI Trading Lab
        </h1>
        <p className="text-slate-400">Leverage machine learning models for market analysis and automated trading strategies.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse" />)
            ) : (
              signals.map(signal => <SignalCard key={signal.id} signal={signal} />)
            )}
          </div>
        )}

        {activeTab === 'scanner' && <MarketScanner />}
        {activeTab === 'backtest' && <BacktestPanel />}
        {activeTab === 'strategy' && <StrategyBuilder />}
      </div>
    </div>
  );
}
