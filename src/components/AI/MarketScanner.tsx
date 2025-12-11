
import React, { useState, useEffect } from 'react';
import { Filter, Search, ArrowRight } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { CryptoPrice } from '../../types';
import { CoinIcon } from '../Common/CoinIcon';
import { formatPrice, formatCompactNumber } from '../../utils/format';

export const MarketScanner = () => {
  const [coins, setCoins] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [minVolume, setMinVolume] = useState(10000000); // 10M
  const [minChange, setMinChange] = useState(0);
  
  const fetchCoins = async () => {
    try {
      setLoading(true);
      const data = await marketService.getTopCoins(100);
      if (Array.isArray(data)) {
        setCoins(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, []);

  const filteredCoins = coins.filter(c => 
    c.total_volume >= minVolume && 
    c.price_change_percentage_24h >= minChange
  );

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter className="text-purple-400" size={24} />
            Market Scanner
          </h2>
          <p className="text-slate-400 text-sm">Real-time opportunity finder based on volume and volatility.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
             <label className="text-[10px] uppercase text-slate-500 font-bold">Min Volume</label>
             <select 
               value={minVolume} 
               onChange={(e) => setMinVolume(Number(e.target.value))}
               className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
             >
               <option value={1000000}>$1M+</option>
               <option value={10000000}>$10M+</option>
               <option value={50000000}>$50M+</option>
               <option value={100000000}>$100M+</option>
             </select>
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-[10px] uppercase text-slate-500 font-bold">Min Change (24h)</label>
             <select 
               value={minChange} 
               onChange={(e) => setMinChange(Number(e.target.value))}
               className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
             >
               <option value={-100}>Any</option>
               <option value={0}>Positive (>0%)</option>
               <option value={5}>Strong (>5%)</option>
               <option value={10}>Pump (>10%)</option>
             </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Asset</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Price</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">24h Change</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Volume</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
               <tr><td colSpan={5} className="py-8 text-center text-slate-500">Scanning market...</td></tr>
            ) : filteredCoins.length === 0 ? (
               <tr><td colSpan={5} className="py-8 text-center text-slate-500">No coins match your criteria.</td></tr>
            ) : (
               filteredCoins.map(coin => (
                 <tr key={coin.id} className="hover:bg-white/5 transition-colors group">
                   <td className="py-3 px-4">
                     <div className="flex items-center gap-3">
                       <CoinIcon symbol={coin.symbol} size="sm" />
                       <span className="font-bold text-white">{coin.symbol.toUpperCase()}</span>
                     </div>
                   </td>
                   <td className="py-3 px-4 text-right font-mono text-sm">{formatPrice(coin.current_price)}</td>
                   <td className={`py-3 px-4 text-right font-bold text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {coin.price_change_percentage_24h > 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                   </td>
                   <td className="py-3 px-4 text-right text-slate-300 text-sm">${formatCompactNumber(coin.total_volume)}</td>
                   <td className="py-3 px-4 text-right">
                     <button className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg transition-colors">
                       Analyze
                     </button>
                   </td>
                 </tr>
               ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
