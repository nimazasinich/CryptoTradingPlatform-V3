
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  BarChart3, 
  Bitcoin, 
  Coins 
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePriceUpdates, useSentimentUpdates } from '../hooks/useWebSocket';
import { PriceTicker } from '../components/Dashboard/PriceTicker';
import { MarketOverview } from '../components/Dashboard/MarketOverview';
import { SentimentGauge } from '../components/Dashboard/SentimentGauge';
import { NewsFeed } from '../components/Dashboard/NewsFeed';
import { formatCompactNumber } from '../utils/format';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const Sparkline = ({ data, color, isPositive }: { data: number[], color: string, isPositive: boolean }) => {
  if (!data || data.length === 0) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const height = 40;
  const width = 100;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible opacity-50">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
      <path 
        d={`M0,${height} L0,${points.split(' ')[0].split(',')[1]} ${points.split(' ').map(p => 'L' + p).join(' ')} L${width},${height} Z`} 
        fill={`url(#gradient-${color})`} 
        style={{ fill: color, fillOpacity: 0.1 }}
      />
    </svg>
  );
};

const SkeletonCard = () => (
  <div className="glass-card p-6 h-[180px] flex flex-col justify-between relative overflow-hidden bg-white/5 border border-white/5">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 rounded-2xl bg-white/5 animate-pulse" />
      <div className="w-20 h-6 rounded-full bg-white/5 animate-pulse" />
    </div>
    <div className="space-y-3 mt-4">
      <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
      <div className="w-32 h-10 rounded bg-white/5 animate-pulse" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" />
  </div>
);

const StatCard = ({ 
  title, 
  value, 
  prefix = '', 
  suffix = '', 
  change, 
  icon: Icon, 
  chartData,
  delay = 0,
  type = 'currency' 
}: { 
  title: string, 
  value: number, 
  prefix?: string, 
  suffix?: string,
  change?: number, 
  icon: React.ElementType, 
  chartData?: number[],
  delay?: number,
  type?: 'currency' | 'percent' | 'number'
}) => {
  const isPositive = (change || 0) >= 0;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  const bgClass = isPositive ? 'bg-green-400/10 border-green-400/20' : 'bg-red-400/10 border-red-400/20';
  
  const iconGradient = 
    title.includes('Bitcoin') ? 'from-[#F7931A] to-orange-500' :
    title.includes('Volume') ? 'from-cyan-400 to-blue-500' :
    title.includes('Active') ? 'from-purple-500 to-pink-500' :
    'from-emerald-400 to-teal-500';

  const safeValue = value ?? 0;
  const displayValue = type === 'currency' 
    ? formatCompactNumber(safeValue) 
    : safeValue.toLocaleString(undefined, { maximumFractionDigits: type === 'percent' ? 2 : 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className="relative group h-[180px]"
    >
      {/* Animated Gradient Border */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 opacity-30 group-hover:opacity-100 blur-sm transition-opacity duration-500 animate-text-flow" />
      
      <div className="absolute inset-0 bg-slate-950/80 rounded-2xl backdrop-blur-xl" />

      <div className="relative h-full glass-card p-6 overflow-hidden transition-transform duration-300 group-hover:-translate-y-1 bg-white/[0.03]">
        {/* Glow Effect */}
        <div className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity group-hover:opacity-40",
          iconGradient.replace('from-', 'bg-')
        )} />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className={cn(
            "p-3 rounded-2xl bg-gradient-to-br shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300", 
            iconGradient
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          {change !== undefined && (
            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-sm", bgClass, colorClass)}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(change).toFixed(2)}%</span>
            </div>
          )}

          {/* Circular Progress for Dominance */}
          {title.includes('Dominance') && (
             <div className="absolute right-0 top-0 w-20 h-20 opacity-20">
               <svg viewBox="0 0 36 36" className="w-full h-full rotate-180">
                 <path
                   className="text-white/10"
                   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="4"
                 />
                 <path
                   className="text-yellow-500"
                   strokeDasharray={`${safeValue}, 100`}
                   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="4"
                 />
               </svg>
             </div>
          )}
        </div>

        <div className="space-y-1 z-10 relative">
          <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider truncate">{title}</h3>
          <div className="text-3xl font-bold text-white tracking-tight drop-shadow-md break-words overflow-hidden">
            {prefix}{displayValue}{suffix}
          </div>
        </div>

        {chartData && (
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-60 transition-opacity duration-300 mask-image-gradient">
            <Sparkline 
              data={chartData} 
              color={isPositive ? '#4ade80' : '#f87171'} 
              isPositive={isPositive} 
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const { marketOverview, topCoins, loading, error } = useDashboardData();
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('dashboardLiveUpdates');
    return saved !== 'false'; // Default to true
  });

  const btcSparkline = topCoins.find(c => c.symbol.toLowerCase() === 'btc')?.sparkline_in_7d?.price || [];
  const ethSparkline = topCoins.find(c => c.symbol.toLowerCase() === 'eth')?.sparkline_in_7d?.price || [];

  // Feature 1.1.1: Real-time price updates via WebSocket
  usePriceUpdates((data) => {
    try {
      if (data && data.prices) {
        setIsLiveUpdating(true);
        // Briefly show live indicator
        setTimeout(() => setIsLiveUpdating(false), 2000);
        // Note: Price updates are handled by the PriceTicker component itself
        // This just provides the visual feedback that updates are happening
      }
    } catch (error) {
      console.error('Price update error:', error);
    }
  }, liveEnabled);

  // Feature 1.1.1: Real-time sentiment updates via WebSocket
  useSentimentUpdates((data) => {
    try {
      if (data) {
        // The SentimentGauge component will handle its own updates
        // This provides additional notification capability if needed
        console.log('Sentiment updated:', data);
      }
    } catch (error) {
      console.error('Sentiment update error:', error);
    }
  }, liveEnabled);

  // Save live updates preference
  useEffect(() => {
    localStorage.setItem('dashboardLiveUpdates', String(liveEnabled));
  }, [liveEnabled]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            {liveEnabled && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className={cn(
                  "w-2 h-2 rounded-full bg-green-500 transition-all duration-500",
                  isLiveUpdating && "animate-ping"
                )} />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>
          <p className="text-slate-300 text-sm">Real-time market insights and portfolio tracking.</p>
        </div>
        
        {/* Live Updates Toggle */}
        <button
          onClick={() => setLiveEnabled(!liveEnabled)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            liveEnabled
              ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
          )}
          title={liveEnabled ? "Disable live updates" : "Enable live updates"}
        >
          <Activity size={16} className={liveEnabled ? "animate-pulse" : ""} />
          {liveEnabled ? "Live Updates On" : "Live Updates Off"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 grid-mobile stack-mobile">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div className="col-span-4 p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-center backdrop-blur-md">
            {error}. Retrying automatically...
          </div>
        ) : marketOverview ? (
          <>
            <div className="stat-card-mobile">
              <StatCard
                title="Total Market Cap"
                value={marketOverview.total_market_cap}
                prefix="$"
                change={marketOverview.market_cap_change_percentage_24h}
                icon={DollarSign}
                chartData={btcSparkline}
                delay={0}
                type="currency"
              />
            </div>
            <div className="stat-card-mobile">
              <StatCard
                title="24h Volume"
                value={marketOverview.total_volume_24h}
                prefix="$"
                change={marketOverview.volume_change_percentage_24h}
                icon={BarChart3}
                chartData={ethSparkline}
                delay={1}
                type="currency"
              />
            </div>
            <div className="stat-card-mobile">
              <StatCard
                title="BTC Dominance"
                value={marketOverview.btc_dominance}
                suffix="%"
                icon={Bitcoin}
                type="percent"
                delay={2}
              />
            </div>
            <div className="stat-card-mobile">
              <StatCard
                title="Active Coins"
                value={marketOverview.active_cryptocurrencies}
                suffix="+"
                icon={Coins}
                type="number"
                delay={3}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Price Ticker */}
      <div className="w-full -mx-4 md:-mx-8 lg:-mx-8 px-4 md:px-8 lg:px-8 relative z-20">
        <div className="mb-4 flex items-center gap-2">
           <div className="p-1.5 rounded-lg bg-purple-500/10">
             <Activity className="w-4 h-4 text-purple-400" />
           </div>
           <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live Prices</span>
        </div>
        <div className="glass-panel border-y border-white/5 bg-black/20 backdrop-blur-sm py-4">
           <PriceTicker />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         <div className="xl:col-span-2 space-y-6 h-full">
           <div className="h-full">
             <MarketOverview />
           </div>
         </div>

         <div className="flex flex-col gap-6 h-full">
            <div className="h-[220px] flex-shrink-0">
               <SentimentGauge />
            </div>
            <div className="flex-1 min-h-[400px]">
               <NewsFeed />
            </div>
         </div>
      </div>
    </div>
  );
}
