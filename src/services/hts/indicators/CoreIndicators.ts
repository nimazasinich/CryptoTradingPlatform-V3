// ============================================================================
// Core Technical Indicators for HTS
// ============================================================================

import { MACDResult, BollingerBands } from '../../../types/hts';

/**
 * Core technical indicators calculator
 * Provides RSI, MACD, EMA, SMA, Bollinger Bands, ATR, and OBV
 */
export class CoreIndicators {
  /**
   * Calculate RSI (Relative Strength Index)
   * RSI < 30 = Oversold (potential buy)
   * RSI > 70 = Overbought (potential sell)
   */
  static calculateRSI(closes: number[], period: number = 14): number[] {
    if (closes.length < period + 1) return [];

    const rsi: number[] = [];
    const changes: number[] = [];
    
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }

    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }

    avgGain /= period;
    avgLoss /= period;

    for (let i = period; i < changes.length; i++) {
      const rs = avgGain / (avgLoss || 1);
      rsi.push(100 - (100 / (1 + rs)));

      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   * MACD > 0 = Bullish trend
   * MACD < 0 = Bearish trend
   */
  static calculateMACD(
    closes: number[],
    fast: number = 12,
    slow: number = 26,
    signal: number = 9
  ): MACDResult {
    const emaFast = this.calculateEMA(closes, fast);
    const emaSlow = this.calculateEMA(closes, slow);
    
    const macdLine: number[] = [];
    for (let i = 0; i < Math.min(emaFast.length, emaSlow.length); i++) {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }

    const signalLine = this.calculateEMA(macdLine, signal);
    const histogram: number[] = [];
    
    for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
      histogram.push(macdLine[i] - signalLine[i]);
    }

    return { macd: macdLine, signal: signalLine, histogram };
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  static calculateEMA(closes: number[], period: number): number[] {
    if (closes.length < period) return [];

    const k = 2 / (period + 1);
    const ema: number[] = [];
    
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += closes[i];
    }
    ema.push(sum / period);

    for (let i = period; i < closes.length; i++) {
      ema.push(closes[i] * k + ema[ema.length - 1] * (1 - k));
    }

    return ema;
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  static calculateSMA(closes: number[], period: number): number[] {
    if (closes.length < period) return [];

    const sma: number[] = [];
    for (let i = period - 1; i < closes.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += closes[i - j];
      }
      sma.push(sum / period);
    }

    return sma;
  }

  /**
   * Calculate Bollinger Bands
   * Price near Lower Band = potential buy
   * Price near Upper Band = potential sell
   */
  static calculateBollingerBands(
    closes: number[],
    period: number = 20,
    stdDev: number = 2
  ): BollingerBands {
    const sma = this.calculateSMA(closes, period);
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < sma.length; i++) {
      const slice = closes.slice(i, i + period);
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma[i], 2), 0) / period;
      const std = Math.sqrt(variance);

      upper.push(sma[i] + stdDev * std);
      lower.push(sma[i] - stdDev * std);
    }

    return { upper, middle: sma, lower };
  }

  /**
   * Calculate ATR (Average True Range)
   * Indicates market volatility
   */
  static calculateATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): number[] {
    if (highs.length < period + 1) return [];

    const trueRanges: number[] = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    return this.calculateSMA(trueRanges, period);
  }

  /**
   * Calculate OBV (On-Balance Volume)
   * OBV trending up = buying pressure
   * OBV trending down = selling pressure
   */
  static calculateOBV(closes: number[], volumes: number[]): number[] {
    const obv: number[] = [volumes[0]];

    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv.push(obv[obv.length - 1] + volumes[i]);
      } else if (closes[i] < closes[i - 1]) {
        obv.push(obv[obv.length - 1] - volumes[i]);
      } else {
        obv.push(obv[obv.length - 1]);
      }
    }

    return obv;
  }
}
