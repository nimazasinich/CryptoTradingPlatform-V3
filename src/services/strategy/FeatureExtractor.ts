import { Candle, TechnicalFeatures, TrendDirection } from '../../types/strategy';

export class FeatureExtractor {
  extract(candles: Candle[]): TechnicalFeatures {
    if (candles.length < 50) {
      throw new Error('Minimum 50 candles required for feature extraction');
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    return {
      // Price action
      trend: this.detectTrend(candles),
      higherHighs: this.checkHigherHighs(highs),
      higherLows: this.checkHigherLows(lows),
      lowerHighs: this.checkLowerHighs(highs),
      lowerLows: this.checkLowerLows(lows),
      
      // Indicators
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      sma20: this.calculateSMA(closes, 20),
      sma50: this.calculateSMA(closes, 50),
      ema12: this.calculateEMA(closes, 12),
      ema26: this.calculateEMA(closes, 26),
      bollingerBands: this.calculateBollingerBands(closes, 20, 2),
      atr: this.calculateATR(candles, 14),
      adx: this.calculateADX(candles, 14),
      stochastic: this.calculateStochastic(candles, 14, 3),
      roc: this.calculateROC(closes, 12),
      
      // Volume
      volume: volumes[volumes.length - 1],
      avgVolume: this.calculateAverage(volumes.slice(-20)),
      volumeRatio: volumes[volumes.length - 1] / this.calculateAverage(volumes.slice(-20)),
      
      // Support/Resistance
      support: this.findSupport(lows),
      resistance: this.findResistance(highs)
    };
  }

  // ========== TREND DETECTION ==========

  private detectTrend(candles: Candle[]): TrendDirection {
    const closes = candles.map(c => c.close);
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const currentPrice = closes[closes.length - 1];

    const bullishCount = [
      currentPrice > sma20,
      currentPrice > sma50,
      sma20 > sma50,
      this.checkHigherHighs(closes.slice(-10)),
      this.checkHigherLows(closes.slice(-10))
    ].filter(Boolean).length;

    if (bullishCount >= 4) return 'BULLISH';
    if (bullishCount <= 1) return 'BEARISH';
    return 'NEUTRAL';
  }

  private checkHigherHighs(values: number[]): boolean {
    if (values.length < 3) return false;
    const recentHighs = this.findPeaks(values).slice(-3);
    if (recentHighs.length < 2) return false;
    return recentHighs[recentHighs.length - 1] > recentHighs[0];
  }

  private checkHigherLows(values: number[]): boolean {
    if (values.length < 3) return false;
    const recentLows = this.findValleys(values).slice(-3);
    if (recentLows.length < 2) return false;
    return recentLows[recentLows.length - 1] > recentLows[0];
  }

  private checkLowerHighs(values: number[]): boolean {
    if (values.length < 3) return false;
    const recentHighs = this.findPeaks(values).slice(-3);
    if (recentHighs.length < 2) return false;
    return recentHighs[recentHighs.length - 1] < recentHighs[0];
  }

  private checkLowerLows(values: number[]): boolean {
    if (values.length < 3) return false;
    const recentLows = this.findValleys(values).slice(-3);
    if (recentLows.length < 2) return false;
    return recentLows[recentLows.length - 1] < recentLows[0];
  }

  private findPeaks(values: number[]): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        peaks.push(values[i]);
      }
    }
    return peaks;
  }

  private findValleys(values: number[]): number[] {
    const valleys: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
        valleys.push(values[i]);
      }
    }
    return valleys;
  }

  // ========== RSI (Relative Strength Index) ==========

  private calculateRSI(closes: number[], period: number): number {
    if (closes.length < period + 1) return 50;

    const changes: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }

    let avgGain = 0;
    let avgLoss = 0;

    // Initial average
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= period;
    avgLoss /= period;

    // Smoothed averages
    for (let i = period; i < changes.length; i++) {
      if (changes[i] > 0) {
        avgGain = (avgGain * (period - 1) + changes[i]) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // ========== MACD (Moving Average Convergence Divergence) ==========

  private calculateMACD(closes: number[]): { value: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macdLine = ema12 - ema26;

    // Calculate signal line (9-period EMA of MACD)
    const macdValues: number[] = [];
    for (let i = 26; i <= closes.length; i++) {
      const slice = closes.slice(0, i);
      const e12 = this.calculateEMA(slice, 12);
      const e26 = this.calculateEMA(slice, 26);
      macdValues.push(e12 - e26);
    }
    const signalLine = this.calculateEMA(macdValues, 9);
    const histogram = macdLine - signalLine;

    return {
      value: macdLine,
      signal: signalLine,
      histogram
    };
  }

  // ========== SMA (Simple Moving Average) ==========

  private calculateSMA(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1];
    const slice = values.slice(-period);
    return this.calculateAverage(slice);
  }

  // ========== EMA (Exponential Moving Average) ==========

  private calculateEMA(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = this.calculateAverage(values.slice(0, period));

    for (let i = period; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  // ========== BOLLINGER BANDS ==========

  private calculateBollingerBands(closes: number[], period: number, stdDev: number): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const middle = this.calculateSMA(closes, period);
    const slice = closes.slice(-period);
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: middle + (std * stdDev),
      middle,
      lower: middle - (std * stdDev)
    };
  }

  // ========== ATR (Average True Range) ==========

  private calculateATR(candles: Candle[], period: number): number {
    if (candles.length < period + 1) return 0;

    const trueRanges: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    return this.calculateAverage(trueRanges.slice(-period));
  }

  // ========== ADX (Average Directional Index) ==========

  private calculateADX(candles: Candle[], period: number): number {
    if (candles.length < period + 1) return 0;

    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const tr: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const highDiff = candles[i].high - candles[i - 1].high;
      const lowDiff = candles[i - 1].low - candles[i].low;

      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

      const trValue = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      tr.push(trValue);
    }

    const smoothedTR = this.calculateAverage(tr.slice(-period));
    const smoothedPlusDM = this.calculateAverage(plusDM.slice(-period));
    const smoothedMinusDM = this.calculateAverage(minusDM.slice(-period));

    const plusDI = (smoothedPlusDM / smoothedTR) * 100;
    const minusDI = (smoothedMinusDM / smoothedTR) * 100;

    const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    return dx;
  }

  // ========== STOCHASTIC OSCILLATOR ==========

  private calculateStochastic(candles: Candle[], kPeriod: number, dPeriod: number): {
    k: number;
    d: number;
  } {
    if (candles.length < kPeriod) return { k: 50, d: 50 };

    const recentCandles = candles.slice(-kPeriod);
    const currentClose = recentCandles[recentCandles.length - 1].close;
    const highestHigh = Math.max(...recentCandles.map(c => c.high));
    const lowestLow = Math.min(...recentCandles.map(c => c.low));

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    // Calculate %D (SMA of %K)
    const kValues: number[] = [];
    for (let i = kPeriod; i <= candles.length; i++) {
      const slice = candles.slice(i - kPeriod, i);
      const close = slice[slice.length - 1].close;
      const high = Math.max(...slice.map(c => c.high));
      const low = Math.min(...slice.map(c => c.low));
      kValues.push(((close - low) / (high - low)) * 100);
    }

    const d = this.calculateAverage(kValues.slice(-dPeriod));

    return { k, d };
  }

  // ========== ROC (Rate of Change) ==========

  private calculateROC(closes: number[], period: number): number {
    if (closes.length < period + 1) return 0;

    const currentPrice = closes[closes.length - 1];
    const pastPrice = closes[closes.length - 1 - period];

    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  // ========== SUPPORT/RESISTANCE ==========

  private findSupport(lows: number[]): number {
    const recentLows = lows.slice(-20);
    const valleys = this.findValleys(recentLows);
    if (valleys.length === 0) return Math.min(...recentLows);
    return Math.min(...valleys);
  }

  private findResistance(highs: number[]): number {
    const recentHighs = highs.slice(-20);
    const peaks = this.findPeaks(recentHighs);
    if (peaks.length === 0) return Math.max(...recentHighs);
    return Math.max(...peaks);
  }

  // ========== UTILITY FUNCTIONS ==========

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
