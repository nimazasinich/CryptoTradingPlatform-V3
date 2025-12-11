
import { HttpClient } from './httpClient';
import { API_ENDPOINTS } from '../config/api';
import { AISignal, CryptoPrice } from '../types';
import { marketService } from './marketService';
import { databaseService } from './database';
import { calculateSMA, calculateRSI, calculateMACD } from '../utils/indicators';

export const aiService = {
  /**
   * GET /api/ai/signals?symbol=BTC
   * Fetches AI-generated trading signals for a specific symbol
   * Falls back to cached signals if API is unavailable
   */
  getSignals: async (symbol: string = 'BTC'): Promise<AISignal[]> => {
    try {
      // Try to fetch from API
      const response = await HttpClient.get<any>(API_ENDPOINTS.AI_SIGNALS, { symbol });
      let signals: AISignal[] = [];

      // Parse response (API may return different formats)
      if (response && Array.isArray(response.signals)) {
        signals = response.signals;
      } else if (Array.isArray(response)) {
        signals = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        signals = response.data;
      }

      // Normalize and validate signals
      signals = signals.map(s => ({
        id: s.id || Math.random().toString(36).substr(2, 9),
        symbol: s.symbol || symbol,
        type: s.type || s.signal_type || 'BUY',
        entry_price: Number(s.entry_price || s.price || 0),
        target_price: Number(s.target_price || s.target || 0),
        stop_loss: Number(s.stop_loss || s.stop || 0),
        confidence: Number(s.confidence || 50),
        reasoning: s.reasoning || s.reason || 'AI-generated signal',
        timestamp: s.timestamp || new Date().toISOString()
      }));

      // Save valid signals to database
      signals.forEach(signal => {
        if (signal.entry_price > 0) {
          databaseService.saveSignal({
            ...signal,
            type: signal.type
          });
        }
      });

      // Return fresh signals if available, otherwise cached
      if (signals.length > 0) {
        return signals;
      }

      // Fallback to database cache
      const cached = databaseService.getSignals();
      return cached.map((s: any) => ({
        id: s.id,
        symbol: s.symbol,
        type: s.signal_type as 'BUY' | 'SELL',
        entry_price: s.entry_price,
        target_price: s.target_price,
        stop_loss: s.stop_loss,
        confidence: s.confidence,
        reasoning: s.reasoning,
        timestamp: new Date(s.created_at).toISOString()
      }));

    } catch (error) {
      console.warn('AI Signals API unavailable, using cached signals', error);
      
      // Return cached signals from database
      const cached = databaseService.getSignals();
      if (cached.length > 0) {
        return cached.map((s: any) => ({
          id: s.id,
          symbol: s.symbol,
          type: s.signal_type as 'BUY' | 'SELL',
          entry_price: s.entry_price,
          target_price: s.target_price,
          stop_loss: s.stop_loss,
          confidence: s.confidence,
          reasoning: s.reasoning,
          timestamp: new Date(s.created_at).toISOString()
        }));
      }

      // Return empty array if no cache available
      return [];
    }
  },

  /**
   * POST /api/ai/decision
   * Get AI trading decision for a specific asset
   */
  getDecision: async (
    symbol: string, 
    horizon: string = 'swing', 
    riskTolerance: string = 'moderate'
  ): Promise<any> => {
    try {
      const response = await HttpClient.post<any>(API_ENDPOINTS.AI_DECISION, {
        symbol,
        horizon,
        risk_tolerance: riskTolerance
      });
      
      return response;
    } catch (error) {
      console.error('AI Decision API error:', error);
      
      // Fallback: Generate basic decision based on technical indicators
      try {
        const history = await marketService.getHistory(symbol, '1h', 50);
        if (history && history.length > 0) {
          const closes = history.map((h: any) => Number(h.close || h.c));
          const rsi = calculateRSI(closes);
          const lastRSI = rsi[rsi.length - 1];
          
          let decision = 'NEUTRAL';
          let confidence = 50;
          
          if (lastRSI < 30) {
            decision = 'BUY';
            confidence = 70;
          } else if (lastRSI > 70) {
            decision = 'SELL';
            confidence = 70;
          }
          
          return {
            decision,
            confidence,
            reasoning: `Technical analysis based on RSI (${lastRSI.toFixed(2)})`,
            horizon,
            risk_tolerance: riskTolerance
          };
        }
      } catch (fallbackError) {
        console.error('Fallback decision generation failed:', fallbackError);
      }
      
      return {
        decision: 'NEUTRAL',
        confidence: 50,
        reasoning: 'Insufficient data for decision',
        horizon,
        risk_tolerance: riskTolerance
      };
    }
  },

  /**
   * Scan market for opportunities based on criteria
   * Uses real market data and applies filters
   */
  scanMarket: async (criteria: {
    minVolume?: number;
    minChange?: number;
    maxChange?: number;
    minPrice?: number;
    maxPrice?: number;
    minMarketCap?: number;
  }): Promise<CryptoPrice[]> => {
    try {
      // Fetch top 100 coins
      const allCoins = await marketService.getTopCoins(100);
      
      // Apply filters
      return allCoins.filter(coin => {
        if (criteria.minVolume && coin.total_volume < criteria.minVolume) return false;
        if (criteria.minChange && coin.price_change_percentage_24h < criteria.minChange) return false;
        if (criteria.maxChange && coin.price_change_percentage_24h > criteria.maxChange) return false;
        if (criteria.minPrice && coin.current_price < criteria.minPrice) return false;
        if (criteria.maxPrice && coin.current_price > criteria.maxPrice) return false;
        if (criteria.minMarketCap && coin.market_cap < criteria.minMarketCap) return false;
        return true;
      });
    } catch (error) {
      console.error('Market scan failed:', error);
      return [];
    }
  },

  /**
   * Run backtest simulation on historical data
   * Implements SMA crossover strategy
   */
  runBacktest: async (
    symbol: string, 
    initialCapital: number, 
    strategy: string = 'SMA_20'
  ): Promise<{
    totalReturn: string;
    winRate: string;
    trades: number;
    drawdown: string;
    sharpeRatio: string;
    equityCurve: number[];
  }> => {
    try {
      // Fetch historical data
      const history = await marketService.getHistory(symbol, '1d', 100);
      if (!history || history.length === 0) {
        throw new Error('No historical data available');
      }

      const closes = history.map((h: any) => Number(h.close || h.c));
      
      // Calculate indicators based on strategy
      let signals: boolean[] = [];
      
      if (strategy === 'SMA_20' || strategy === 'SMA 20 Crossover (Trend Follow)') {
        const sma = calculateSMA(closes, 20);
        
        // Generate buy/sell signals
        for (let i = 1; i < closes.length; i++) {
          const price = closes[i];
          const prevPrice = closes[i - 1];
          const ma = sma[i];
          const prevMa = sma[i - 1];
          
          // Buy signal: price crosses above SMA
          if (prevPrice <= prevMa && price > ma) {
            signals.push(true);
          }
          // Sell signal: price crosses below SMA
          else if (prevPrice >= prevMa && price < ma) {
            signals.push(false);
          } else {
            signals.push(signals[signals.length - 1] || false);
          }
        }
      }

      // Simulate trading
      let balance = initialCapital;
      let holdings = 0;
      let entryPrice = 0;
      let trades = 0;
      let wins = 0;
      let peakBalance = initialCapital;
      let maxDrawdown = 0;
      const equityCurve: number[] = [initialCapital];

      for (let i = 20; i < closes.length; i++) {
        const price = closes[i];
        
        // Calculate current portfolio value
        const portfolioValue = holdings > 0 ? holdings * price : balance;
        equityCurve.push(portfolioValue);
        
        // Update peak and drawdown
        if (portfolioValue > peakBalance) {
          peakBalance = portfolioValue;
        }
        const currentDrawdown = ((peakBalance - portfolioValue) / peakBalance) * 100;
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
        }

        // Execute trades based on signals
        const prevSignal = i > 20 ? signals[i - 21] : false;
        const currentSignal = signals[i - 20];

        // Buy signal
        if (!prevSignal && currentSignal && holdings === 0) {
          holdings = balance / price;
          entryPrice = price;
          balance = 0;
          trades++;
        }
        // Sell signal
        else if (prevSignal && !currentSignal && holdings > 0) {
          const sellValue = holdings * price;
          const profit = sellValue - (holdings * entryPrice);
          if (profit > 0) wins++;
          
          balance = sellValue;
          holdings = 0;
          trades++;
        }
      }

      // Close any open position at final price
      const finalPrice = closes[closes.length - 1];
      const finalBalance = holdings > 0 ? holdings * finalPrice : balance;
      
      // Calculate metrics
      const totalReturn = ((finalBalance - initialCapital) / initialCapital) * 100;
      const winRate = trades > 0 ? (wins / (trades / 2)) * 100 : 0;
      
      // Calculate Sharpe Ratio
      const returns = [];
      for (let i = 1; i < equityCurve.length; i++) {
        returns.push((equityCurve[i] - equityCurve[i-1]) / equityCurve[i-1]);
      }
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252);

      return {
        totalReturn: totalReturn.toFixed(2),
        winRate: winRate.toFixed(0),
        trades,
        drawdown: maxDrawdown.toFixed(2),
        sharpeRatio: sharpeRatio.toFixed(2),
        equityCurve
      };

    } catch (error) {
      console.error('Backtest failed:', error);
      throw new Error(`Backtest failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Save a custom strategy to local storage
   */
  saveStrategy: async (strategy: any): Promise<void> => {
    try {
      const existing = localStorage.getItem('ai_strategies');
      const strategies = existing ? JSON.parse(existing) : [];
      strategies.push({
        ...strategy,
        id: strategy.id || Date.now().toString(),
        created_at: Date.now()
      });
      localStorage.setItem('ai_strategies', JSON.stringify(strategies));
    } catch (error) {
      console.error('Failed to save strategy:', error);
      throw error;
    }
  },

  /**
   * Load all saved strategies from local storage
   */
  loadStrategies: async (): Promise<any[]> => {
    try {
      const saved = localStorage.getItem('ai_strategies');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load strategies:', error);
      return [];
    }
  },

  /**
   * Delete a strategy by ID
   */
  deleteStrategy: async (id: string): Promise<void> => {
    try {
      const existing = localStorage.getItem('ai_strategies');
      if (existing) {
        const strategies = JSON.parse(existing);
        const filtered = strategies.filter((s: any) => s.id !== id);
        localStorage.setItem('ai_strategies', JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Failed to delete strategy:', error);
      throw error;
    }
  }
};
