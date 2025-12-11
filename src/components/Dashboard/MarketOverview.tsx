
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { CryptoPrice } from '../../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CoinIcon } from '../Common/CoinIcon';
import { formatPrice, formatCompactNumber } from '../../utils/format';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Sub-components ---

const SectionHeader = ({ title, icon: Icon, color }: { title: string; icon: any; color: string }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg bg-white/5", color)}>
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-lg text-white">{title}</h3>
    </div>
    <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors group">
      View All 
      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
    </button>
  </div>
);

const CoinRow = ({ coin, rank, type }: { coin: CryptoPrice; rank: number; type: 'gainer' | 'loser' }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.05 }}
    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
  >
    <div className="flex items-center gap-3">
      <span className="text-slate-500 text-sm font-mono w-4">{rank}</span>
      <CoinIcon symbol={coin.symbol} size="md" />
      <div>
        <div className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors">{coin.symbol.toUpperCase()}</div>
        <div className="text-xs text-slate-500">{coin.name}</div>
      </div>
    </div>
    <div className="text-right">
      <div className="font-mono text-sm font-medium text-slate-200">
        {formatPrice(coin.current_price)}
      </div>
      <div className={cn(
        "text-xs font-semibold flex items-center justify-end gap-1",
        type === 'gainer' ? "text-green-400" : "text-red-400"
      )}>
        {type === 'gainer' ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
      </div>
    </div>
  </motion.div>
);

const VolumeRow = ({ coin, rank, maxVolume }: { coin: CryptoPrice; rank: number; maxVolume: number }) => {
  const percentage = (coin.total_volume / maxVolume) * 100;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm font-mono w-4">{rank}</span>
          <CoinIcon symbol={coin.symbol} size="sm" />
          <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{coin.symbol.toUpperCase()}</span>
        </div>
        <span className="font-mono text-xs text-slate-300">
          ${formatCompactNumber(coin.total_volume)}
        </span>
      </div>
      
      {/* Progress Bar Background */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.5 + (rank * 0.1) }}
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
        />
      </div>
    </motion.div>
  );
};

const SkeletonList = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between p-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="w-12 h-3 rounded bg-white/5 animate-pulse" />
            <div className="w-20 h-2 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <div className="w-16 h-3 rounded bg-white/5 animate-pulse" />
          <div className="w-10 h-2 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export const MarketOverview = () => {
  const [data, setData] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Use service layer which handles parsing logic
      const result = await marketService.getTopCoins(50);
      
      if (Array.isArray(result) && result.length > 0) {
        setData(result);
        setError(null);
      } else {
        throw new Error('No market data available');
      }
    } catch (err) {
      console.error('Market Overview Error:', err);
      setError('Could not load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sort Data
  const gainers = [...data].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 5);
  const losers = [...data].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 5);
  const volumeLeaders = [...data].sort((a, b) => b.total_volume - a.total_volume).slice(0, 5);
  const maxVolume = volumeLeaders[0]?.total_volume || 1;

  if (error && data.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-red-300 border-red-500/20 bg-red-500/5">
        <p>{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Top Gainers */}
      <div className="glass-card p-6">
        <SectionHeader title="Top Gainers" icon={TrendingUp} color="text-green-400" />
        {loading && data.length === 0 ? <SkeletonList /> : (
          <div className="space-y-1">
            {gainers.map((coin, index) => (
              <CoinRow key={coin.id} coin={coin} rank={index + 1} type="gainer" />
            ))}
          </div>
        )}
      </div>

      {/* Top Losers */}
      <div className="glass-card p-6">
        <SectionHeader title="Top Losers" icon={TrendingDown} color="text-red-400" />
        {loading && data.length === 0 ? <SkeletonList /> : (
          <div className="space-y-1">
            {losers.map((coin, index) => (
              <CoinRow key={coin.id} coin={coin} rank={index + 1} type="loser" />
            ))}
          </div>
        )}
      </div>

      {/* Volume Leaders */}
      <div className="glass-card p-6">
        <SectionHeader title="Volume Leaders" icon={BarChart2} color="text-cyan-400" />
        {loading && data.length === 0 ? <SkeletonList /> : (
          <div className="space-y-2">
            {volumeLeaders.map((coin, index) => (
              <VolumeRow key={coin.id} coin={coin} rank={index + 1} maxVolume={maxVolume} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
