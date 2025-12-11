
import { HttpClient } from './httpClient';
import { API_ENDPOINTS } from '../config/api';
import { CryptoPrice, MarketOverview } from '../types';
import { databaseService } from './database';

export const marketService = {
  // GET /api/market
  getMarketOverview: async (): Promise<MarketOverview> => {
    const cacheKey = API_ENDPOINTS.MARKET_OVERVIEW;
    const cached = databaseService.getCachedResponse<MarketOverview>(cacheKey);
    if (cached) {
      console.log('📦 Market overview from cache');
      return cached;
    }

    const data = await HttpClient.get<MarketOverview>(API_ENDPOINTS.MARKET_OVERVIEW);
    databaseService.cacheApiResponse(cacheKey, data, 30); // 30s TTL
    return data;
  },

  // GET /api/coins/top?limit=50
  getTopCoins: async (limit: number = 50): Promise<CryptoPrice[]> => {
    const cacheKey = `${API_ENDPOINTS.COINS_TOP}?limit=${limit}`;
    const cached = databaseService.getCachedResponse<CryptoPrice[]>(cacheKey);
    if (cached) {
      console.log(`📦 Top ${limit} coins from cache`);
      return cached;
    }

    try {
      const response = await HttpClient.get<any>(API_ENDPOINTS.COINS_TOP, { limit });
      
      let data: any[] = [];
      if (Array.isArray(response)) data = response;
      else if (response && Array.isArray(response.coins)) data = response.coins;
      else if (response && Array.isArray(response.data)) data = response.data;
      
      // Parse and normalize data strictly
      const normalizedData: CryptoPrice[] = data.map(coin => {
        const currentPrice = Number(coin.current_price || coin.price || coin.usd || 0);
        const change24h = Number(coin.price_change_percentage_24h || coin.change_24h || coin.usd_24h_change || 0);
        
        return {
          id: coin.id || coin.symbol || 'unknown',
          symbol: coin.symbol || '???',
          name: coin.name || 'Unknown',
          image: coin.image || coin.thumb || '',
          current_price: isNaN(currentPrice) ? 0 : currentPrice,
          market_cap: Number(coin.market_cap || 0),
          market_cap_rank: Number(coin.market_cap_rank || 0),
          fully_diluted_valuation: Number(coin.fully_diluted_valuation || 0),
          total_volume: Number(coin.total_volume || coin.volume || 0),
          high_24h: Number(coin.high_24h || 0),
          low_24h: Number(coin.low_24h || 0),
          price_change_24h: Number(coin.price_change_24h || 0),
          price_change_percentage_24h: isNaN(change24h) ? 0 : change24h,
          market_cap_change_24h: Number(coin.market_cap_change_24h || 0),
          market_cap_change_percentage_24h: Number(coin.market_cap_change_percentage_24h || 0),
          circulating_supply: Number(coin.circulating_supply || 0),
          total_supply: Number(coin.total_supply || 0),
          max_supply: Number(coin.max_supply || 0),
          ath: Number(coin.ath || 0),
          ath_change_percentage: Number(coin.ath_change_percentage || 0),
          ath_date: coin.ath_date || '',
          atl: Number(coin.atl || 0),
          atl_change_percentage: Number(coin.atl_change_percentage || 0),
          atl_date: coin.atl_date || '',
          last_updated: coin.last_updated || new Date().toISOString(),
          sparkline_in_7d: coin.sparkline_in_7d || { price: [] }
        };
      }).filter(c => c.current_price > 0); // Only return valid prices

      // Cache individual coin data as well
      normalizedData.forEach(coin => {
        databaseService.cacheMarketData(coin.symbol, coin, 30);
      });

      if (normalizedData.length > 0) {
        databaseService.cacheApiResponse(cacheKey, normalizedData, 30); // 30s TTL
        console.log(`✅ Cached ${normalizedData.length} coins`);
      }
      
      return normalizedData;
    } catch (e) {
      console.error("Error fetching top coins:", e);
      return [];
    }
  },

  // GET /api/trending
  getTrendingCoins: async (): Promise<CryptoPrice[]> => {
    const cacheKey = API_ENDPOINTS.MARKET_TRENDING;
    const cached = databaseService.getCachedResponse<CryptoPrice[]>(cacheKey);
    if (cached) {
      console.log('📦 Trending coins from cache');
      return cached;
    }

    try {
      const response = await HttpClient.get<any>(API_ENDPOINTS.MARKET_TRENDING);
      
      let data: any[] = [];
      if (Array.isArray(response)) data = response;
      else if (response && Array.isArray(response.coins)) {
        // Trending endpoint often nests data in 'item'
        data = response.coins.map((c: any) => c.item || c);
      }
      
      const normalizedData = data.map(coin => ({
        ...coin,
        id: coin.id || coin.symbol,
        symbol: coin.symbol || '',
        name: coin.name || '',
        current_price: Number(coin.current_price || coin.price_btc || 0),
        price_change_percentage_24h: Number(coin.price_change_percentage_24h || 0)
      }));

      if (normalizedData.length > 0) {
        databaseService.cacheApiResponse(cacheKey, normalizedData, 60); // 60s TTL
        console.log(`✅ Cached ${normalizedData.length} trending coins`);
      }
      
      return normalizedData as CryptoPrice[];
    } catch (e) {
      console.error("Error fetching trending:", e);
      return [];
    }
  },

  // GET /api/service/history
  getHistory: async (symbol: string, interval: string = '1h', limit: number = 100) => {
    // Check OHLCV cache first
    const cachedOHLCV = databaseService.getOHLCV(symbol, interval, limit);
    if (cachedOHLCV.length >= limit) {
      console.log(`📦 OHLCV data for ${symbol} ${interval} from cache`);
      return cachedOHLCV;
    }

    // Check API cache as fallback
    const cacheKey = `${API_ENDPOINTS.HISTORY}:${symbol}:${interval}:${limit}`;
    const cached = databaseService.getCachedResponse(cacheKey);
    if (cached) {
      console.log(`📦 History for ${symbol} from API cache`);
      return cached;
    }

    try {
      const data = await HttpClient.get<any>(API_ENDPOINTS.HISTORY, { 
        symbol, 
        interval, 
        limit 
      });
      
      if (data && Array.isArray(data)) {
        // Cache in both API cache and OHLCV cache
        databaseService.cacheApiResponse(cacheKey, data, 60); // 60s TTL
        databaseService.cacheOHLCV(symbol, interval, data);
        console.log(`✅ Cached ${data.length} candles for ${symbol} ${interval}`);
      }
      return data;
    } catch (e) {
      console.error('Error fetching history:', e);
      return [];
    }
  },

  // GET /api/service/rate
  getRate: async (pair: string) => {
    // Short cache for rates (10s)
    const cacheKey = `${API_ENDPOINTS.RATE}:${pair}`;
    const cached = databaseService.getCachedResponse(cacheKey);
    if (cached) {
      console.log(`📦 Rate for ${pair} from cache`);
      return cached;
    }

    try {
      const data = await HttpClient.get<any>(API_ENDPOINTS.RATE, { pair });
      if (data) {
        databaseService.cacheApiResponse(cacheKey, data, 10); // 10s TTL for real-time rates
      }
      return data;
    } catch (e) {
      console.error(`Error fetching rate for ${pair}:`, e);
      return null;
    }
  },
  
  getCategory: async (name: string) => {
    const cacheKey = `/api/resources/category/${name}`;
    const cached = databaseService.getCachedResponse(cacheKey);
    if (cached) {
      console.log(`📦 Category ${name} from cache`);
      return cached;
    }

    try {
      const data = await HttpClient.get<any>(cacheKey);
      if (data) {
        databaseService.cacheApiResponse(cacheKey, data, 300); // 5min TTL
        console.log(`✅ Cached category ${name}`);
      }
      return data;
    } catch (e) {
      console.error(`Error fetching category ${name}:`, e);
      return null;
    }
  }
};
