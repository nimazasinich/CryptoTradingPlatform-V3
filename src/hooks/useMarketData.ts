
import { useState, useEffect, useRef } from 'react';
import { marketService } from '../services/marketService';
import { CryptoPrice, MarketOverview } from '../types';

interface DashboardDataState {
  marketOverview: MarketOverview | null;
  topCoins: CryptoPrice[];
  loading: boolean;
  error: string | null;
}

export const useMarketData = () => {
  const [data, setData] = useState<DashboardDataState>({
    marketOverview: null,
    topCoins: [],
    loading: true,
    error: null,
  });
  
  const isMounted = useRef(true);

  const fetchData = async () => {
    if (!isMounted.current) return;
    
    try {
      // Parallel fetch for efficiency
      const [overviewRaw, coinsData] = await Promise.all([
        marketService.getMarketOverview().catch(() => null), // Fail gracefully
        marketService.getTopCoins(20).catch(() => [])
      ]);

      if (isMounted.current) {
        // Safe Data Parsing for Overview
        let marketOverview: MarketOverview = {
          total_market_cap: 0,
          total_volume_24h: 0,
          btc_dominance: 0,
          active_cryptocurrencies: 0,
          market_cap_change_percentage_24h: 0,
          volume_change_percentage_24h: 0
        };

        const raw = overviewRaw as any;
        if (raw) {
          marketOverview.total_market_cap = Number(raw.total_market_cap || raw.marketCap || 0);
          marketOverview.total_volume_24h = Number(raw.total_volume_24h || raw.volume24h || 0);
          marketOverview.btc_dominance = Number(raw.btc_dominance || raw.btcDominance || 0);
          marketOverview.active_cryptocurrencies = Number(raw.active_cryptocurrencies || raw.activeCoins || 0);
          marketOverview.market_cap_change_percentage_24h = Number(raw.market_cap_change_percentage_24h || raw.marketCapChange || 0);
          marketOverview.volume_change_percentage_24h = Number(raw.volume_change_percentage_24h || 0);
        }

        // Fallback calculation using top coins if overview is empty
        if (coinsData.length > 0 && marketOverview.total_market_cap === 0) {
           marketOverview.total_market_cap = (coinsData as CryptoPrice[]).reduce((acc: number, c: CryptoPrice) => acc + (c.market_cap || 0), 0);
           marketOverview.total_volume_24h = (coinsData as CryptoPrice[]).reduce((acc: number, c: CryptoPrice) => acc + (c.total_volume || 0), 0);
           const btc = (coinsData as CryptoPrice[]).find(c => c.symbol.toUpperCase() === 'BTC');
           if (btc && marketOverview.total_market_cap > 0) {
             marketOverview.btc_dominance = (btc.market_cap / marketOverview.total_market_cap) * 100;
           }
        }

        setData({
          marketOverview,
          topCoins: coinsData as CryptoPrice[],
          loading: false,
          error: null,
        });
      }

    } catch (err) {
      if (isMounted.current) {
        console.error("Market Data Fetch Error:", err);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load market data',
        }));
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s refresh
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  return data;
};

// Also export the original hook name for compatibility with existing components
export const useDashboardData = useMarketData;
