
import { HttpClient } from './httpClient';
import { API_ENDPOINTS } from '../config/api';
import { AISignal } from '../types';
import { marketService } from './marketService';
import { databaseService } from './database';

export const aiService = {
  // GET /api/ai/signals?symbol=BTC
  getSignals: async (symbol: string = 'BTC'): Promise<AISignal[]> => {
    try {
      // Check API
      const response = await HttpClient.get<any>(API_ENDPOINTS.AI_SIGNALS, { symbol });
      let signals: AISignal[] = [];

      if (response && Array.isArray(response.signals)) signals = response.signals;
      else if (Array.isArray(response)) signals = response;

      // Save to DB
      signals.forEach(s => {
        databaseService.saveSignal({
          ...s,
          id: s.id || Math.random().toString(36).substr(2, 9),
          symbol: s.symbol || symbol
        });
      });

      // Combine with history if needed, or just return fresh
      return signals.length > 0 ? signals : databaseService.getSignals().map((s: any) => ({
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

    } catch (e) {
      console.warn('AI Signals API unavailable, using cached history');
      return databaseService.getSignals().map((s: any) => ({
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
  },

  getDecision: async (symbol: string, horizon: string = 'swing', riskTolerance: string = 'moderate') => {
    return HttpClient.post<any>(API_ENDPOINTS.AI_DECISION, {
      symbol,
      horizon,
      risk_tolerance: riskTolerance
    });
  },

  scanMarket: async (criteria: { minVolume: number; minChange: number; minPrice?: number }) => {
    try {
      const allCoins = await marketService.getTopCoins(100);
      return allCoins.filter(coin => 
        (coin.total_volume >= criteria.minVolume) &&
        (coin.price_change_percentage_24h >= criteria.minChange) &&
        (!criteria.minPrice || coin.current_price >= criteria.minPrice)
      );
    } catch (e) {
      return [];
    }
  },

  runBacktest: async (symbol: string, initialCapital: number, strategy: string) => {
    try {
      const history = await marketService.getHistory(symbol, '1d', 100);
      if (!history || history.length === 0) throw new Error("No historical data");

      const closes = history.map((h: any) => Number(h.close || h.c));
      const smaPeriod = 20;
      const sma = [];
      for(let i=0; i<closes.length; i++) {
         if (i < smaPeriod) { sma.push(0); continue; }
         const sum = closes.slice(i-smaPeriod, i).reduce((a:number, b:number) => a+b, 0);
         sma.push(sum/smaPeriod);
      }

      let balance = initialCapital;
      let holdings = 0;
      let trades = 0;
      let wins = 0;
      let peakBalance = initialCapital;
      let maxDrawdown = 0;

      for (let i = smaPeriod + 1; i < closes.length; i++) {
        const price = closes[i];
        const ma = sma[i];
        const prevPrice = closes[i-1];
        const prevMa = sma[i-1];

        if (prevPrice <= prevMa && price > ma && holdings === 0) {
          holdings = balance / price;
          balance = 0;
          trades++;
        }
        else if (prevPrice >= prevMa && price < ma && holdings > 0) {
          const val = holdings * price;
          if (val > initialCapital) wins++;
          balance = val;
          holdings = 0;
          trades++;
          if (balance > peakBalance) peakBalance = balance;
          const dd = ((peakBalance - balance) / peakBalance) * 100;
          if (dd > maxDrawdown) maxDrawdown = dd;
        }
      }

      const finalBalance = holdings > 0 ? holdings * closes[closes.length-1] : balance;
      const totalReturn = ((finalBalance - initialCapital) / initialCapital) * 100;

      return {
        totalReturn: totalReturn.toFixed(2),
        winRate: trades > 0 ? ((wins / (trades/2)) * 100).toFixed(0) : 0,
        trades,
        drawdown: maxDrawdown.toFixed(2)
      };

    } catch (e) {
      throw e;
    }
  }
};
