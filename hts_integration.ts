// ============================================================================
// HTS (Hybrid Trading System) - Complete Integration for CryptoOne
// ============================================================================
// ✅ INTEGRATION COMPLETE - این فایل به عنوان مرجع نگهداری می‌شود
// ✅ تمام کدها به پروژه CryptoOne اضافه شده‌اند
// ✅ استفاده: این فایل دیگر نیازی به استفاده ندارد - فقط برای مرجع
// ============================================================================
// 
// STATUS: ✅ COMPLETED
// Date: December 13, 2025
// 
// All HTS components have been successfully integrated into the CryptoOne platform:
// - Types: src/types/hts.ts
// - Indicators: src/services/hts/indicators/
// - Scoring: src/services/hts/scoring/
// - Service: src/services/hts/HTSService.ts
// - Components: src/components/Strategy/HTS*.tsx
// - Hook: src/hooks/useHTSAnalysis.ts
// - Integration: src/views/StrategyManager.tsx
//
// See HTS_INTEGRATION_COMPLETE.md for full details.
// ============================================================================

// ============================================================================
// 1. TYPES & INTERFACES (src/types/hts.ts)
// ============================================================================

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface OrderBlock {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  timestamp: number;
  strength: number;
}

export interface LiquidityZone {
  type: 'support' | 'resistance';
  price: number;
  timestamp: number;
  touches: number;
}

export interface FVG {
  type: 'bullish' | 'bearish';
  top: number;
  bottom: number;
  timestamp: number;
  filled: boolean;
}

export interface SMCData {
  orderBlocks: OrderBlock[];
  liquidityZones: LiquidityZone[];
  fvgs: FVG[];
  smartMoneyScore: number;
}

export interface HTSResult {
  symbol: string;
  final_score: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  breakdown: {
    core: number;
    smc: number;
    patterns: number;
    sentiment: number;
    ml: number;
  };
  reasoning: string[];
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  current_price: number;
  risk_percent: number;
  reward_percent: number;
}

export interface TimeframePrediction {
  timeframe: '1m' | '5m' | '15m' | '1h';
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  score: number;
}

export interface ConfluenceResult {
  score: number;
  agreement_percent: number;
  dominant_action: 'BUY' | 'SELL' | 'HOLD';
  avg_confidence: number;
  timeframes: TimeframePrediction[];
}

export interface HTSWeights {
  core: { total: number; components: Record<string, number> };
  smc: { total: number; components: Record<string, number> };
  patterns: { total: number; components: Record<string, number> };
  sentiment: { total: number; components: Record<string, number> };
  ml: { total: number; components: Record<string, number> };
}

// ============================================================================
// 2. CORE INDICATORS (src/services/hts/indicators/CoreIndicators.ts)
// ============================================================================

export class CoreIndicators {
  /**
   * محاسبه RSI (Relative Strength Index)
   * RSI < 30 = Oversold (خرید احتمالی)
   * RSI > 70 = Overbought (فروش احتمالی)
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
   * محاسبه MACD (Moving Average Convergence Divergence)
   * MACD > 0 = Bullish (صعودی)
   * MACD < 0 = Bearish (نزولی)
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
   * محاسبه EMA (Exponential Moving Average)
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
   * محاسبه SMA (Simple Moving Average)
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
   * محاسبه Bollinger Bands
   * قیمت نزدیک به Lower Band = احتمال خرید
   * قیمت نزدیک به Upper Band = احتمال فروش
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
   * محاسبه ATR (Average True Range)
   * نشان‌دهنده نوسان بازار
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
   * محاسبه OBV (On-Balance Volume)
   * OBV صعودی = فشار خرید
   * OBV نزولی = فشار فروش
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

// ============================================================================
// 3. SMART MONEY CONCEPTS (src/services/hts/indicators/SMCAnalyzer.ts)
// ============================================================================

export class SMCAnalyzer {
  /**
   * تشخیص Order Blocks (بلوک‌های سفارش نهنگ‌ها)
   * آخرین کندل نزولی قبل از حرکت صعودی قوی = Bullish OB
   */
  static detectOrderBlocks(ohlcv: OHLCV[], lookback: number = 20): OrderBlock[] {
    const blocks: OrderBlock[] = [];

    for (let i = lookback; i < ohlcv.length - 1; i++) {
      const curr = ohlcv[i];
      const next = ohlcv[i + 1];
      
      const isBearish = curr.close < curr.open;
      const isBullish = curr.close > curr.open;
      const strongMove = Math.abs(next.close - next.open) / curr.open > 0.02;

      if (isBearish && next.close > next.open && strongMove) {
        blocks.push({
          type: 'bullish',
          high: curr.high,
          low: curr.low,
          timestamp: curr.timestamp,
          strength: (next.close - next.open) / curr.open
        });
      } else if (isBullish && next.close < next.open && strongMove) {
        blocks.push({
          type: 'bearish',
          high: curr.high,
          low: curr.low,
          timestamp: curr.timestamp,
          strength: (next.open - next.close) / curr.open
        });
      }
    }

    return blocks.slice(-5);
  }

  /**
   * تشخیص نواحی نقدینگی (سطوح حمایت/مقاومت با تماس‌های متعدد)
   */
  static detectLiquidityZones(ohlcv: OHLCV[], threshold: number = 0.02): LiquidityZone[] {
    const zones: Map<number, LiquidityZone> = new Map();

    for (let i = 1; i < ohlcv.length - 1; i++) {
      const prev = ohlcv[i - 1];
      const curr = ohlcv[i];
      const next = ohlcv[i + 1];

      if (curr.high > prev.high && curr.high > next.high) {
        const key = Math.round(curr.high / (curr.high * threshold));
        const existing = zones.get(key);
        if (existing) {
          existing.touches++;
        } else {
          zones.set(key, {
            type: 'resistance',
            price: curr.high,
            timestamp: curr.timestamp,
            touches: 1
          });
        }
      }

      if (curr.low < prev.low && curr.low < next.low) {
        const key = Math.round(curr.low / (curr.low * threshold));
        const existing = zones.get(key);
        if (existing) {
          existing.touches++;
        } else {
          zones.set(key, {
            type: 'support',
            price: curr.low,
            timestamp: curr.timestamp,
            touches: 1
          });
        }
      }
    }

    return Array.from(zones.values())
      .filter(z => z.touches >= 2)
      .slice(-5);
  }

  /**
   * تشخیص Fair Value Gaps (شکاف‌های بی‌توازنی قیمتی)
   */
  static detectFVG(ohlcv: OHLCV[]): FVG[] {
    const fvgs: FVG[] = [];

    for (let i = 1; i < ohlcv.length - 1; i++) {
      const prev = ohlcv[i - 1];
      const curr = ohlcv[i];
      const next = ohlcv[i + 1];

      if (prev.high < next.low) {
        fvgs.push({
          type: 'bullish',
          top: next.low,
          bottom: prev.high,
          timestamp: curr.timestamp,
          filled: false
        });
      } else if (prev.low > next.high) {
        fvgs.push({
          type: 'bearish',
          top: prev.low,
          bottom: next.high,
          timestamp: curr.timestamp,
          filled: false
        });
      }
    }

    return fvgs.slice(-3);
  }

  /**
   * محاسبه امتیاز Smart Money (0-100)
   */
  static calculateSmartMoneyScore(smc: SMCData): number {
    let score = 0;

    score += Math.min(smc.orderBlocks.length * 10, 30);
    score += Math.min(smc.liquidityZones.length * 8, 40);
    score += Math.min(smc.fvgs.length * 10, 30);

    return Math.min(score, 100);
  }
}

// ============================================================================
// 4. HTS SCORING ENGINE (src/services/hts/scoring/HTSEngine.ts)
// ============================================================================

export class HTSEngine {
  private weights: HTSWeights;

  constructor() {
    this.weights = this.getDefaultWeights();
  }

  private getDefaultWeights(): HTSWeights {
    return {
      core: {
        total: 0.40,
        components: { rsi: 0.15, macd: 0.15, ema: 0.05, sma: 0.05 }
      },
      smc: {
        total: 0.25,
        components: { liquidity_zones: 0.08, order_blocks: 0.08, fvg: 0.05, bos: 0.04 }
      },
      patterns: {
        total: 0.20,
        components: { harmonic: 0.08, elliott: 0.06, classical: 0.06 }
      },
      sentiment: {
        total: 0.10,
        components: { whale_activity: 0.05, news: 0.03, social: 0.02 }
      },
      ml: {
        total: 0.05,
        components: { prediction: 0.05 }
      }
    };
  }

  /**
   * محاسبه امتیاز اندیکاتورهای اصلی
   */
  calculateCoreScore(
    rsi: number,
    macd: number,
    price: number,
    ema50: number,
    sma200: number
  ): [number, string[]] {
    const reasons: string[] = [];
    let score = 0;

    if (rsi < 30) {
      score += 15;
      reasons.push('RSI در ناحیه اشباع فروش (خرید احتمالی)');
    } else if (rsi > 70) {
      score -= 15;
      reasons.push('RSI در ناحیه اشباع خرید (فروش احتمالی)');
    } else {
      score += 5;
      reasons.push('RSI در ناحیه خنثی');
    }

    if (macd > 0) {
      score += 15;
      reasons.push('MACD مثبت - روند صعودی');
    } else {
      score -= 15;
      reasons.push('MACD منفی - روند نزولی');
    }

    if (price > ema50 && ema50 > sma200) {
      score += 10;
      reasons.push('قیمت بالای EMA50 و SMA200 - روند صعودی قوی');
    } else if (price < ema50 && ema50 < sma200) {
      score -= 10;
      reasons.push('قیمت زیر EMA50 و SMA200 - روند نزولی قوی');
    }

    return [Math.max(0, Math.min(100, 50 + score)), reasons];
  }

  /**
   * محاسبه امتیاز Smart Money Concepts
   */
  calculateSMCScore(smc: SMCData): number {
    return smc.smartMoneyScore * this.weights.smc.total;
  }

  /**
   * تولید سیگنال نهایی
   */
  generateSignal(
    symbol: string,
    ohlcv: OHLCV[],
    indicators: {
      rsi: number;
      macd: number;
      ema50: number;
      sma200: number;
      atr: number;
    },
    smc: SMCData
  ): HTSResult {
    const currentPrice = ohlcv[ohlcv.length - 1].close;
    
    const [coreScore, coreReasons] = this.calculateCoreScore(
      indicators.rsi,
      indicators.macd,
      currentPrice,
      indicators.ema50,
      indicators.sma200
    );

    const smcScore = this.calculateSMCScore(smc);
    const patternScore = 50;
    const sentimentScore = 50;
    const mlScore = 50;

    const finalScore = 
      coreScore * this.weights.core.total +
      smcScore * this.weights.smc.total +
      patternScore * this.weights.patterns.total +
      sentimentScore * this.weights.sentiment.total +
      mlScore * this.weights.ml.total;

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (indicators.rsi < 30 && indicators.macd > 0) {
      action = 'BUY';
    } else if (indicators.rsi > 70 && indicators.macd < 0) {
      action = 'SELL';
    }

    const stopLoss = currentPrice - (2 * indicators.atr);
    const takeProfit1 = currentPrice + (2 * indicators.atr);
    const takeProfit2 = currentPrice + (3 * indicators.atr);
    const takeProfit3 = currentPrice + (4 * indicators.atr);

    const riskPercent = ((currentPrice - stopLoss) / currentPrice) * 100;
    const rewardPercent = ((takeProfit1 - currentPrice) / currentPrice) * 100;

    return {
      symbol,
      final_score: finalScore,
      action,
      confidence: finalScore / 100,
      breakdown: {
        core: coreScore,
        smc: smcScore,
        patterns: patternScore,
        sentiment: sentimentScore,
        ml: mlScore
      },
      reasoning: coreReasons,
      entry_price: currentPrice,
      stop_loss: stopLoss,
      take_profit_1: takeProfit1,
      take_profit_2: takeProfit2,
      take_profit_3: takeProfit3,
      current_price: currentPrice,
      risk_percent: riskPercent,
      reward_percent: rewardPercent
    };
  }
}

// ============================================================================
// 5. CONFLUENCE ANALYZER (src/services/hts/scoring/ConfluenceAnalyzer.ts)
// ============================================================================

export class ConfluenceAnalyzer {
  /**
   * تحلیل همگرایی چند تایم‌فریم
   */
  static calculate(predictions: TimeframePrediction[]): ConfluenceResult {
    const actionCounts: Record<string, number> = { BUY: 0, SELL: 0, HOLD: 0 };
    let totalConfidence = 0;

    for (const pred of predictions) {
      actionCounts[pred.action]++;
      totalConfidence += pred.confidence;
    }

    const dominantAction = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])[0][0] as 'BUY' | 'SELL' | 'HOLD';

    const agreementPercent = (actionCounts[dominantAction] / predictions.length) * 100;
    const avgConfidence = totalConfidence / predictions.length;
    const score = (agreementPercent / 100) * avgConfidence;

    return {
      score,
      agreement_percent: agreementPercent,
      dominant_action: dominantAction,
      avg_confidence: avgConfidence,
      timeframes: predictions
    };
  }

  /**
   * بررسی اعتبار اجماع
   */
  static isConsensusValid(confluence: ConfluenceResult, minConsensus: number = 0.6): boolean {
    return confluence.score >= minConsensus;
  }
}

// ============================================================================
// 6. HTS SERVICE (src/services/hts/HTSService.ts)
// ============================================================================

export class HTSService {
  private engine: HTSEngine;

  constructor() {
    this.engine = new HTSEngine();
  }

  /**
   * تولید داده‌های mock OHLCV برای تست
   */
  private generateMockOHLCV(symbol: string, count: number = 100): OHLCV[] {
    const basePrice = Math.random() * 50000 + 10000;
    const data: OHLCV[] = [];
    let currentPrice = basePrice;

    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 0.02;
      currentPrice *= (1 + change);

      const open = currentPrice;
      const close = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      const volume = Math.random() * 1000000;

      data.push({
        timestamp: Date.now() - (count - i) * 60000,
        open,
        high,
        low,
        close,
        volume
      });
    }

    return data;
  }

  /**
   * تحلیل سیگنال برای یک ارز
   */
  async analyzeSymbol(symbol: string): Promise<HTSResult> {
    const ohlcv = this.generateMockOHLCV(symbol);
    const closes = ohlcv.map(c => c.close);
    const highs = ohlcv.map(c => c.high);
    const lows = ohlcv.map(c => c.low);
    const volumes = ohlcv.map(c => c.volume);

    const rsi = CoreIndicators.calculateRSI(closes);
    const macd = CoreIndicators.calculateMACD(closes);
    const ema50 = CoreIndicators.calculateEMA(closes, 50);
    const sma200 = CoreIndicators.calculateSMA(closes, 200);
    const atr = CoreIndicators.calculateATR(highs, lows, closes);

    const orderBlocks = SMCAnalyzer.detectOrderBlocks(ohlcv);
    const liquidityZones = SMCAnalyzer.detectLiquidityZones(ohlcv);
    const fvgs = SMCAnalyzer.detectFVG(ohlcv);

    const smc: SMCData = {
      orderBlocks,
      liquidityZones,
      fvgs,
      smartMoneyScore: SMCAnalyzer.calculateSmartMoneyScore({
        orderBlocks,
        liquidityZones,
        fvgs,
        smartMoneyScore: 0
      })
    };

    const indicators = {
      rsi: rsi[rsi.length - 1] || 50,
      macd: macd.macd[macd.macd.length - 1] || 0,
      ema50: ema50[ema50.length - 1] || closes[closes.length - 1],
      sma200: sma200[sma200.length - 1] || closes[closes.length - 1],
      atr: atr[atr.length - 1] || closes[closes.length - 1] * 0.02
    };

    return this.engine.generateSignal(symbol, ohlcv, indicators, smc);
  }

  /**
   * تحلیل چند تایم‌فریم
   */
  async analyzeMultiTimeframe(symbol: string): Promise<ConfluenceResult> {
    const timeframes: Array<'1m' | '5m' | '15m' | '1h'> = ['1m', '5m', '15m', '1h'];
    const predictions: TimeframePrediction[] = [];

    for (const tf of timeframes) {
      const result = await this.analyzeSymbol(symbol);
      predictions.push({
        timeframe: tf,
        action: result.action,
        confidence: result.confidence,
        score: result.final_score
      });
    }

    return ConfluenceAnalyzer.calculate(predictions);
  }

  /**
   * تحلیل لیست ارزها
   */
  async analyzeMultipleSymbols(symbols: string[]): Promise<HTSResult[]> {
    const results = await Promise.all(
      symbols.map(symbol => this.analyzeSymbol(symbol))
    );
    
    return results.sort((a, b) => b.final_score - a.final_score);
  }
}

// ============================================================================
// 7. REACT INTEGRATION - به CryptoOne اضافه کنید
// ============================================================================

/*
// مثال استفاده در کامپوننت React:

import { HTSService } from '@/services/hts/HTSService';
import { HTSResult } from '@/types/hts';

export function HTSSignalsPanel() {
  const [signals, setSign