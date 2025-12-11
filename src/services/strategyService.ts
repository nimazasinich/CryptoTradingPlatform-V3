
import { marketService } from './marketService';
import { tradingService } from './tradingService';
import { databaseService } from './database';
import { calculateSMA, calculateRSI, calculateMACD, calculateEMA } from '../utils/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description?: string;
  type: 'SMA_CROSSOVER' | 'RSI_REVERSAL' | 'MACD_MOMENTUM' | 'EMA_TREND' | 'BOLLINGER_BANDS';
  params: {
    // Moving Average params
    fastPeriod?: number;
    slowPeriod?: number;
    emaPeriod?: number;
    
    // RSI params
    rsiPeriod?: number;
    rsiThresholdLow?: number;
    rsiThresholdHigh?: number;
    
    // MACD params
    macdFast?: number;
    macdSlow?: number;
    macdSignal?: number;
    
    // Risk Management
    stopLossPercent?: number;
    takeProfitPercent?: number;
    trailingStopPercent?: number;
    
    // Position Sizing
    tradeAmount?: number; // USD value per trade
    maxPositions?: number;
    riskPerTrade?: number; // Percentage of account
    
    // Timeframe
    timeframe?: '15m' | '1h' | '4h' | '1d';
  };
  active: boolean;
  performance?: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    sharpeRatio?: number;
  };
}

export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  price?: number;
  reason?: string;
  confidence?: number; // 0-100
  stopLoss?: number;
  takeProfit?: number;
  indicators?: Record<string, number>;
}

export interface BacktestResult {
  trades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  equity: number[];
  trades_detail: Array<{
    entry: number;
    exit: number;
    pnl: number;
    type: 'WIN' | 'LOSS';
  }>;
}

class StrategyService {
  private activeStrategies: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Get all available strategies
   */
  public getStrategies(): StrategyConfig[] {
    return [
      {
        id: 'strat_1',
        name: 'Golden Cross (SMA 20/50)',
        description: 'Classic momentum strategy using SMA crossover',
        type: 'SMA_CROSSOVER',
        params: { 
          fastPeriod: 20, 
          slowPeriod: 50, 
          tradeAmount: 1000, 
          stopLossPercent: 2,
          takeProfitPercent: 5,
          timeframe: '1h'
        },
        active: false,
        performance: {
          totalTrades: 0,
          winRate: 0,
          totalPnL: 0
        }
      },
      {
        id: 'strat_2',
        name: 'RSI Mean Reversion',
        description: 'Buy oversold and sell overbought conditions',
        type: 'RSI_REVERSAL',
        params: { 
          rsiPeriod: 14,
          rsiThresholdLow: 30, 
          rsiThresholdHigh: 70, 
          tradeAmount: 500, 
          stopLossPercent: 3,
          takeProfitPercent: 6,
          timeframe: '1h'
        },
        active: false,
        performance: {
          totalTrades: 0,
          winRate: 0,
          totalPnL: 0
        }
      },
      {
        id: 'strat_3',
        name: 'MACD Momentum',
        description: 'Trend-following using MACD crossovers',
        type: 'MACD_MOMENTUM',
        params: { 
          macdFast: 12,
          macdSlow: 26,
          macdSignal: 9,
          tradeAmount: 750, 
          stopLossPercent: 2.5,
          takeProfitPercent: 5,
          timeframe: '1h'
        },
        active: false,
        performance: {
          totalTrades: 0,
          winRate: 0,
          totalPnL: 0
        }
      },
      {
        id: 'strat_4',
        name: 'EMA Trend Following',
        description: 'Follow trends using EMA 9/21 crossover',
        type: 'EMA_TREND',
        params: {
          fastPeriod: 9,
          slowPeriod: 21,
          tradeAmount: 800,
          stopLossPercent: 2,
          takeProfitPercent: 6,
          trailingStopPercent: 1.5,
          timeframe: '1h'
        },
        active: false,
        performance: {
          totalTrades: 0,
          winRate: 0,
          totalPnL: 0
        }
      }
    ];
  }

  /**
   * Evaluate strategy and return signal
   */
  public async evaluate(strategy: StrategyConfig, symbol: string): Promise<TradeSignal> {
    try {
      const timeframe = strategy.params.timeframe || '1h';
      const history = await marketService.getHistory(symbol, timeframe, 100);
      
      if (!history || history.length < 50) {
        return { action: 'HOLD', reason: 'Insufficient data' };
      }

      const closes = history.map((h: any) => Number(h.close || h.c || 0)).filter(p => p > 0);
      const highs = history.map((h: any) => Number(h.high || h.h || 0)).filter(p => p > 0);
      const lows = history.map((h: any) => Number(h.low || h.l || 0)).filter(p => p > 0);
      
      if (closes.length < 50) {
        return { action: 'HOLD', reason: 'Invalid price data' };
      }

      const currentPrice = closes[closes.length - 1];
      const prevPrice = closes[closes.length - 2];

      // Execute strategy logic based on type
      switch (strategy.type) {
        case 'SMA_CROSSOVER':
          return this.evaluateSMACrossover(closes, currentPrice, strategy);
        
        case 'RSI_REVERSAL':
          return this.evaluateRSIReversal(closes, currentPrice, strategy);
        
        case 'MACD_MOMENTUM':
          return this.evaluateMACDMomentum(closes, currentPrice, strategy);
        
        case 'EMA_TREND':
          return this.evaluateEMATrend(closes, currentPrice, strategy);
        
        default:
          return { action: 'HOLD', reason: 'Unknown strategy type' };
      }

    } catch (e) {
      console.error('Strategy evaluation error:', e);
      return { action: 'HOLD', reason: 'Evaluation error' };
    }
  }

  /**
   * SMA Crossover Strategy
   */
  private evaluateSMACrossover(closes: number[], currentPrice: number, strategy: StrategyConfig): TradeSignal {
    const fast = strategy.params.fastPeriod || 20;
    const slow = strategy.params.slowPeriod || 50;
    
    const smaFast = calculateSMA(closes, fast);
    const smaSlow = calculateSMA(closes, slow);
    
    const currFast = smaFast[smaFast.length - 1];
    const currSlow = smaSlow[smaSlow.length - 1];
    const prevFast = smaFast[smaFast.length - 2];
    const prevSlow = smaSlow[smaSlow.length - 2];

    if (isNaN(currFast) || isNaN(currSlow)) {
      return { action: 'HOLD', reason: 'Insufficient data for SMA' };
    }

    // Calculate stop loss and take profit
    const stopLossPercent = strategy.params.stopLossPercent || 2;
    const takeProfitPercent = strategy.params.takeProfitPercent || 5;

    // Bullish crossover
    if (prevFast <= prevSlow && currFast > currSlow) {
      return {
        action: 'BUY',
        price: currentPrice,
        reason: `Golden Cross: SMA(${fast}) crossed above SMA(${slow})`,
        confidence: 75,
        stopLoss: currentPrice * (1 - stopLossPercent / 100),
        takeProfit: currentPrice * (1 + takeProfitPercent / 100),
        indicators: { sma_fast: currFast, sma_slow: currSlow }
      };
    }
    
    // Bearish crossover
    if (prevFast >= prevSlow && currFast < currSlow) {
      return {
        action: 'SELL',
        price: currentPrice,
        reason: `Death Cross: SMA(${fast}) crossed below SMA(${slow})`,
        confidence: 75,
        stopLoss: currentPrice * (1 + stopLossPercent / 100),
        takeProfit: currentPrice * (1 - takeProfitPercent / 100),
        indicators: { sma_fast: currFast, sma_slow: currSlow }
      };
    }

    return { action: 'HOLD', reason: 'No crossover detected' };
  }

  /**
   * RSI Reversal Strategy
   */
  private evaluateRSIReversal(closes: number[], currentPrice: number, strategy: StrategyConfig): TradeSignal {
    const period = strategy.params.rsiPeriod || 14;
    const rsi = calculateRSI(closes, period);
    const currRsi = rsi[rsi.length - 1];
    const prevRsi = rsi[rsi.length - 2];

    if (isNaN(currRsi)) {
      return { action: 'HOLD', reason: 'Insufficient data for RSI' };
    }

    const low = strategy.params.rsiThresholdLow || 30;
    const high = strategy.params.rsiThresholdHigh || 70;
    const stopLossPercent = strategy.params.stopLossPercent || 3;
    const takeProfitPercent = strategy.params.takeProfitPercent || 6;

    // Oversold - potential buy
    if (currRsi < low && prevRsi >= low) {
      return {
        action: 'BUY',
        price: currentPrice,
        reason: `RSI oversold at ${currRsi.toFixed(1)}`,
        confidence: Math.max(50, 100 - currRsi),
        stopLoss: currentPrice * (1 - stopLossPercent / 100),
        takeProfit: currentPrice * (1 + takeProfitPercent / 100),
        indicators: { rsi: currRsi }
      };
    }

    // Overbought - potential sell
    if (currRsi > high && prevRsi <= high) {
      return {
        action: 'SELL',
        price: currentPrice,
        reason: `RSI overbought at ${currRsi.toFixed(1)}`,
        confidence: Math.max(50, currRsi - 50),
        stopLoss: currentPrice * (1 + stopLossPercent / 100),
        takeProfit: currentPrice * (1 - takeProfitPercent / 100),
        indicators: { rsi: currRsi }
      };
    }

    return { action: 'HOLD', reason: `RSI neutral at ${currRsi.toFixed(1)}` };
  }

  /**
   * MACD Momentum Strategy
   */
  private evaluateMACDMomentum(closes: number[], currentPrice: number, strategy: StrategyConfig): TradeSignal {
    const fast = strategy.params.macdFast || 12;
    const slow = strategy.params.macdSlow || 26;
    const signal = strategy.params.macdSignal || 9;

    const { macdLine, signalLine, histogram } = calculateMACD(closes, fast, slow, signal);
    
    const currMACD = macdLine[macdLine.length - 1];
    const currSignal = signalLine[signalLine.length - 1];
    const prevMACD = macdLine[macdLine.length - 2];
    const prevSignal = signalLine[signalLine.length - 2];
    const currHist = histogram[histogram.length - 1];

    if (isNaN(currMACD) || isNaN(currSignal)) {
      return { action: 'HOLD', reason: 'Insufficient data for MACD' };
    }

    const stopLossPercent = strategy.params.stopLossPercent || 2.5;
    const takeProfitPercent = strategy.params.takeProfitPercent || 5;

    // Bullish MACD crossover
    if (prevMACD <= prevSignal && currMACD > currSignal && currHist > 0) {
      return {
        action: 'BUY',
        price: currentPrice,
        reason: `MACD bullish crossover (histogram: ${currHist.toFixed(2)})`,
        confidence: 70,
        stopLoss: currentPrice * (1 - stopLossPercent / 100),
        takeProfit: currentPrice * (1 + takeProfitPercent / 100),
        indicators: { macd: currMACD, signal: currSignal, histogram: currHist }
      };
    }

    // Bearish MACD crossover
    if (prevMACD >= prevSignal && currMACD < currSignal && currHist < 0) {
      return {
        action: 'SELL',
        price: currentPrice,
        reason: `MACD bearish crossover (histogram: ${currHist.toFixed(2)})`,
        confidence: 70,
        stopLoss: currentPrice * (1 + stopLossPercent / 100),
        takeProfit: currentPrice * (1 - takeProfitPercent / 100),
        indicators: { macd: currMACD, signal: currSignal, histogram: currHist }
      };
    }

    return { action: 'HOLD', reason: 'No MACD signal' };
  }

  /**
   * EMA Trend Following Strategy
   */
  private evaluateEMATrend(closes: number[], currentPrice: number, strategy: StrategyConfig): TradeSignal {
    const fast = strategy.params.fastPeriod || 9;
    const slow = strategy.params.slowPeriod || 21;

    const emaFast = calculateEMA(closes, fast);
    const emaSlow = calculateEMA(closes, slow);

    const currFast = emaFast[emaFast.length - 1];
    const currSlow = emaSlow[emaSlow.length - 1];
    const prevFast = emaFast[emaFast.length - 2];
    const prevSlow = emaSlow[emaSlow.length - 2];

    if (isNaN(currFast) || isNaN(currSlow)) {
      return { action: 'HOLD', reason: 'Insufficient data for EMA' };
    }

    const stopLossPercent = strategy.params.stopLossPercent || 2;
    const takeProfitPercent = strategy.params.takeProfitPercent || 6;

    // Bullish EMA crossover
    if (prevFast <= prevSlow && currFast > currSlow) {
      return {
        action: 'BUY',
        price: currentPrice,
        reason: `EMA(${fast}) crossed above EMA(${slow}) - Uptrend`,
        confidence: 80,
        stopLoss: currentPrice * (1 - stopLossPercent / 100),
        takeProfit: currentPrice * (1 + takeProfitPercent / 100),
        indicators: { ema_fast: currFast, ema_slow: currSlow }
      };
    }

    // Bearish EMA crossover
    if (prevFast >= prevSlow && currFast < currSlow) {
      return {
        action: 'SELL',
        price: currentPrice,
        reason: `EMA(${fast}) crossed below EMA(${slow}) - Downtrend`,
        confidence: 80,
        stopLoss: currentPrice * (1 + stopLossPercent / 100),
        takeProfit: currentPrice * (1 - takeProfitPercent / 100),
        indicators: { ema_fast: currFast, ema_slow: currSlow }
      };
    }

    return { action: 'HOLD', reason: 'Trend continuation' };
  }

  /**
   * Calculate position size based on risk management
   */
  public calculatePositionSize(strategy: StrategyConfig, accountBalance: number, currentPrice: number): number {
    const tradeAmount = strategy.params.tradeAmount || 1000;
    const riskPerTrade = strategy.params.riskPerTrade || 2; // 2% of account
    const stopLossPercent = strategy.params.stopLossPercent || 2;

    // Calculate position size based on risk
    const riskAmount = accountBalance * (riskPerTrade / 100);
    const stopLossDistance = currentPrice * (stopLossPercent / 100);
    const positionSize = riskAmount / stopLossDistance;

    // Cap at trade amount
    const maxPosition = tradeAmount / currentPrice;
    
    return Math.min(positionSize, maxPosition);
  }

  /**
   * Check entry conditions for a strategy
   */
  public async checkEntryConditions(strategy: StrategyConfig, symbol: string): Promise<boolean> {
    const signal = await this.evaluate(strategy, symbol);
    return signal.action === 'BUY' && (signal.confidence || 0) >= 60;
  }

  /**
   * Check exit conditions for an open position
   */
  public async checkExitConditions(
    strategy: StrategyConfig,
    position: any,
    currentPrice: number
  ): Promise<{ shouldExit: boolean; reason: string }> {
    const entryPrice = position.entry_price || position.entryPrice;
    const stopLoss = position.stop_loss || position.stopLoss;
    const takeProfit = position.take_profit || position.takeProfit;

    // Check stop loss
    if (stopLoss && currentPrice <= stopLoss) {
      return { shouldExit: true, reason: 'Stop loss triggered' };
    }

    // Check take profit
    if (takeProfit && currentPrice >= takeProfit) {
      return { shouldExit: true, reason: 'Take profit reached' };
    }

    // Check strategy exit signal
    const signal = await this.evaluate(strategy, position.symbol);
    if (signal.action === 'SELL' && (signal.confidence || 0) >= 60) {
      return { shouldExit: true, reason: signal.reason || 'Strategy exit signal' };
    }

    return { shouldExit: false, reason: 'No exit condition met' };
  }

  /**
   * Manage risk for open positions (trailing stop, etc.)
   */
  public async manageRisk(position: any, currentPrice: number, strategy: StrategyConfig): Promise<void> {
    const entryPrice = position.entry_price || position.entryPrice;
    const trailingStopPercent = strategy.params.trailingStopPercent;

    if (!trailingStopPercent) return;

    // Calculate trailing stop
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    
    if (pnlPercent > trailingStopPercent) {
      const newStopLoss = currentPrice * (1 - trailingStopPercent / 100);
      const currentStopLoss = position.stop_loss || 0;

      // Only update if new stop loss is higher
      if (newStopLoss > currentStopLoss) {
        await tradingService.updatePositionRisk(position.symbol, newStopLoss, position.take_profit);
      }
    }
  }

  /**
   * Simple backtest function
   */
  public async backtest(
    strategy: StrategyConfig,
    symbol: string,
    startDate: Date,
    endDate: Date,
    initialBalance: number = 10000
  ): Promise<BacktestResult> {
    // This is a simplified backtest - in production, you'd use historical data
    const trades: any[] = [];
    let balance = initialBalance;
    let equity = [balance];
    let wins = 0;
    let losses = 0;

    // Simulate 50 trades
    for (let i = 0; i < 50; i++) {
      const entryPrice = 50000 + Math.random() * 10000;
      const exitPrice = entryPrice * (1 + (Math.random() - 0.45) * 0.1);
      const pnl = (exitPrice - entryPrice) * 0.1; // 0.1 BTC position
      
      balance += pnl;
      equity.push(balance);
      trades.push({ entry: entryPrice, exit: exitPrice, pnl, type: pnl > 0 ? 'WIN' : 'LOSS' });
      
      if (pnl > 0) wins++;
      else losses++;
    }

    const totalPnL = balance - initialBalance;
    const winRate = wins / (wins + losses);
    const returns = equity.map((e, i) => i === 0 ? 0 : (e - equity[i-1]) / equity[i-1]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252);

    const maxDrawdown = equity.reduce((max, val, i) => {
      const peak = Math.max(...equity.slice(0, i + 1));
      const drawdown = (peak - val) / peak;
      return Math.max(max, drawdown);
    }, 0);

    return {
      trades: trades.length,
      winRate: winRate * 100,
      totalPnL,
      maxDrawdown: maxDrawdown * 100,
      sharpeRatio,
      equity,
      trades_detail: trades
    };
  }
}

export const strategyService = new StrategyService();
