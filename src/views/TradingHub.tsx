
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bot, Star, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { PriceChart } from '../components/Trading/PriceChart';
import { OrderBook } from '../components/Trading/OrderBook';
import { OrderForm } from '../components/Trading/OrderForm';
import { RecentTrades } from '../components/Trading/RecentTrades';
import { AutoTradingPanel } from '../components/Trading/AutoTradingPanel';
import { CoinIcon } from '../components/Common/CoinIcon';
import { tradingService, Position } from '../services/tradingService';
import { marketService } from '../services/marketService';
import { useApp } from '../context/AppContext';

const AVAILABLE_PAIRS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOGE', 'MATIC', 'LINK', 'DOT'];

const PositionRow = ({ pos, closePos }: { pos: Position, closePos: (s:string)=>void }) => {
  const pnlPercent = pos.entryPrice ? ((pos.unrealizedPnL / (pos.entryPrice * pos.amount)) * 100) : 0;
  
  return (
    <motion.tr 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="hover:bg-white/5 border-b border-white/5 last:border-0 text-sm transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <CoinIcon symbol={pos.symbol} size="xs" />
          <span className="font-bold text-white">{pos.symbol}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${pos.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {pos.side.toUpperCase()}
          </span>
        </div>
      </td>
      <td className="text-right font-mono text-slate-300">{pos.amount.toFixed(4)}</td>
      <td className="text-right font-mono text-slate-300">${(pos.entryPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td className="text-right">
        <div className="flex flex-col items-end">
          <span className={`font-mono font-bold ${pos.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toFixed(2)} USDT
          </span>
          <span className={`text-xs font-mono ${pnlPercent >= 0 ? 'text-green-400/60' : 'text-red-400/60'}`}>
            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
          </span>
        </div>
      </td>
      <td className="text-right px-4">
        <button 
          onClick={() => closePos(pos.symbol)}
          className="text-xs text-red-400 hover:text-white hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-all font-bold"
        >
          Close
        </button>
      </td>
    </motion.tr>
  );
};

export default function TradingHub() {
  const { addToast } = useApp();
  const [activeSymbol, setActiveSymbol] = useState('BTC');
  const [currentPrice, setCurrentPrice] = useState(65000);
  const [prevPrice, setPrevPrice] = useState(65000);
  const [priceChange24h, setPriceChange24h] = useState(2.45);
  const [volume24h, setVolume24h] = useState('452.2M');
  const [showBot, setShowBot] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        const buyBtn = document.querySelector('[data-action="buy"]') as HTMLButtonElement;
        buyBtn?.focus();
      }
      if (e.key === 's' || e.key === 'S') {
        const sellBtn = document.querySelector('[data-action="sell"]') as HTMLButtonElement;
        sellBtn?.focus();
      }
      if (e.key === 'Escape') {
        setShowBot(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Fetch real price with flash effect
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const rate = await marketService.getRate(`${activeSymbol}/USDT`);
        if (rate && rate.price) {
          setPrevPrice(currentPrice);
          setCurrentPrice(rate.price);
          
          // Get additional data
          const trending = await marketService.getTrendingCoins();
          const coin = trending.find(c => c.symbol.toUpperCase() === activeSymbol);
          if (coin) {
            setPriceChange24h(coin.price_change_percentage_24h || 0);
            setVolume24h(formatVolume(coin.total_volume));
          }
        } else {
          // Fallback to trending
          const trending = await marketService.getTrendingCoins();
          const coin = trending.find(c => c.symbol.toUpperCase() === activeSymbol);
          if (coin) {
            setPrevPrice(currentPrice);
            setCurrentPrice(coin.current_price);
            setPriceChange24h(coin.price_change_percentage_24h || 0);
            setVolume24h(formatVolume(coin.total_volume));
          }
        }
      } catch (e) {
        // Mock movement if offline
        setPrevPrice(currentPrice);
        setCurrentPrice(prev => prev * (1 + (Math.random() - 0.5) * 0.0005));
      }
    };
    
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => clearInterval(interval);
  }, [activeSymbol]);

  // Fetch Positions with real-time PnL calculation
  useEffect(() => {
    const loadPositions = async () => {
      const pos = await tradingService.getPositions();
      
      // Calculate real-time PnL based on current price
      const updated = pos.map(p => {
        const unrealizedPnL = (currentPrice - p.entryPrice) * p.amount * (p.side === 'long' ? 1 : -1);
        return {
          ...p,
          unrealizedPnL
        };
      });
      
      setPositions(updated);
    };
    
    loadPositions();
    const interval = setInterval(loadPositions, 2000);
    return () => clearInterval(interval);
  }, [currentPrice]);

  const formatVolume = (vol: number): string => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toFixed(2);
  };

  const closePosition = async (symbol: string) => {
    try {
      const result = await tradingService.closePosition(symbol);
      if (result) {
        addToast(
          `Position closed: ${result.pnl >= 0 ? '+' : ''}${result.pnl.toFixed(2)} USDT`,
          result.pnl >= 0 ? 'success' : 'error'
        );
      }
    } catch (error: any) {
      addToast(error.message || 'Failed to close position', 'error');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    addToast(
      isFavorite ? `Removed ${activeSymbol} from favorites` : `Added ${activeSymbol} to favorites`,
      'info'
    );
  };

  const priceFlashClass = currentPrice > prevPrice ? 'flash-green' : currentPrice < prevPrice ? 'flash-red' : '';

  return (
    <div className="h-[calc(100vh-6rem)] pb-4 animate-fade-in flex flex-col gap-3 max-w-[1920px] mx-auto">
      {/* Header Bar */}
      <div className="glass-card p-3 px-5 flex flex-wrap items-center justify-between gap-4 shrink-0">
         <div className="flex items-center gap-6 flex-wrap">
            {/* Symbol Selector */}
            <div className="group relative">
               <button className="flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-xl transition-all">
                 <CoinIcon symbol={activeSymbol} size="sm" />
                 <span className="font-bold text-lg text-white">{activeSymbol}/USDT</span>
                 <ChevronDown size={16} className="text-slate-500" />
               </button>
               
               {/* Dropdown Menu */}
               <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                  <div className="p-2 border-b border-white/10">
                    <input 
                      type="text" 
                      placeholder="Search pair..." 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {AVAILABLE_PAIRS.map(pair => (
                      <button 
                        key={pair}
                        onClick={() => {
                          setActiveSymbol(pair);
                          addToast(`Switched to ${pair}/USDT`, 'info');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                      >
                        <CoinIcon symbol={pair} size="xs" />
                        <div className="flex-1">
                          <div className="font-bold">{pair}/USDT</div>
                          <div className="text-xs text-slate-500">Spot</div>
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Price Stats */}
            <div className="hidden md:flex gap-8 text-xs border-l border-white/10 pl-6">
               <div>
                 <span className="text-slate-500 block mb-0.5 text-[10px] uppercase font-bold">Mark Price</span>
                 <span className={`font-mono font-bold text-base ${currentPrice >= prevPrice ? 'text-green-400' : 'text-red-400'} ${priceFlashClass}`}>
                   ${(currentPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                 </span>
               </div>
               <div>
                 <span className="text-slate-500 block mb-0.5 text-[10px] uppercase font-bold">24h Change</span>
                 <div className="flex items-center gap-1">
                   {priceChange24h >= 0 ? 
                     <TrendingUp size={14} className="text-green-400" /> : 
                     <TrendingDown size={14} className="text-red-400" />
                   }
                   <span className={`font-medium ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                   </span>
                 </div>
               </div>
               <div>
                 <span className="text-slate-500 block mb-0.5 text-[10px] uppercase font-bold">24h Volume</span>
                 <span className="text-slate-300 font-medium">{volume24h}</span>
               </div>
            </div>
         </div>

         {/* Action Buttons */}
         <div className="flex gap-2">
            <button 
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-all ${isFavorite ? 'text-yellow-400 bg-yellow-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title="Add to favorites"
            >
              <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            
            <button 
              onClick={() => setShowBot(!showBot)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 ${
                showBot 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30' 
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bot size={18} />
              <span className="hidden sm:inline">Auto-Trade</span>
            </button>
         </div>
      </div>

      {/* Main Trading Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
         {/* Left Panel: Chart & Positions (65-70%) */}
         <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3 min-h-0">
            {/* Price Chart */}
            <div className="flex-1 min-h-[400px]">
               <PriceChart symbol={activeSymbol} />
            </div>
            
            {/* Positions & Orders Panel */}
            <div className="h-56 glass-card flex flex-col shrink-0">
               {/* Tabs */}
               <div className="px-4 py-2 border-b border-white/5 flex gap-6 text-sm font-bold bg-slate-900/30">
                  <button 
                    onClick={() => setActiveTab('positions')}
                    className={`pb-2 transition-colors relative ${activeTab === 'positions' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Positions ({positions.length})
                    {activeTab === 'positions' && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                      />
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`pb-2 transition-colors relative ${activeTab === 'orders' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Open Orders (0)
                    {activeTab === 'orders' && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                      />
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 transition-colors relative ${activeTab === 'history' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Trade History
                    {activeTab === 'history' && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                      />
                    )}
                  </button>
               </div>
               
               {/* Content */}
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {activeTab === 'positions' && (
                      <motion.div
                        key="positions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <table className="w-full text-left border-collapse">
                          <thead className="text-xs text-slate-500 bg-black/20 sticky top-0 z-10">
                            <tr>
                              <th className="py-2 px-4 font-bold uppercase">Symbol</th>
                              <th className="py-2 px-4 font-bold uppercase text-right">Size</th>
                              <th className="py-2 px-4 font-bold uppercase text-right">Entry Price</th>
                              <th className="py-2 px-4 font-bold uppercase text-right">PnL</th>
                              <th className="py-2 px-4 font-bold uppercase text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-12 text-center">
                                  <div className="flex flex-col items-center gap-2 text-slate-500">
                                    <Activity size={32} className="opacity-30" />
                                    <p className="text-sm italic">No open positions</p>
                                    <p className="text-xs">Place an order to start trading</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              positions.map((p, i) => <PositionRow key={i} pos={p} closePos={closePosition} />)
                            )}
                          </tbody>
                        </table>
                      </motion.div>
                    )}
                    
                    {activeTab === 'orders' && (
                      <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="py-12 text-center text-slate-500"
                      >
                        <p className="text-sm italic">No open orders</p>
                      </motion.div>
                    )}
                    
                    {activeTab === 'history' && (
                      <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="py-12 text-center text-slate-500"
                      >
                        <p className="text-sm italic">No trade history</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
         </div>

         {/* Right Panel: Trading Controls (30-35%) */}
         <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-3 h-full overflow-hidden">
             <AnimatePresence mode="wait">
               {showBot ? (
                 <motion.div
                   key="bot"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="h-full"
                 >
                   <AutoTradingPanel symbol={activeSymbol} />
                 </motion.div>
               ) : (
                 <motion.div
                   key="manual"
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className="h-full flex flex-col gap-3"
                 >
                   <div className="h-1/2 min-h-[300px]">
                     <OrderBook symbol={activeSymbol} currentPrice={currentPrice} />
                   </div>
                   <div className="flex-1 min-h-[350px]">
                     <OrderForm symbol={activeSymbol} currentPrice={currentPrice} />
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
         </div>
      </div>
   </div>
  );
}
