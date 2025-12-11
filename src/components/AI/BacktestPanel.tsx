
import React, { useState } from 'react';
import { Play, Calendar, DollarSign, BarChart, RefreshCw } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { calculateSMA } from '../../utils/indicators';

export const BacktestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [selectedCoin, setSelectedCoin] = useState('BTC');

  const runBacktest = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      // 1. Fetch Real History (Daily candles, limit 100 days)
      const history = await marketService.getHistory(selectedCoin, '1d', 100);
      const closes = history.map((h: any) => Number(h.close || h.c));

      // 2. Calculate Indicators (Simple Moving Average Crossover)
      // Strategy: Buy when Price > SMA20, Sell when Price < SMA20
      const sma20 = calculateSMA(closes, 20);

      let balance = initialCapital;
      let holdings = 0;
      let trades = 0;
      let wins = 0;
      let maxDrawdown = 0;
      let peakBalance = initialCapital;

      // Start simulation from day 20
      for (let i = 20; i < closes.length; i++) {
        const price = closes[i];
        const prevPrice = closes[i - 1];
        const ma = sma20[i];
        const prevMa = sma20[i - 1];

        // Buy Signal (Crossover Up)
        if (prevPrice <= prevMa && price > ma && holdings === 0) {
          holdings = balance / price;
          balance = 0;
          trades++;
        }
        // Sell Signal (Crossover Down)
        else if (prevPrice >= prevMa && price < ma && holdings > 0) {
          const sellValue = holdings * price;
          if (sellValue > (initialCapital)) wins++; // simple win tracking
          balance = sellValue;
          holdings = 0;
          trades++;

          // Drawdown calc
          if (balance > peakBalance) peakBalance = balance;
          const dd = ((peakBalance - balance) / peakBalance) * 100;
          if (dd > maxDrawdown) maxDrawdown = dd;
        }
      }

      // Final Value
      const finalBalance = holdings > 0 ? holdings * closes[closes.length - 1] : balance;
      const totalReturn = ((finalBalance - initialCapital) / initialCapital) * 100;

      setResult({
        totalReturn: totalReturn.toFixed(2),
        winRate: trades > 0 ? Math.round((wins / (trades / 2)) * 100) : 0, // Approx win rate
        trades,
        drawdown: maxDrawdown.toFixed(2)
      });

    } catch (e) {
      console.error("Backtest failed", e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <BarChart className="text-cyan-400" />
        Strategy Backtester
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase font-bold">Strategy</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500">
              <option>SMA 20 Crossover (Trend Follow)</option>
              <option disabled>RSI Mean Reversion (Coming Soon)</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase font-bold">Asset</label>
            <div className="flex gap-2">
              {['BTC', 'ETH', 'SOL', 'BNB'].map(sym => (
                <button 
                  key={sym} 
                  onClick={() => setSelectedCoin(sym)}
                  className={`flex-1 border rounded-lg py-2 text-sm font-bold transition-colors ${selectedCoin === sym ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-300'}`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
           <div className="space-y-1">
             <label className="text-xs text-slate-500 uppercase font-bold">Initial Capital ($)</label>
             <div className="relative">
               <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input 
                 type="number" 
                 value={initialCapital}
                 onChange={(e) => setInitialCapital(Number(e.target.value))}
                 className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-cyan-500"
               />
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-xs text-slate-500 uppercase font-bold">Data Range</label>
             <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input 
                 type="text" 
                 value="Last 100 Days" 
                 readOnly
                 className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-slate-300 cursor-not-allowed"
               />
             </div>
           </div>
        </div>
      </div>

      <button 
        onClick={runBacktest}
        disabled={isRunning}
        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <><RefreshCw className="animate-spin" size={20} /> Processing Data...</>
        ) : (
          <><Play size={20} fill="currentColor" /> Run Backtest</>
        )}
      </button>

      {result && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div className={`border p-4 rounded-xl text-center ${Number(result.totalReturn) >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="text-xs text-slate-400 uppercase mb-1">Total Return</div>
            <div className={`text-2xl font-bold ${Number(result.totalReturn) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{result.totalReturn}%</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
            <div className="text-xs text-slate-400 uppercase mb-1">Trades</div>
            <div className="text-2xl font-bold text-white">{result.trades}</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
            <div className="text-xs text-slate-400 uppercase mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-cyan-400">{result.winRate}%</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
            <div className="text-xs text-slate-400 uppercase mb-1">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-400">{result.drawdown}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
