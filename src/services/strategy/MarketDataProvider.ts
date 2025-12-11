import { Candle } from '../../types/strategy';
import { HttpClient } from '../httpClient';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Market Data Provider for Strategy System
 * Fetches real OHLCV data from the API and converts to Candle format
 */
export class MarketDataProvider {
  private static instance: MarketDataProvider;
  private cache: Map<string, { data: Candle[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache
  
  private constructor() {}
  
  static getInstance(): MarketDataProvider {
    if (!MarketDataProvider.instance) {
      MarketDataProvider.instance = new MarketDataProvider();
    }
    return MarketDataProvider.instance;
  }
  
  /**
   * Get OHLCV candles for a symbol
   * @param symbol Symbol (e.g., 'BTC', 'ETH')
   * @param interval Interval (e.g., '15m', '1h', '4h')
   * @param limit Number of candles to fetch
   */
  async getCandles(symbol: string, interval: string, limit: number = 200): Promise<Candle[]> {
    const cacheKey = `${symbol}-${interval}-${limit}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 Using cached candles for ${symbol} ${interval}`);
      return cached.data;
    }
    
    try {
      console.log(`🔄 Fetching candles for ${symbol} ${interval} (limit: ${limit})`);
      
      // Fetch from API
      const response = await HttpClient.get<any>(API_ENDPOINTS.HISTORY, {
        symbol: symbol,
        interval: interval,
        limit: limit
      });
      
      // Convert API response to Candle format
      const candles = this.convertToCandles(response);
      
      if (candles.length === 0) {
        console.warn(`⚠️ No candles returned for ${symbol} ${interval}`);
        // Return mock data as fallback
        return this.generateMockCandles(limit, interval);
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: candles,
        timestamp: Date.now()
      });
      
      console.log(`✅ Fetched ${candles.length} candles for ${symbol} ${interval}`);
      return candles;
      
    } catch (error) {
      console.error(`❌ Error fetching candles for ${symbol} ${interval}:`, error);
      
      // Return cached data if available (even if expired)
      if (cached) {
        console.log(`📦 Using expired cache for ${symbol} ${interval}`);
        return cached.data;
      }
      
      // Generate mock data as last resort
      console.log(`🔧 Generating mock candles for ${symbol} ${interval}`);
      return this.generateMockCandles(limit, interval);
    }
  }
  
  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const pair = `${symbol}/USDT`;
      const response = await HttpClient.get<any>(API_ENDPOINTS.RATE, { pair });
      
      // Try different possible response formats
      const price = response?.price || 
                   response?.rate || 
                   response?.last || 
                   response?.current_price || 
                   0;
      
      if (price > 0) {
        console.log(`💰 Current price for ${symbol}: $${price}`);
        return price;
      }
      
      throw new Error('Invalid price data');
      
    } catch (error) {
      console.error(`❌ Error fetching price for ${symbol}:`, error);
      
      // Fallback: try to get from recent candles
      const candles = await this.getCandles(symbol, '15m', 1);
      if (candles.length > 0) {
        return candles[candles.length - 1].close;
      }
      
      // Default fallback prices
      const fallbackPrices: Record<string, number> = {
        'BTC': 50000,
        'ETH': 3000,
        'SOL': 100,
        'BNB': 300
      };
      
      return fallbackPrices[symbol] || 1000;
    }
  }
  
  /**
   * Get batch prices for multiple symbols
   */
  async getBatchPrices(symbols: string[]): Promise<Record<string, number>> {
    try {
      const pairs = symbols.map(s => `${s}/USDT`);
      const response = await HttpClient.get<any>(API_ENDPOINTS.BATCH_RATE, {
        pairs: pairs.join(',')
      });
      
      const prices: Record<string, number> = {};
      
      if (Array.isArray(response)) {
        response.forEach((item: any) => {
          const symbol = item.symbol?.split('/')[0] || item.pair?.split('/')[0];
          const price = item.price || item.rate || item.last || 0;
          if (symbol && price > 0) {
            prices[symbol] = price;
          }
        });
      } else if (typeof response === 'object') {
        Object.entries(response).forEach(([key, value]: [string, any]) => {
          const symbol = key.split('/')[0];
          const price = value?.price || value?.rate || value || 0;
          if (price > 0) {
            prices[symbol] = price;
          }
        });
      }
      
      console.log(`💰 Fetched ${Object.keys(prices).length} prices`);
      return prices;
      
    } catch (error) {
      console.error('❌ Error fetching batch prices:', error);
      
      // Fallback: fetch individually
      const prices: Record<string, number> = {};
      for (const symbol of symbols) {
        prices[symbol] = await this.getCurrentPrice(symbol);
      }
      return prices;
    }
  }
  
  /**
   * Convert API response to Candle array
   */
  private convertToCandles(response: any): Candle[] {
    if (!response) return [];
    
    let data: any[] = [];
    
    // Handle different response formats
    if (Array.isArray(response)) {
      data = response;
    } else if (response.data && Array.isArray(response.data)) {
      data = response.data;
    } else if (response.candles && Array.isArray(response.candles)) {
      data = response.candles;
    } else if (response.ohlcv && Array.isArray(response.ohlcv)) {
      data = response.ohlcv;
    }
    
    return data
      .map((item: any) => this.parseCandle(item))
      .filter((candle): candle is Candle => candle !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Parse a single candle from various formats
   */
  private parseCandle(item: any): Candle | null {
    try {
      // Format 1: Array [timestamp, open, high, low, close, volume]
      if (Array.isArray(item) && item.length >= 6) {
        return {
          timestamp: Number(item[0]),
          open: Number(item[1]),
          high: Number(item[2]),
          low: Number(item[3]),
          close: Number(item[4]),
          volume: Number(item[5])
        };
      }
      
      // Format 2: Object with explicit properties
      if (typeof item === 'object') {
        const timestamp = item.timestamp || item.time || item.t || item.date || Date.now();
        const open = item.open || item.o || 0;
        const high = item.high || item.h || 0;
        const low = item.low || item.l || 0;
        const close = item.close || item.c || 0;
        const volume = item.volume || item.v || 0;
        
        // Validate that we have valid OHLC data
        if (open > 0 && high > 0 && low > 0 && close > 0) {
          return {
            timestamp: Number(timestamp),
            open: Number(open),
            high: Number(high),
            low: Number(low),
            close: Number(close),
            volume: Number(volume)
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing candle:', error);
      return null;
    }
  }
  
  /**
   * Generate mock candles as fallback
   */
  private generateMockCandles(count: number, interval: string): Candle[] {
    const candles: Candle[] = [];
    const intervalMs = this.getIntervalMs(interval);
    
    // Use realistic starting price
    let price = 50000 + Math.random() * 10000;
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const timestamp = now - (count - i) * intervalMs;
      const volatility = 0.015; // 1.5% volatility
      
      const open = price;
      const change = (Math.random() - 0.5) * 2 * volatility;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      const volume = 1000000 + Math.random() * 5000000;
      
      candles.push({ timestamp, open, high, low, close, volume });
      price = close;
    }
    
    return candles;
  }
  
  /**
   * Get interval duration in milliseconds
   */
  private getIntervalMs(interval: string): number {
    const map: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return map[interval] || 60 * 60 * 1000; // Default 1h
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Market data cache cleared');
  }
  
  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const marketDataProvider = MarketDataProvider.getInstance();
