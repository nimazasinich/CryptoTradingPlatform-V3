
import { marketService } from './marketService';
import { calculateSMA, calculateRSI, calculateMACD } from '../utils/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  type: 'SMA_CROSSOVER' | 'RSI_REVERSAL' | 'MACD_MOMENTUM';
  params: {
    fastPeriod?: number;
    slowPeriod?: number;
    rsiThresholdLow?: number;
    rsiThresholdHigh?: number;
    stopLossPercent?: number;
    takeProfitPercent?: number;
    tradeAmount?: number; // USD value
  };
  active: boolean;
}

export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  price?: number;
  reason?: string;
}

export const strategyService = {
  getStrategies: (): StrategyConfig[] => [
    {
      id: 'strat_1',
      name: 'Golden Cross (SMA 20/50)',
      type: 'SMA_CROSSOVER',
      params: { fastPeriod: 20, slowPeriod: 50, tradeAmount: 1000, stopLossPercent: 2 },
      active: false
    },
    {
      id: 'strat_2',
      name: 'RSI Mean Reversion',
      type: 'RSI_REVERSAL',
      params: { rsiThresholdLow: 30, rsiThresholdHigh: 70, tradeAmount: 500, stopLossPercent: 5 },
      active: false
    },
    {
      id: 'strat_3',
      name: 'MACD Momentum',
      type: 'MACD_MOMENTUM',
      params: { fastPeriod: 12, slowPeriod: 26, tradeAmount: 750, stopLossPercent: 3 },
      active: false
    }
  ],

  evaluate: async (strategy: StrategyConfig, symbol: string): Promise<TradeSignal> => {
    try {
      // 1. Fetch History
      const history = await marketService.getHistory(symbol, '1h', 100);
      if (!history || history.length < 50) return { action: 'HOLD' };

      const closes = history.map((h: any) => Number(h.close || h.c));
      const currentPrice = closes[closes.length - 1];
      const prevPrice = closes[closes.length - 2];

      // 2. Logic
      if (strategy.type === 'SMA_CROSSOVER') {
        const fast = strategy.params.fastPeriod || 20;
        const slow = strategy.params.slowPeriod || 50;
        
        const smaFast = calculateSMA(closes, fast);
        const smaSlow = calculateSMA(closes, slow);
        
        const currFast = smaFast[smaFast.length - 1];
        const currSlow = smaSlow[smaSlow.length - 1];
        const prevFast = smaFast[smaFast.length - 2];
        const prevSlow = smaSlow[smaSlow.length - 2];

        // Crossover UP
        if (prevFast <= prevSlow && currFast > currSlow) {
          return { action: 'BUY', price: currentPrice, reason: `SMA(${fast}) crossed above SMA(${slow})` };
        }
        // Crossover DOWN
        if (prevFast >= prevSlow && currFast < currSlow) {
          return { action: 'SELL', price: currentPrice, reason: `SMA(${fast}) crossed below SMA(${slow})` };
        }
      }

      if (strategy.type === 'RSI_REVERSAL') {
        const rsi = calculateRSI(closes, 14);
        const currRsi = rsi[rsi.length - 1];
        const low = strategy.params.rsiThresholdLow || 30;
        const high = strategy.params.rsiThresholdHigh || 70;

        if (currRsi < low) return { action: 'BUY', price: currentPrice, reason: `RSI oversold (${currRsi.toFixed(1)})` };
        if (currRsi > high) return { action: 'SELL', price: currentPrice, reason: `RSI overbought (${currRsi.toFixed(1)})` };
      }

      return { action: 'HOLD' };

    } catch (e) {
      console.error('Strategy Evaluation Error', e);
      return { action: 'HOLD' };
    }
  }
};
