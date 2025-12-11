import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';
import { autoTradeService } from '../../services/autoTradeService';
import { Signal } from '../../types/strategy';

export function SignalDisplay() {
  const [signals, setSignals] = useState<Signal[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const activeSignals = autoTradeService.getActiveSignals();
      setSignals(activeSignals.slice(-5)); // Last 5 signals
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (signals.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Target className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300">No active signals</p>
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
                <div className="text-slate-300 text-sm">
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
                : 'bg-slate-500/20 text-slate-300'
            }`}>
              {(signal.confidence * 100).toFixed(0)}% Confidence
            </div>
          </div>
          
          {/* Price Levels */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-slate-300 mb-1">Entry</div>
              <div className="text-white font-mono">${signal.entry_price.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-300 mb-1">Target</div>
              <div className="text-green-400 font-mono">${signal.target_price.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-300 mb-1">Stop Loss</div>
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
