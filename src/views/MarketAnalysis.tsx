
import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUp, ArrowDown, Star, LayoutGrid, Gauge, RefreshCcw, Download, Copy } from 'lucide-react';
import { marketService } from '../services/marketService';
import { CryptoPrice } from '../types';
import { CoinIcon } from '../components/Common/CoinIcon';
import { formatPrice, formatCompactNumber } from '../utils/format';
import { calculateRSI, calculateSMA, calculateMACD } from '../utils/indicators';
import { exportTable, copyToClipboard } from '../utils/exportTable';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { id: 'market', label: 'Market' },
  { id: 'trending', label: 'Trending' },
  { id: 'categories', label: 'Categories' },
  { id: 'technical', label: 'Technical' },
];

const TechnicalIndicatorCard = ({ title, value, status, description, color }: any) => {
  const isBullish = status === 'BUY' || status === 'STRONG_BUY';
  const isBearish = status === 'SELL' || status === 'STRONG_SELL';
  
  const statusColor = color || (isBullish ? "text-green-400" : isBearish ? "text-red-400" : "text-yellow-400");
  const bgStatus = color ? "bg-white/10" : (isBullish ? "bg-green-500/20" : isBearish ? "bg-red-500/20" : "bg-yellow-500/20");

  return (
    <div className="glass-card p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-slate-300 font-bold text-sm uppercase">{title}</h4>
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", bgStatus, statusColor)}>
          {status.replace('_', ' ')}
        </span>
      </div>
      <div>
        <div className="text-2xl font-mono text-white font-bold">{value}</div>
        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</div>
      </div>
    </div>
  );
};

export default function MarketAnalysis() {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState('market');
  const [searchQuery, setSearchQuery] = useState('');
  const [coins, setCoins] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [taData, setTaData] = useState<any>(null);
  const [selectedTaSymbol, setSelectedTaSymbol] = useState('BTC');

  const fetchTA = async (symbol: string) => {
    setLoading(true);
    try {
      // Get 100 hourly candles
      const history = await marketService.getHistory(symbol, '1h', 100);
      const closes = history.map((h: any) => Number(h.close || h.c));
      const currentPrice = closes[closes.length - 1];

      // Calculate Indicators
      const rsiSeries = calculateRSI(closes, 14);
      const currentRSI = rsiSeries[rsiSeries.length - 1];

      const macdData = calculateMACD(closes);
      const currentMACD = macdData.histogram[macdData.histogram.length - 1];

      const sma50Series = calculateSMA(closes, 50);
      const currentSMA50 = sma50Series[sma50Series.length - 1];

      // Determine Signals
      let rsiSignal = 'NEUTRAL';
      if (currentRSI > 70) rsiSignal = 'SELL';
      if (currentRSI < 30) rsiSignal = 'BUY';

      let macdSignal = 'NEUTRAL';
      if (currentMACD > 0 && macdData.histogram[macdData.histogram.length - 2] < 0) macdSignal = 'BUY';
      if (currentMACD < 0 && macdData.histogram[macdData.histogram.length - 2] > 0) macdSignal = 'SELL';

      let smaSignal = 'NEUTRAL';
      if (currentPrice > currentSMA50) smaSignal = 'BUY';
      else smaSignal = 'SELL';

      // Summary
      let score = 0;
      if (rsiSignal === 'BUY') score++;
      if (rsiSignal === 'SELL') score--;
      if (macdSignal === 'BUY') score++;
      if (macdSignal === 'SELL') score--;
      if (smaSignal === 'BUY') score++;
      if (smaSignal === 'SELL') score--;

      let summary = 'NEUTRAL';
      if (score >= 2) summary = 'STRONG_BUY';
      if (score === 1) summary = 'BUY';
      if (score === -1) summary = 'SELL';
      if (score <= -2) summary = 'STRONG_SELL';

      setTaData({
        price: currentPrice,
        rsi: { value: currentRSI.toFixed(2), signal: rsiSignal },
        macd: { value: currentMACD.toFixed(4), signal: macdSignal },
        sma: { value: currentSMA50.toFixed(2), signal: smaSignal },
        summary
      });

    } catch (e) {
      console.error("Failed to calculate TA", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setCoins([]);
    try {
      if (activeTab === 'technical') {
        await fetchTA(selectedTaSymbol);
      } else {
        let data: CryptoPrice[] = [];
        if (activeTab === 'market') {
          data = await marketService.getTopCoins(100);
        } else if (activeTab === 'trending') {
          data = await marketService.getTrendingCoins();
        } else if (activeTab === 'categories') {
          data = await marketService.getTopCoins(20); 
        }
        setCoins(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedTaSymbol]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Market Analysis</h1>
           <p className="text-slate-300">Deep dive into crypto market data and trends.</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'technical' ? (
         <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOGE', 'AVAX'].map(sym => (
                <button
                  key={sym}
                  onClick={() => setSelectedTaSymbol(sym)}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-bold transition-all",
                    selectedTaSymbol === sym 
                      ? "bg-white/10 border-purple-500 text-white" 
                      : "bg-slate-900/50 border-white/5 text-slate-300 hover:border-white/20"
                  )}
                >
                  {sym}
                </button>
              ))}
            </div>

            {loading || !taData ? (
               <div className="glass-card p-12 text-center animate-pulse">
                 Calculating Technical Indicators...
               </div>
            ) : (
              <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8 border-b border-white/5 pb-6">
                   <CoinIcon symbol={selectedTaSymbol} size="xl" />
                   <div>
                     <h2 className="text-2xl font-bold text-white">{selectedTaSymbol} Technical Analysis</h2>
                     <div className="flex gap-4 text-sm mt-1">
                        <span className="text-slate-300">Price: <span className="text-white font-mono">${taData.price?.toLocaleString()}</span></span>
                        <span className={cn("font-bold", 
                          taData.summary.includes('BUY') ? "text-green-400" : taData.summary.includes('SELL') ? "text-red-400" : "text-yellow-400"
                        )}>
                          {taData.summary.replace('_', ' ')}
                        </span>
                     </div>
                   </div>
                   <div className="ml-auto">
                      <button onClick={() => fetchTA(selectedTaSymbol)} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white">
                        <RefreshCcw size={20} />
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <TechnicalIndicatorCard 
                      title="Relative Strength (RSI)" 
                      value={taData.rsi.value} 
                      status={taData.rsi.signal} 
                      description={taData.rsi.value > 70 ? "Overbought zone" : taData.rsi.value < 30 ? "Oversold zone" : "Neutral momentum"}
                   />
                   <TechnicalIndicatorCard 
                      title="MACD Histogram" 
                      value={taData.macd.value} 
                      status={taData.macd.signal} 
                      description={taData.macd.value > 0 ? "Positive momentum increasing" : "Negative momentum dominant"}
                   />
                   <TechnicalIndicatorCard 
                      title="SMA (50)" 
                      value={`$${Number(taData.sma.value).toLocaleString()}`} 
                      status={taData.sma.signal} 
                      description={taData.price > taData.sma.value ? "Price above moving average (Bullish)" : "Price below moving average (Bearish)"}
                   />
                   <TechnicalIndicatorCard 
                      title="Overall Sentiment" 
                      value={taData.summary.replace('_', ' ')} 
                      status={taData.summary} 
                      color={taData.summary.includes('BUY') ? "text-green-400" : "text-red-400"}
                      description="Aggregated signal from all indicators"
                   />
                </div>
              </div>
            )}
         </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="glass-card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search coins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-glass w-full pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await copyToClipboard(coins);
                    addToast('Copied to clipboard!', 'success');
                  } catch (e) {
                    addToast('Failed to copy', 'error');
                  }
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-slate-300 flex items-center gap-2 transition-colors"
                title="Copy to clipboard"
              >
                <Copy size={16} />
                Copy
              </button>
              <button
                onClick={() => {
                  exportTable(coins, {
                    filename: `market_${activeTab}_${new Date().toISOString().split('T')[0]}`,
                    format: 'csv'
                  });
                  addToast('Exported to CSV!', 'success');
                }}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors"
                title="Export to CSV"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="space-y-4">
               {[...Array(10)].map((_, i) => (
                 <div key={i} className="h-16 skeleton rounded-xl" />
               ))}
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">24h Change</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Market Cap</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Volume (24h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {coins.filter(c => c.symbol.toLowerCase().includes(searchQuery.toLowerCase())).map((coin) => (
                      <tr key={coin.id} className="hover:bg-white/5 transition-colors cursor-pointer group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-mono text-xs w-6">{coin.market_cap_rank}</span>
                            <CoinIcon symbol={coin.symbol} size="md" />
                            <div>
                              <div className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                {coin.name}
                              </div>
                              <div className="text-xs text-slate-500 uppercase">{coin.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-white font-mono">
                          {formatPrice(coin.current_price)}
                        </td>
                        <td className={cn(
                          "px-6 py-4 whitespace-nowrap text-right text-sm font-bold",
                          coin.price_change_percentage_24h >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          <div className="flex items-center justify-end gap-1">
                            {coin.price_change_percentage_24h >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-300 font-mono">
                          ${formatCompactNumber(coin.market_cap)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-300 font-mono">
                          ${formatCompactNumber(coin.total_volume)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
