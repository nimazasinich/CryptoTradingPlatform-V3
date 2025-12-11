
import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { CryptoPrice } from '../../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CoinIcon } from '../Common/CoinIcon';
import { formatPrice } from '../../utils/format';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TickerSparkline = ({ data, isPositive }: { data: number[], isPositive: boolean }) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 30;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible ml-4 opacity-70 group-hover:opacity-100 transition-opacity">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <polyline
        fill="none"
        stroke={isPositive ? '#4ade80' : '#f87171'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        filter="url(#glow)"
      />
    </svg>
  );
};

const TickerItem = ({ coin }: { coin: CryptoPrice }) => {
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);
  const prevPriceRef = useRef(coin.current_price);

  useEffect(() => {
    if (coin.current_price > prevPriceRef.current) {
      setFlash('green');
    } else if (coin.current_price < prevPriceRef.current) {
      setFlash('red');
    }
    prevPriceRef.current = coin.current_price;

    const timer = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(timer);
  }, [coin.current_price]);

  const priceChange = coin.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;
  const sparklineData = coin.sparkline_in_7d?.price || [];

  return (
    <div 
      className={cn(
        "flex items-center justify-between w-[240px] h-[88px] mx-3 px-5 py-3 rounded-2xl",
        "bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.08] hover:border-white/10",
        "transition-all duration-300 cursor-pointer group relative overflow-hidden",
        flash === 'green' && "bg-green-500/10 border-green-500/30",
        flash === 'red' && "bg-red-500/10 border-red-500/30"
      )}
    >
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-500",
        flash === 'green' && "bg-green-500/10 opacity-100",
        flash === 'red' && "bg-red-500/10 opacity-100"
      )} />

      <div className="flex flex-col justify-center relative z-10">
        <div className="flex items-center gap-2.5 mb-1.5">
          <CoinIcon symbol={coin.symbol} size="sm" />
          <span className="font-bold text-sm text-white uppercase tracking-tight">{coin.symbol}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "font-mono text-base font-bold transition-colors duration-300",
             flash === 'green' ? "text-green-400" : flash === 'red' ? "text-red-400" : "text-white"
          )}>
            {formatPrice(coin.current_price)}
          </span>
        </div>
        <div className={cn("flex items-center text-[10px] font-bold mt-0.5", isPositive ? "text-green-400" : "text-red-400")}>
          {isPositive ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
          {Math.abs(priceChange).toFixed(2)}%
        </div>
      </div>
      
      <TickerSparkline data={sparklineData} isPositive={isPositive} />
    </div>
  );
};

export const PriceTicker = () => {
  const [coins, setCoins] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchData = async () => {
    if (!isMounted.current) return;

    try {
      // Use getTopCoins for ticker as it's the most reliable source for prices and changes
      const data = await marketService.getTopCoins(20);

      if (isMounted.current && Array.isArray(data) && data.length > 0) {
        // Strict filter to ensure no $0.00 coins appear
        const validCoins = data.filter(c => 
          c && 
          typeof c.current_price === 'number' && 
          c.current_price > 0 &&
          !isNaN(c.current_price)
        );
        
        if (validCoins.length > 0) {
          // Double duplicate for smooth infinite scroll
          setCoins(validCoins.slice(0, 15));
        }
        setLoading(false);
      } else {
        // Fallback for empty state or error
        if (isMounted.current) setLoading(false);
      }
    } catch (error) {
      console.error("Ticker data fetch error:", error);
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || coins.length === 0) return (
    <div className="w-full py-4 text-center text-slate-500 text-xs font-mono animate-pulse">
      Loading Market Data...
    </div>
  );

  return (
    <div className="w-full overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      <div className="flex animate-marquee hover:[animation-play-state:paused] w-max py-2">
        {coins.map((coin) => (
          <TickerItem key={`original-${coin.id || coin.symbol}`} coin={coin} />
        ))}
        {coins.map((coin) => (
          <TickerItem key={`duplicate-${coin.id || coin.symbol}`} coin={coin} />
        ))}
      </div>
    </div>
  );
};
