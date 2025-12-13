// ============================================================================
// Smart Money Concepts (SMC) Analyzer
// ============================================================================

import { OHLCV, OrderBlock, LiquidityZone, FVG, SMCData } from '../../../types/hts';

/**
 * Smart Money Concepts analyzer
 * Detects institutional trading patterns like Order Blocks, Liquidity Zones, and FVGs
 */
export class SMCAnalyzer {
  /**
   * Detect Order Blocks (institutional accumulation/distribution zones)
   * Last bearish candle before strong bullish move = Bullish OB
   * Last bullish candle before strong bearish move = Bearish OB
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
   * Detect Liquidity Zones (support/resistance with multiple touches)
   */
  static detectLiquidityZones(ohlcv: OHLCV[], threshold: number = 0.02): LiquidityZone[] {
    const zones: Map<number, LiquidityZone> = new Map();

    for (let i = 1; i < ohlcv.length - 1; i++) {
      const prev = ohlcv[i - 1];
      const curr = ohlcv[i];
      const next = ohlcv[i + 1];

      // Detect resistance (swing high)
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

      // Detect support (swing low)
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
   * Detect Fair Value Gaps (price imbalance zones)
   */
  static detectFVG(ohlcv: OHLCV[]): FVG[] {
    const fvgs: FVG[] = [];

    for (let i = 1; i < ohlcv.length - 1; i++) {
      const prev = ohlcv[i - 1];
      const curr = ohlcv[i];
      const next = ohlcv[i + 1];

      // Bullish FVG: gap between previous high and next low
      if (prev.high < next.low) {
        fvgs.push({
          type: 'bullish',
          top: next.low,
          bottom: prev.high,
          timestamp: curr.timestamp,
          filled: false
        });
      } 
      // Bearish FVG: gap between previous low and next high
      else if (prev.low > next.high) {
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
   * Calculate Smart Money Score (0-100)
   * Based on number and strength of detected patterns
   */
  static calculateSmartMoneyScore(smc: SMCData): number {
    let score = 0;

    // Order blocks contribution (max 30 points)
    score += Math.min(smc.orderBlocks.length * 10, 30);
    
    // Liquidity zones contribution (max 40 points)
    score += Math.min(smc.liquidityZones.length * 8, 40);
    
    // FVGs contribution (max 30 points)
    score += Math.min(smc.fvgs.length * 10, 30);

    return Math.min(score, 100);
  }
}
