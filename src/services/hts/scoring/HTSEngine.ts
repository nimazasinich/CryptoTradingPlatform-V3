// ============================================================================
// HTS Scoring Engine
// ============================================================================

import { OHLCV, SMCData, HTSResult, HTSWeights } from '../../../types/hts';

/**
 * HTS Scoring Engine
 * Calculates final trading scores by combining multiple analysis layers
 */
export class HTSEngine {
  private weights: HTSWeights;

  constructor() {
    this.weights = this.getDefaultWeights();
  }

  /**
   * Default weight configuration
   * Total must equal 1.0 (100%)
   */
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
   * Calculate core indicators score (0-100)
   * Analyzes RSI, MACD, EMA, and SMA alignment
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

    // RSI analysis (±15 points)
    if (rsi < 30) {
      score += 15;
      reasons.push(`RSI at ${rsi.toFixed(1)} - Oversold (potential buy)`);
    } else if (rsi > 70) {
      score -= 15;
      reasons.push(`RSI at ${rsi.toFixed(1)} - Overbought (potential sell)`);
    } else {
      score += 5;
      reasons.push(`RSI at ${rsi.toFixed(1)} - Neutral zone`);
    }

    // MACD analysis (±15 points)
    if (macd > 0) {
      score += 15;
      reasons.push('MACD positive - Bullish momentum');
    } else {
      score -= 15;
      reasons.push('MACD negative - Bearish momentum');
    }

    // Trend alignment analysis (±10 points)
    if (price > ema50 && ema50 > sma200) {
      score += 10;
      reasons.push('Strong uptrend - Price above EMA50 and SMA200');
    } else if (price < ema50 && ema50 < sma200) {
      score -= 10;
      reasons.push('Strong downtrend - Price below EMA50 and SMA200');
    } else {
      reasons.push('Mixed signals - No clear trend alignment');
    }

    return [Math.max(0, Math.min(100, 50 + score)), reasons];
  }

  /**
   * Calculate Smart Money Concepts score (0-100)
   */
  calculateSMCScore(smc: SMCData): number {
    return smc.smartMoneyScore * this.weights.smc.total;
  }

  /**
   * Generate final trading signal
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
    
    // Calculate component scores
    const [coreScore, coreReasons] = this.calculateCoreScore(
      indicators.rsi,
      indicators.macd,
      currentPrice,
      indicators.ema50,
      indicators.sma200
    );

    const smcScore = this.calculateSMCScore(smc);
    
    // Placeholder scores for other components (to be implemented)
    const patternScore = 50; // Neutral
    const sentimentScore = 50; // Neutral
    const mlScore = 50; // Neutral

    // Calculate weighted final score
    const finalScore = 
      coreScore * this.weights.core.total +
      smcScore * this.weights.smc.total +
      patternScore * this.weights.patterns.total +
      sentimentScore * this.weights.sentiment.total +
      mlScore * this.weights.ml.total;

    // Determine action based on RSI and MACD
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (finalScore > 60 && indicators.rsi < 50 && indicators.macd > 0) {
      action = 'BUY';
    } else if (finalScore < 40 && indicators.rsi > 50 && indicators.macd < 0) {
      action = 'SELL';
    }

    // Calculate entry/exit levels using ATR
    const stopLoss = action === 'BUY' 
      ? currentPrice - (2 * indicators.atr)
      : currentPrice + (2 * indicators.atr);
    
    const takeProfit1 = action === 'BUY'
      ? currentPrice + (2 * indicators.atr)
      : currentPrice - (2 * indicators.atr);
    
    const takeProfit2 = action === 'BUY'
      ? currentPrice + (3 * indicators.atr)
      : currentPrice - (3 * indicators.atr);
    
    const takeProfit3 = action === 'BUY'
      ? currentPrice + (4 * indicators.atr)
      : currentPrice - (4 * indicators.atr);

    // Calculate risk/reward percentages
    const riskPercent = Math.abs((currentPrice - stopLoss) / currentPrice) * 100;
    const rewardPercent = Math.abs((takeProfit1 - currentPrice) / currentPrice) * 100;

    // Add SMC insights to reasoning
    if (smc.orderBlocks.length > 0) {
      coreReasons.push(`${smc.orderBlocks.length} Order Block(s) detected`);
    }
    if (smc.liquidityZones.length > 0) {
      coreReasons.push(`${smc.liquidityZones.length} Liquidity Zone(s) identified`);
    }
    if (smc.fvgs.length > 0) {
      coreReasons.push(`${smc.fvgs.length} Fair Value Gap(s) present`);
    }

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

  /**
   * Update weights configuration
   */
  updateWeights(newWeights: Partial<HTSWeights>) {
    this.weights = { ...this.weights, ...newWeights };
  }

  /**
   * Get current weights
   */
  getWeights(): HTSWeights {
    return { ...this.weights };
  }
}
