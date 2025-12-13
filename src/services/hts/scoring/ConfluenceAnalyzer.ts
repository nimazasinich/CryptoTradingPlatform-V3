// ============================================================================
// Confluence Analyzer
// ============================================================================

import { TimeframePrediction, ConfluenceResult } from '../../../types/hts';

/**
 * Multi-timeframe Confluence Analyzer
 * Validates trading signals across multiple timeframes
 */
export class ConfluenceAnalyzer {
  /**
   * Calculate confluence score from multiple timeframe predictions
   * Higher agreement = higher confidence
   */
  static calculate(predictions: TimeframePrediction[]): ConfluenceResult {
    const actionCounts: Record<string, number> = { BUY: 0, SELL: 0, HOLD: 0 };
    let totalConfidence = 0;

    // Count actions and sum confidence
    for (const pred of predictions) {
      actionCounts[pred.action]++;
      totalConfidence += pred.confidence;
    }

    // Find dominant action
    const dominantAction = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])[0][0] as 'BUY' | 'SELL' | 'HOLD';

    // Calculate agreement percentage
    const agreementPercent = (actionCounts[dominantAction] / predictions.length) * 100;
    
    // Calculate average confidence
    const avgConfidence = totalConfidence / predictions.length;
    
    // Final confluence score (0-1)
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
   * Check if consensus is valid based on minimum threshold
   */
  static isConsensusValid(confluence: ConfluenceResult, minConsensus: number = 0.6): boolean {
    return confluence.score >= minConsensus;
  }

  /**
   * Get consensus strength label
   */
  static getConsensusStrength(agreementPercent: number): string {
    if (agreementPercent >= 75) return 'Strong';
    if (agreementPercent >= 50) return 'Moderate';
    return 'Weak';
  }

  /**
   * Calculate timeframe weight (higher timeframes = more weight)
   */
  static calculateWeightedScore(predictions: TimeframePrediction[]): number {
    const weights: Record<string, number> = {
      '1m': 1,
      '5m': 2,
      '15m': 3,
      '1h': 4
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const pred of predictions) {
      const weight = weights[pred.timeframe] || 1;
      weightedSum += pred.score * weight;
      totalWeight += weight;
    }

    return weightedSum / totalWeight;
  }
}
