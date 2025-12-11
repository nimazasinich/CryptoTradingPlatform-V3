
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bot, LayoutTemplate, Briefcase } from 'lucide-react';
import { PriceChart } from '../components/Trading/PriceChart';
import { OrderBook } from '../components/Trading/OrderBook';
import { OrderForm } from '../components/Trading/OrderForm';
import { RecentTrades } from '../components/Trading/RecentTrades';
import { AutoTradingPanel } from '../components/Trading/AutoTradingPanel';
import { CoinIcon } from '../components/Common/CoinIcon';
import { tradingService, Position } from '../services/tradingService';
import { marketService } from '../services/marketService';

const AVAILABLE_PAIRS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOGE'];

const PositionRow = ({ pos, closePos }: { pos: Position, closePos: (s:string)=>void }) => (
  <tr className="hover:bg-white/5 border-b border-white/5 last:border-0 text-sm">
    <td className="py-3 px-4 flex items-center gap-2">
      <CoinIcon symbol={pos.symbol} size="xs" />
      <span className="font-bold">{pos.symbol}</span>
      <span className={`text-[10px] px-1.5 rounded ${pos.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {pos.side.toUpperCase()}
      </span>
    </td>
    <td className="text-right font-mono">{pos.amount.toFixed(4)}</td>
    <td className="text-right font-mono text-slate-300">{(pos.entryPrice || 0).toLocaleString()}</td>
    <td className={`text-right font-mono font-bold ${pos.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
      {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toFixed(2)}
    </td>
    <td className="text-right">
      <button 
        onClick={() => closePos(pos.symbol)}
        className="text-xs text-red-400 hover:text-white hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
      >
        Close
      </button>
    </td>
  </tr>
);

export default function TradingHub() {
  const [activeSymbol, setActiveSymbol] = useState('BTC');
  const [currentPrice, setCurrentPrice] = useState(65000);
  const [showBot, setShowBot] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);

  // Fetch real price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const rate = await marketService.getRate(`${activeSymbol}/USDT`);
        if (rate && rate.price) setCurrentPrice(rate.price);
        else {
           // Fallback to trending
           const trending = await marketService.getTrendingCoins();
           const coin = trending.find(c => c.symbol.toUpperCase() === activeSymbol);
           if (coin) setCurrentPrice(coin.current_price);
        }
      } catch (e) {
        // Mock movement if offline
        setCurrentPrice(prev => prev * (1 + (Math.random() - 0.5) * 0.0005));
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => clearInterval(interval);
  }, [activeSymbol]);

  // Fetch Positions
  useEffect(() => {
    const loadPositions = async () => {
      const pos = await tradingService.getPositions();
      // Calculate mock PnL for display
      const updated = pos.map(p => ({
        ...p,
        unrealizedPnL: (currentPrice - p.entryPrice) * p.amount * (p.side === 'long' ? 1 : -1)
      }));
      setPositions(updated);
    };
    loadPositions();
    const interval = setInterval(loadPositions, 2000);
    return () => clearInterval(interval);
  }, [currentPrice]);

  const closePosition = async (symbol: string) => {
    await tradingService.closePosition(symbol);
    // State will update on next poll
  };

  return (
    <div className="h-[calc(100vh-6rem)] pb-4 animate-fade-in flex flex-col gap-3 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="glass-card p-2 px-4 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="group relative">
               <button className="flex items-center gap-2 hover:bg-white/5 p-2 rounded-lg transition-colors">
                 <CoinIcon symbol={activeSymbol} size="sm" />
                 <span className="font-bold text-lg text-white">{activeSymbol}/USDT</span>
                 <ChevronDown size={14} className="text-slate-500" />
               </button>
               {/* Dropdown */}
               <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                  {AVAILABLE_PAIRS.map(pair => (
                    <button 
                      key={pair}
                      onClick={() => setActiveSymbol(pair)}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 border-b border-white/5 last:border-0"
                    >
                      <CoinIcon symbol={pair} size="xs" />
                      {pair}/USDT
                    </button>
                  ))}
               </div>
            </div>

            <div className="hidden md:flex gap-8 text-xs border-l border-white/10 pl-6">
               <div>
                 <span className="text-slate-500 block mb-0.5">Mark Price</span>
                 <span className={`font-mono font-medium text-sm ${Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                   ${(currentPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                 </span>
               </div>
               <div>
                 <span className="text-slate-500 block mb-0.5">24h Change</span>
                 <span className="text-green-400 font-medium text-sm">+2.45%</span>
               </div>
               <div>
                 <span className="text-slate-500 block mb-0.5">24h Volume</span>
                 <span className="text-slate-300 font-medium text-sm">452.2M</span>
               </div>
            </div>
         </div>

         <div className="flex gap-2">
            <button 
              onClick={() => setShowBot(!showBot)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${showBot ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
              <Bot size={18} />
              Auto-Trade
            </button>
         </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
         {/* Left: Chart & Positions (70%) */}
         <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-3 min-h-0">
            {/* Chart */}
            <div className="flex-1 min-h-[400px]">
               <PriceChart symbol={activeSymbol} />
            </div>
            
            {/* Positions Panel (Bottom) */}
            <div className="h-48 glass-card flex flex-col shrink-0">
               <div className="px-4 py-2 border-b border-white/5 flex gap-4 text-sm font-bold text-slate-400">
                  <span className="text-white border-b-2 border-purple-500 pb-2">Positions ({positions.length})</span>
                  <span className="cursor-pointer hover:text-white pb-2">Open Orders (0)</span>
                  <span className="cursor-pointer hover:text-white pb-2">Trade History</span>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                     <thead className="text-xs text-slate-500 bg-black/20 sticky top-0 z-10">
                        <tr>
                           <th className="py-2 px-4 font-medium uppercase">Symbol</th>
                           <th className="py-2 px-4 font-medium uppercase text-right">Size</th>
                           <th className="py-2 px-4 font-medium uppercase text-right">Entry Price</th>
                           <th className="py-2 px-4 font-medium uppercase text-right">PnL (USDT)</th>
                           <th className="py-2 px-4 font-medium uppercase text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody>
                        {positions.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500 text-sm italic">
                                 No open positions
                              </td>
                           </tr>
                        ) : (
                           positions.map((p, i) => <PositionRow key={i} pos={p} closePos={closePosition} />)
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Right: Trading Panel (30%) */}
         <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
             {showBot ? (
               <AutoTradingPanel symbol={activeSymbol} />
             ) : (
               <>
                 <div className="h-1/2 min-h-[300px]">
                   <OrderBook symbol={activeSymbol} currentPrice={currentPrice} />
                 </div>
                 <div className="flex-1 min-h-[350px]">
                   <OrderForm symbol={activeSymbol} currentPrice={currentPrice} />
                 </div>
               </>
             )}
         </div>
      </div>
    </div>
  );
}
