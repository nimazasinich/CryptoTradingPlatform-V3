
import React, { useState } from 'react';
import { Play, Calendar, DollarSign, BarChart, RefreshCw, TrendingUp, Activity } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { calculateSMA } from '../../utils/indicators';

interface Trade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  pnl: number;
  status: 'WIN' | 'LOSS' | 'OPEN';
}

export const BacktestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [equityCurve, setEquityCurve] = useState<number[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  const runBacktest = async () => {
    setIsRunning(true);
    setResult(null);
    setEquityCurve([]);
    setTrades([]);

    try {
      // 1. Fetch Real History (Daily candles, limit 100 days)
      const history = await marketService.getHistory(selectedCoin, '1d', 100);
      const closes = history.map((h: any) => Number(h.close || h.c));
      const timestamps = history.map((h: any) => h.timestamp || h.time);

      // 2. Calculate Indicators (Simple Moving Average Crossover)
      // Strategy: Buy when Price crosses above SMA20, Sell when crosses below
      const sma20 = calculateSMA(closes, 20);

      let balance = initialCapital;
      let holdings = 0;
      let entryPrice = 0;
      let tradeCount = 0;
      let wins = 0;
      let maxDrawdown = 0;
      let peakBalance = initialCapital;
      const equity: number[] = [];
      const tradeHistory: Trade[] = [];

      // Start simulation from day 20
      for (let i = 20; i < closes.length; i++) {
        const price = closes[i];
        const prevPrice = closes[i - 1];
        const ma = sma20[i];
        const prevMa = sma20[i - 1];
        const date = new Date(timestamps[i] * 1000).toLocaleDateString();

        // Calculate current portfolio value
        const portfolioValue = holdings > 0 ? holdings * price : balance;
        equity.push(portfolioValue);

        // Buy Signal (Crossover Up)
        if (prevPrice <= prevMa && price > ma && holdings === 0) {
          holdings = balance / price;
          entryPrice = price;
          balance = 0;
          tradeCount++;
          
          tradeHistory.push({
            date,
            type: 'BUY',
            price,
            amount: holdings,
            pnl: 0,
            status: 'OPEN'
          });
        }
        // Sell Signal (Crossover Down)
        else if (prevPrice >= prevMa && price < ma && holdings > 0) {
          const sellValue = holdings * price;
          const pnl = sellValue - (holdings * entryPrice);
          if (pnl > 0) wins++;
          balance = sellValue;
          
          tradeHistory.push({
            date,
            type: 'SELL',
            price,
            amount: holdings,
            pnl,
            status: pnl > 0 ? 'WIN' : 'LOSS'
          });
          
          holdings = 0;
          tradeCount++;

          // Drawdown calc
          if (balance > peakBalance) peakBalance = balance;
          const dd = ((peakBalance - balance) / peakBalance) * 100;
          if (dd > maxDrawdown) maxDrawdown = dd;
        }
      }

      // Final Value
      const finalBalance = holdings > 0 ? holdings * closes[closes.length - 1] : balance;
      const totalReturn = ((finalBalance - initialCapital) / initialCapital) * 100;
      const sharpeRatio = calculateSharpeRatio(equity, initialCapital);

      setResult({
        totalReturn: totalReturn.toFixed(2),
        winRate: tradeCount > 0 ? Math.round((wins / (tradeCount / 2)) * 100) : 0,
        trades: tradeCount,
        drawdown: maxDrawdown.toFixed(2),
        sharpeRatio: sharpeRatio.toFixed(2),
        finalBalance: finalBalance.toFixed(2)
      });
      
      setEquityCurve(equity);
      setTrades(tradeHistory.slice(-10)); // Last 10 trades

    } catch (e) {
      console.error("Backtest failed", e);
      alert('Backtest failed. Historical data may not be available for this symbol.');
    } finally {
      setIsRunning(false);
    }
  };

  const calculateSharpeRatio = (equity: number[], initial: number): number => {
    if (equity.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < equity.length; i++) {
      returns.push((equity[i] - equity[i-1]) / equity[i-1]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252); // Annualized
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart className="text-cyan-400" />
            Strategy Backtester
          </h2>
          <p className="text-slate-400 text-sm mt-1">Test strategies against historical data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase font-bold">Strategy</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500 transition-colors">
              <option>SMA 20 Crossover (Trend Follow)</option>
              <option disabled>RSI Mean Reversion (Coming Soon)</option>
              <option disabled>MACD + Volume (Coming Soon)</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase font-bold">Asset</label>
            <div className="grid grid-cols-4 gap-2">
              {['BTC', 'ETH', 'SOL', 'BNB'].map(sym => (
                <button 
                  key={sym} 
                  onClick={() => setSelectedCoin(sym)}
                  className={`border rounded-lg py-2.5 text-sm font-bold transition-all ${selectedCoin === sym ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 scale-[1.02]' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
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
                 className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white outline-none focus:border-cyan-500 transition-colors"
               />
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-xs text-slate-500 uppercase font-bold">Data Range</label>
             <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input 
                 type="text" 
                 value="Last 100 Days (Daily)" 
                 readOnly
                 className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-slate-300 cursor-not-allowed"
               />
             </div>
           </div>
        </div>
      </div>

      <button 
        onClick={runBacktest}
        disabled={isRunning}
        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <><RefreshCw className="animate-spin" size={20} /> Processing Historical Data...</>
        ) : (
          <><Play size={20} fill="currentColor" /> Run Backtest</>
        )}
      </button>

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`border p-4 rounded-xl text-center transition-all hover:scale-[1.02] ${Number(result.totalReturn) >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="text-xs text-slate-400 uppercase mb-1">Total Return</div>
              <div className={`text-2xl font-bold ${Number(result.totalReturn) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.totalReturn}%
              </div>
              <div className="text-xs text-slate-500 mt-1">${result.finalBalance}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center transition-all hover:scale-[1.02] hover:bg-white/10">
              <div className="text-xs text-slate-400 uppercase mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-cyan-400">{result.winRate}%</div>
              <div className="text-xs text-slate-500 mt-1">{result.trades} trades</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center transition-all hover:scale-[1.02]">
              <div className="text-xs text-slate-400 uppercase mb-1">Max Drawdown</div>
              <div className="text-2xl font-bold text-red-400">{result.drawdown}%</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-center transition-all hover:scale-[1.02]">
              <div className="text-xs text-slate-400 uppercase mb-1">Sharpe Ratio</div>
              <div className="text-2xl font-bold text-purple-400">{result.sharpeRatio}</div>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <div className="glass-card p-6 border border-white/5">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <TrendingUp size={16} />
              Equity Curve
            </h3>
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                
                {equityCurve.length > 0 && (
                  <>
                    {/* Area fill */}
                    <path
                      d={`M 0 200 ${equityCurve.map((val, i) => {
                        const x = (i / equityCurve.length) * 800;
                        const y = 200 - ((val - Math.min(...equityCurve)) / (Math.max(...equityCurve) - Math.min(...equityCurve))) * 180;
                        return `L ${x} ${y}`;
                      }).join(' ')} L 800 200 Z`}
                      fill="url(#equityGradient)"
                    />
                    
                    {/* Line */}
                    <path
                      d={equityCurve.map((val, i) => {
                        const x = (i / equityCurve.length) * 800;
                        const y = 200 - ((val - Math.min(...equityCurve)) / (Math.max(...equityCurve) - Math.min(...equityCurve))) * 180;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="rgb(34, 211, 238)"
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>
              <div className="absolute bottom-2 left-2 text-xs text-slate-500">
                Start: ${initialCapital}
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                End: ${result.finalBalance}
              </div>
            </div>
          </div>

          {/* Trade History */}
          {trades.length > 0 && (
            <div className="glass-card p-6 border border-white/5">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Activity size={16} />
                Recent Trades (Last 10)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400">Date</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400">Type</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400">Price</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400">Amount</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400">P&L</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {trades.map((trade, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 text-slate-300">{trade.date}</td>
                        <td className="py-2 px-3">
                          <span className={`font-bold ${trade.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">${trade.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">{trade.amount.toFixed(4)}</td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {trade.pnl !== 0 ? `$${trade.pnl.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            trade.status === 'WIN' ? 'bg-green-500/20 text-green-400' :
                            trade.status === 'LOSS' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
