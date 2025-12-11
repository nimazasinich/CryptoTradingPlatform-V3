
import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Trade {
  price: number;
  amount: number;
  time: string;
  side: 'buy' | 'sell';
}

export const RecentTrades = ({ symbol, currentPrice }: { symbol: string, currentPrice: number }) => {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (!currentPrice) return;

    // Initial population
    const initialTrades: Trade[] = Array.from({ length: 20 }).map((_, i) => ({
      price: currentPrice * (1 + (Math.random() - 0.5) * 0.002),
      amount: Math.random() * (currentPrice > 1000 ? 0.5 : 1000),
      time: new Date(Date.now() - i * 5000).toLocaleTimeString(),
      side: Math.random() > 0.5 ? 'buy' : 'sell'
    }));
    setTrades(initialTrades);

    // Live update simulation
    const interval = setInterval(() => {
      const newTrade: Trade = {
        price: currentPrice * (1 + (Math.random() - 0.5) * 0.001),
        amount: Math.random() * (currentPrice > 1000 ? 0.2 : 500),
        time: new Date().toLocaleTimeString(),
        side: Math.random() > 0.5 ? 'buy' : 'sell'
      };
      setTrades(prev => [newTrade, ...prev.slice(0, 19)]);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-white/5 font-semibold text-sm text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Recent Trades</span>
          <span className="text-[9px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase" title="This trade feed uses simulated data for demonstration">
            Demo Data
          </span>
        </div>
      </div>
      
      <div className="flex justify-between px-3 py-2 text-xs text-slate-500 font-medium">
        <span className="w-1/3 text-left">Price</span>
        <span className="w-1/3 text-right">Amount</span>
        <span className="w-1/3 text-right">Time</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {trades.map((trade, i) => (
           <div key={i} className="flex justify-between px-3 py-1 text-xs hover:bg-white/5 cursor-pointer">
             <span className={cn("w-1/3 font-mono", trade.side === 'buy' ? "text-green-400" : "text-red-400")}>
               {trade.price.toLocaleString(undefined, {minimumFractionDigits: 2})}
             </span>
             <span className="w-1/3 text-right text-slate-300">
               {trade.amount.toFixed(4)}
             </span>
             <span className="w-1/3 text-right text-slate-500">
               {trade.time}
             </span>
           </div>
         ))}
      </div>
    </div>
  );
};
