
import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { wsOrderBook, OrderBookLevel } from '../../services/websocketOrderBook';
import { Wifi, WifiOff } from 'lucide-react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface OrderRow {
  price: number;
  amount: number;
  total: number;
  percent: number;
}

export const OrderBook = ({ symbol, currentPrice }: { symbol: string, currentPrice: number }) => {
  const [bids, setBids] = useState<OrderRow[]>([]);
  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true);

  useEffect(() => {
    if (!useWebSocket) {
      // Fallback to simulated data
      generateSimulatedData();
      return;
    }

    // Connect to WebSocket
    wsOrderBook.connect(symbol);
    setIsConnected(wsOrderBook.isConnected());

    // Subscribe to updates
    const unsubscribe = wsOrderBook.subscribe((data) => {
      setBids(data.bids);
      setAsks(data.asks);
      setIsConnected(true);
    });

    // Check connection status
    const statusCheck = setInterval(() => {
      setIsConnected(wsOrderBook.isConnected());
    }, 1000);

    return () => {
      unsubscribe();
      wsOrderBook.disconnect();
      clearInterval(statusCheck);
    };
  }, [symbol, useWebSocket]);

  const generateSimulatedData = () => {
    const safePrice = currentPrice || 0;
    if (!safePrice) return;

    const generateDepth = (type: 'bid' | 'ask') => {
      let rows: OrderRow[] = [];
      let accumulated = 0;
      const baseAmount = safePrice > 1000 ? 0.2 : 500;
      
      for (let i = 0; i < 15; i++) {
        const spread = (i + 1) * (safePrice * 0.0003);
        const price = type === 'bid' ? safePrice - spread : safePrice + spread;
        const amount = baseAmount * (0.5 + Math.random() * 2);
        accumulated += amount;
        
        rows.push({
          price,
          amount,
          total: accumulated,
          percent: 0
        });
      }
      
      const maxTotal = accumulated;
      rows = rows.map(r => ({ ...r, percent: Math.min(100, (r.total / maxTotal) * 100) }));
      
      return type === 'ask' ? rows.reverse() : rows;
    };

    setBids(generateDepth('bid'));
    setAsks(generateDepth('ask'));
    
    const interval = setInterval(() => {
      setBids(prev => prev.map(r => ({...r, amount: r.amount * (0.9 + Math.random() * 0.2)})));
      setAsks(prev => prev.map(r => ({...r, amount: r.amount * (0.9 + Math.random() * 0.2)})));
    }, 1000);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (!useWebSocket) {
      const cleanup = generateSimulatedData();
      return cleanup;
    }
  }, [currentPrice, useWebSocket]);

  const Row = ({ row, type }: { row: OrderRow, type: 'bid' | 'ask' }) => (
    <div className="flex justify-between text-xs py-0.5 relative group hover:bg-white/5 cursor-pointer select-none">
      {/* Depth Bar */}
      <div 
        className={cn(
          "absolute top-0 bottom-0 opacity-10 transition-all duration-300 ease-out",
          type === 'bid' ? "bg-green-500 right-0 origin-right" : "bg-red-500 left-0 origin-left"
        )}
        style={{ width: `${row.percent}%` }}
      />
      <span className={cn("z-10 font-mono w-1/3 text-left pl-3 font-medium", type === 'bid' ? "text-green-400" : "text-red-400")}>
        {(row.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
      </span>
      <span className="z-10 text-slate-300 w-1/3 text-right font-mono">
        {row.amount.toFixed(4)}
      </span>
      <span className="z-10 text-slate-500 w-1/3 text-right pr-3 font-mono opacity-60">
        {row.total.toFixed(2)}
      </span>
    </div>
  );

  const spread = asks.length && bids.length ? asks[asks.length-1].price - bids[0].price : 0;
  const spreadPercent = currentPrice ? (spread / currentPrice) * 100 : 0;

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden border-t-4 border-t-purple-500/50">
      <div className="p-3 border-b border-white/5 font-semibold text-sm text-slate-300 flex justify-between bg-slate-900/30">
        <div className="flex items-center gap-2">
          <span>Order Book</span>
          {isConnected && useWebSocket ? (
            <span className="text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase flex items-center gap-1" title="Connected to Binance WebSocket">
              <Wifi size={10} />
              Live
            </span>
          ) : useWebSocket ? (
            <span className="text-[9px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase flex items-center gap-1 animate-pulse" title="Connecting...">
              <WifiOff size={10} />
              Connecting
            </span>
          ) : (
            <span className="text-[9px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase" title="Using simulated data">
              Demo
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
           <button
             onClick={() => setUseWebSocket(!useWebSocket)}
             className="text-[10px] text-slate-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
             title={useWebSocket ? 'Switch to demo mode' : 'Connect to live data'}
           >
             {useWebSocket ? 'Live' : 'Demo'}
           </button>
           <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">0.01</span>
        </div>
      </div>
      
      <div className="flex justify-between px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-white/5 bg-slate-950/20">
        <span className="w-1/3 text-left pl-1">Price(USDT)</span>
        <span className="w-1/3 text-right">Amount({symbol})</span>
        <span className="w-1/3 text-right pr-1">Total</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {/* @ts-ignore - React key prop is handled internally */}
        {asks.map((row: OrderRow, i: number) => <Row key={i} row={row} type="ask" />)}
      </div>

      <div className="py-2 px-4 my-1 bg-[#0b0e16] border-y border-white/5 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2">
           <span className={cn("text-lg font-bold font-mono tracking-tight", Math.random() > 0.5 ? "text-green-400" : "text-red-400")}>
             {(currentPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} 
           </span>
           <span className="text-xs text-slate-500">≈ ${(currentPrice || 0).toLocaleString()}</span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
           Spread: <span className="text-slate-300">{spreadPercent.toFixed(3)}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* @ts-ignore - React key prop is handled internally */}
        {bids.map((row: OrderRow, i: number) => <Row key={i} row={row} type="bid" />)}
      </div>
    </div>
  );
};
