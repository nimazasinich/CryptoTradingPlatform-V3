
import React, { useState, useEffect } from 'react';
import { Filter, Search, Download, Save, TrendingUp, BarChart3 } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { CryptoPrice } from '../../types';
import { CoinIcon } from '../Common/CoinIcon';
import { formatPrice, formatCompactNumber } from '../../utils/format';

export const MarketScanner = () => {
  const [coins, setCoins] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [minVolume, setMinVolume] = useState(10000000); // 10M
  const [minChange, setMinChange] = useState(-100);
  const [maxChange, setMaxChange] = useState(100);
  const [minMarketCap, setMinMarketCap] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const filteredCoins = coins.filter(c => {
    if (c.current_price < minPrice || c.current_price > maxPrice) return false;
    if (c.total_volume < minVolume) return false;
    if (c.price_change_percentage_24h < minChange || c.price_change_percentage_24h > maxChange) return false;
    if (c.market_cap < minMarketCap) return false;
    if (searchTerm && !c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).slice(0, 50); // Max 50 results

  const exportToCSV = () => {
    const headers = ['Rank', 'Symbol', 'Name', 'Price', '24h Change %', 'Volume', 'Market Cap'];
    const rows = filteredCoins.map(coin => [
      coin.market_cap_rank,
      coin.symbol.toUpperCase(),
      coin.name,
      coin.current_price,
      coin.price_change_percentage_24h.toFixed(2),
      coin.total_volume,
      coin.market_cap
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-scan-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const savePreset = () => {
    const preset = {
      minPrice, maxPrice, minVolume, minChange, maxChange, minMarketCap
    };
    localStorage.setItem('scanner_preset', JSON.stringify(preset));
    alert('Scan preset saved!');
  };

  const loadPreset = () => {
    const saved = localStorage.getItem('scanner_preset');
    if (saved) {
      const preset = JSON.parse(saved);
      setMinPrice(preset.minPrice || 0);
      setMaxPrice(preset.maxPrice || 1000000);
      setMinVolume(preset.minVolume || 10000000);
      setMinChange(preset.minChange || -100);
      setMaxChange(preset.maxChange || 100);
      setMinMarketCap(preset.minMarketCap || 0);
    }
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="text-purple-400" size={24} />
            Market Scanner
          </h2>
          <p className="text-slate-300 text-sm">Real-time opportunity finder with advanced filters</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={loadPreset}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-white/10"
          >
            <TrendingUp size={16} />
            Load Preset
          </button>
          <button 
            onClick={savePreset}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-sm font-medium transition-colors border border-cyan-500/30"
          >
            <Save size={16} />
            Save Preset
          </button>
          <button 
            onClick={exportToCSV}
            disabled={filteredCoins.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Search</label>
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Symbol or name..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Price Range ($)</label>
          <div className="flex gap-2">
            <input 
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              placeholder="Min"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <input 
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              placeholder="Max"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Min Volume</label>
          <select 
            value={minVolume} 
            onChange={(e) => setMinVolume(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value={0}>Any</option>
            <option value={1000000}>$1M+</option>
            <option value={10000000}>$10M+</option>
            <option value={50000000}>$50M+</option>
            <option value={100000000}>$100M+</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Change % (24h): {minChange}% to {maxChange}%</label>
          <div className="flex gap-2">
            <input 
              type="range"
              min="-50"
              max="100"
              value={minChange}
              onChange={(e) => setMinChange(Number(e.target.value))}
              className="flex-1 accent-purple-500"
            />
            <input 
              type="range"
              min="-50"
              max="100"
              value={maxChange}
              onChange={(e) => setMaxChange(Number(e.target.value))}
              className="flex-1 accent-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Min Market Cap</label>
          <select 
            value={minMarketCap} 
            onChange={(e) => setMinMarketCap(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value={0}>Any</option>
            <option value={1000000}>$1M+</option>
            <option value={10000000}>$10M+</option>
            <option value={100000000}>$100M+</option>
            <option value={1000000000}>$1B+</option>
            <option value={10000000000}>$10B+</option>
          </select>
        </div>

        <div className="flex items-end">
          <button 
            onClick={fetchCoins}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-purple-900/20"
          >
            <BarChart3 className="inline mr-2" size={16} />
            Run Scan
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-x-auto">
        <div className="mb-3 text-sm text-slate-300">
          Found <span className="text-white font-bold">{filteredCoins.length}</span> coins matching criteria
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-300 uppercase">Rank</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-300 uppercase">Asset</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-300 uppercase">Price</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-300 uppercase">24h Change</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-300 uppercase">Volume</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-300 uppercase">Market Cap</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-slate-300 uppercase">Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
               <tr><td colSpan={7} className="py-12 text-center text-slate-500">
                 <div className="flex flex-col items-center gap-3">
                   <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                   <span>Scanning market...</span>
                 </div>
               </td></tr>
            ) : filteredCoins.length === 0 ? (
               <tr><td colSpan={7} className="py-12 text-center text-slate-500">
                 <Filter className="mx-auto mb-3 text-slate-600" size={32} />
                 <div>No coins match your criteria. Try adjusting filters.</div>
               </td></tr>
            ) : (
               filteredCoins.map((coin, index) => (
                 <tr key={coin.id} className="hover:bg-white/5 transition-colors group">
                   <td className="py-3 px-4 text-slate-300 font-mono text-sm">#{coin.market_cap_rank}</td>
                   <td className="py-3 px-4">
                     <div className="flex items-center gap-3">
                       <CoinIcon symbol={coin.symbol} size="sm" />
                       <div>
                         <div className="font-bold text-white">{coin.symbol.toUpperCase()}</div>
                         <div className="text-xs text-slate-500">{coin.name}</div>
                       </div>
                     </div>
                   </td>
                   <td className="py-3 px-4 text-right font-mono text-sm text-white">{formatPrice(coin.current_price)}</td>
                   <td className={`py-3 px-4 text-right font-bold text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {coin.price_change_percentage_24h > 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                   </td>
                   <td className="py-3 px-4 text-right text-slate-300 text-sm">${formatCompactNumber(coin.total_volume)}</td>
                   <td className="py-3 px-4 text-right text-slate-300 text-sm">${formatCompactNumber(coin.market_cap)}</td>
                   <td className="py-3 px-4 text-center">
                     <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                       coin.price_change_percentage_24h > 5 ? 'bg-green-500/20 text-green-400' :
                       coin.price_change_percentage_24h < -5 ? 'bg-red-500/20 text-red-400' :
                       'bg-slate-500/20 text-slate-300'
                     }`}>
                       {coin.price_change_percentage_24h > 5 ? 'BULLISH' :
                        coin.price_change_percentage_24h < -5 ? 'BEARISH' : 'NEUTRAL'}
                     </span>
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
