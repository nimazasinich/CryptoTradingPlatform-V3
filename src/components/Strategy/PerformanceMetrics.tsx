import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, DollarSign, Percent } from 'lucide-react';
import { autoTradeService } from '../../services/autoTradeService';
import { PerformanceMetrics as PerfMetrics } from '../../types/strategy';

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerfMetrics | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const performance = autoTradeService.getPerformance();
      setMetrics(performance);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!metrics) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-slate-400">Loading metrics...</div>
      </div>
    );
  }
  
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
      value: `$${metrics.totalPnl.toFixed(2)}`,
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
