
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle } from 'lucide-react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const OrderForm = ({ symbol, currentPrice }: { symbol: string, currentPrice: number }) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!price && currentPrice) setPrice(currentPrice.toString());
  }, [currentPrice]);

  useEffect(() => {
    const p = parseFloat(price) || 0;
    const a = parseFloat(amount) || 0;
    if (p && a) setTotal((p * a).toFixed(2));
    else setTotal('');
  }, [price, amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      alert(`Order Placed Successfully: ${side.toUpperCase()} ${amount} ${symbol} @ ${orderType === 'limit' ? price : 'MARKET'}`);
      setAmount('');
      setTotal('');
      setIsSubmitting(false);
    }, 1000);
  };

  const handlePercentageClick = (pct: number) => {
    // Mock balance calculation
    const balance = side === 'buy' ? 10000 : 0.5; // 10k USDT or 0.5 BTC
    const priceVal = parseFloat(price) || currentPrice;
    
    if (side === 'buy') {
      const maxBuy = (balance * (pct / 100)) / priceVal;
      setAmount(maxBuy.toFixed(6));
    } else {
      setAmount((balance * (pct / 100)).toFixed(6));
    }
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      {/* Side Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl mb-5">
        <button
          onClick={() => setSide('buy')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
            side === 'buy' ? "bg-green-600 text-white shadow-lg shadow-green-900/20" : "text-slate-400 hover:text-white"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
            side === 'sell' ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "text-slate-400 hover:text-white"
          )}
        >
          Sell
        </button>
      </div>

      {/* Order Type */}
      <div className="flex gap-6 text-sm font-medium text-slate-400 mb-5 px-1">
        <button 
          onClick={() => setOrderType('limit')}
          className={cn("hover:text-white transition-colors relative", orderType === 'limit' && "text-purple-400")}
        >
          Limit
          {orderType === 'limit' && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
        </button>
        <button 
          onClick={() => { setOrderType('market'); setPrice('Market'); }}
          className={cn("hover:text-white transition-colors relative", orderType === 'market' && "text-purple-400")}
        >
          Market
          {orderType === 'market' && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="space-y-1.5">
           <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price (USDT)</label>
           <div className="relative">
             <input 
               type="text" 
               value={price}
               onChange={e => { setOrderType('limit'); setPrice(e.target.value); }}
               disabled={orderType === 'market'}
               className="input-glass w-full text-right font-mono"
             />
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">USDT</span>
           </div>
        </div>

        <div className="space-y-1.5">
           <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount ({symbol})</label>
           <div className="relative">
             <input 
               type="number" 
               value={amount}
               onChange={e => setAmount(e.target.value)}
               className="input-glass w-full text-right font-mono"
               placeholder="0.00"
               step="0.0001"
             />
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{symbol}</span>
           </div>
        </div>

        {/* Percentage Slider */}
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map(pct => (
            <button 
              key={pct} 
              type="button"
              onClick={() => handlePercentageClick(pct)}
              className="bg-white/5 hover:bg-white/10 py-1.5 rounded-lg text-[10px] text-slate-300 font-mono transition-colors"
            >
              {pct}%
            </button>
          ))}
        </div>

        <div className="space-y-1.5 pt-2">
           <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total (USDT)</label>
           <input 
             type="text" 
             value={total}
             readOnly
             className="bg-slate-900/50 border border-white/5 w-full rounded-xl px-4 py-2.5 text-right font-mono text-slate-300 outline-none"
             placeholder="0.00"
           />
        </div>

        <div className="flex-1 min-h-[20px]" />

        <div className="flex justify-between text-xs text-slate-400 px-1 py-2 border-t border-white/5">
          <span>Available:</span>
          <span className="text-white font-mono">
            {side === 'buy' ? '10,000.00 USDT' : `0.5000 ${symbol}`}
          </span>
        </div>

        <button 
          type="submit"
          disabled={!amount || isSubmitting}
          className={cn(
            "w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            side === 'buy' 
              ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20" 
              : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/20"
          )}
        >
          {isSubmitting ? 'Placing Order...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
        </button>
      </form>
    </div>
  );
};
