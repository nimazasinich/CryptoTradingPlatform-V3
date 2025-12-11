import {
  Candle,
  Timeframe,
  TimeframeResult,
  StrategyOutput,
  SignalType,
  TrendDirection,
  ConfluenceScore,
  EntryPlan,
  MarketContext,
  DetectorResult,
  DetectorWeights
} from '../../types/strategy';
import { FeatureExtractor } from './FeatureExtractor';
import { DetectorRegistry } from './DetectorRegistry';
import { ScoreAggregator } from '../../engine/ScoreAggregator';
import { sentimentDataProvider } from './SentimentDataProvider';

export class StrategyEngine {
  private detectorRegistry: DetectorRegistry;
  private featureExtractor: FeatureExtractor;
  private scoreAggregator: ScoreAggregator;
  
  constructor(weights: DetectorWeights) {
    this.detectorRegistry = new DetectorRegistry(weights);
    this.featureExtractor = new FeatureExtractor();
    this.scoreAggregator = new ScoreAggregator();
  }
  
  async analyzeMultiTimeframe(
    symbol: string,
    candles15m: Candle[],
    candles1h: Candle[],
    candles4h: Candle[]
  ): Promise<StrategyOutput> {
    // Analyze each timeframe independently
    const tf15m = await this.analyzeTimeframe('15m', candles15m);
    const tf1h = await this.analyzeTimeframe('1h', candles1h);
    const tf4h = await this.analyzeTimeframe('4h', candles4h);
    
    const results = [tf15m, tf1h, tf4h];
    
    // Multi-timeframe decision making
    const mtfDecision = this.makeMTFDecision(results);
    
    // Calculate confluence
    const confluence = this.calculateConfluence(results, mtfDecision.direction);
    
    // Apply context gating
    const context = await this.getMarketContext(symbol);
    const gatedAction = this.applyContextGating(mtfDecision.action, context, confluence);
    
    // Build entry plan
    const entryPlan = this.buildEntryPlan(candles1h, gatedAction, context);
    
    return {
      symbol,
      results,
      direction: mtfDecision.direction,
      final_score: mtfDecision.score,
      action: gatedAction,
      rationale: this.buildRationale(mtfDecision, confluence, context, results),
      confluence,
      entryPlan,
      context,
      timestamp: Date.now()
    };
  }
  
  private async analyzeTimeframe(
    timeframe: Timeframe,
    candles: Candle[]
  ): Promise<TimeframeResult> {
    if (candles.length < 50) {
      throw new Error(`Insufficient data for ${timeframe} analysis`);
    }
    
    // Extract features
    const features = this.featureExtractor.extract(candles);
    
    // Run all detectors
    const detectorResults: DetectorResult[] = [];
    const allDetectors = this.detectorRegistry.getAll();
    
    for (const detector of allDetectors) {
      try {
        const score = detector.fn(features);
        detectorResults.push({
          name: detector.name,
          score: Math.max(-1, Math.min(1, score)), // Clamp to [-1, +1]
          weight: detector.weight,
          category: detector.category,
          description: detector.description
        });
      } catch (error) {
        console.error(`Detector ${detector.name} failed on ${timeframe}:`, error);
        // Graceful degradation: neutral score
        detectorResults.push({
          name: detector.name,
          score: 0,
          weight: detector.weight,
          category: detector.category,
          description: detector.description
        });
      }
    }
    
    // Aggregate scores
    const aggregated = this.scoreAggregator.aggregate(detectorResults);
    
    // Calculate weighted score: Σ(score × weight) / Σ(weight)
    let signedSum = 0;
    let weightSum = 0;
    
    for (const result of detectorResults) {
      signedSum += result.score * result.weight;
      weightSum += Math.abs(result.weight);
    }
    
    const normalized = weightSum > 0 ? signedSum / weightSum : 0; // [-1, +1]
    const finalScore = (normalized + 1) / 2;   // [0, 1]
    
    return {
      timeframe,
      score: finalScore,
      direction: aggregated.direction,
      detectors: detectorResults,
      normalized
    };
  }
  
  private makeMTFDecision(results: TimeframeResult[]): {
    direction: TrendDirection;
    action: SignalType;
    score: number;
  } {
    // Count votes
    let bullishVotes = 0;
    let bearishVotes = 0;
    
    for (const tf of results) {
      if (tf.direction === 'BULLISH') bullishVotes++;
      if (tf.direction === 'BEARISH') bearishVotes++;
    }
    
    const majorityDir = bullishVotes > bearishVotes ? 'BULLISH' :
                        bearishVotes > bullishVotes ? 'BEARISH' : 'NEUTRAL';
    
    // Check thresholds
    const anyHighScore = results.some(tf => tf.score >= 0.65);
    const anyLowScore = results.some(tf => tf.score <= 0.35);
    const majorityMet = majorityDir === 'BULLISH' 
      ? results.filter(tf => tf.score >= 0.60).length >= 2
      : results.filter(tf => tf.score <= 0.40).length >= 2;
    
    // Determine action
    let action: SignalType = 'HOLD';
    
    if (majorityDir === 'BULLISH' && (anyHighScore || majorityMet)) {
      action = 'BUY';
    } else if (majorityDir === 'BEARISH' && (anyLowScore || majorityMet)) {
      action = 'SELL';
    }
    
    // Average score
    const avgScore = results.reduce((sum, tf) => sum + tf.score, 0) / results.length;
    
    return {
      direction: majorityDir,
      action,
      score: avgScore
    };
  }
  
  private calculateConfluence(
    results: TimeframeResult[],
    direction: TrendDirection
  ): ConfluenceScore {
    // Agreement: fraction of timeframes matching direction
    let agreementCount = 0;
    for (const tf of results) {
      if (tf.direction === direction) agreementCount++;
    }
    const agreement = agreementCount / results.length;
    
    // Calculate AI, Tech, Context contributions
    const aiScores: number[] = [];
    const techScores: number[] = [];
    const contextScores: number[] = [];
    
    for (const tf of results) {
      for (const detector of tf.detectors) {
        if (detector.category === 'ML') aiScores.push(detector.score);
        if (['CORE', 'SMC', 'PATTERNS'].includes(detector.category)) {
          techScores.push(detector.score);
        }
        if (detector.category === 'SENTIMENT') contextScores.push(detector.score);
      }
    }
    
    const ai = aiScores.length > 0 
      ? (aiScores.reduce((a, b) => a + b, 0) / aiScores.length + 1) / 2
      : 0.5;
    const tech = techScores.length > 0 
      ? (techScores.reduce((a, b) => a + b, 0) / techScores.length + 1) / 2
      : 0.5;
    const context = contextScores.length > 0 
      ? (contextScores.reduce((a, b) => a + b, 0) / contextScores.length + 1) / 2
      : 0.5;
    
    // Confluence formula: agreement × (ai×0.5 + tech×0.35 + context×0.15)
    const score = agreement * (ai * 0.5 + tech * 0.35 + context * 0.15);
    
    // Threshold: 0.60 (configurable)
    const threshold = 0.60;
    const passed = score >= threshold;
    
    return {
      enabled: true,
      score,
      agreement,
      ai,
      tech,
      context,
      passed
    };
  }
  
  private async getMarketContext(symbol: string): Promise<MarketContext> {
    // Fetch real market context from sentiment data provider
    try {
      const baseSymbol = symbol.split('/')[0]; // Extract base symbol (e.g., 'BTC' from 'BTC/USDT')
      const context = await sentimentDataProvider.getMarketContext(baseSymbol);
      
      console.log(`📊 Market context for ${baseSymbol}:`, {
        sentiment: context.sentiment01.toFixed(2),
        news: context.news01.toFixed(2),
        whales: context.whales01.toFixed(2)
      });
      
      return context;
    } catch (error) {
      console.error('❌ Error fetching market context:', error);
      // Return neutral values on error
      return {
        sentiment01: 0,
        news01: 0,
        whales01: 0
      };
    }
  }
  
  private applyContextGating(
    action: SignalType,
    context: MarketContext,
    confluence: ConfluenceScore
  ): SignalType {
    // Bad News Hold: news < -0.35 AND sentiment < -0.25
    if (context.news01 < -0.35 && context.sentiment01 < -0.25) {
      return 'HOLD';
    }
    
    // Confluence requirement
    if (!confluence.passed) {
      return 'HOLD';
    }
    
    return action;
  }
  
  private buildEntryPlan(
    candles: Candle[],
    action: SignalType,
    context: MarketContext
  ): EntryPlan {
    if (candles.length < 50) {
      // Return default plan
      return {
        mode: 'ATR',
        sl: 0,
        tp: [0, 0, 0],
        ladder: [0.4, 0.35, 0.25],
        trailing: { enabled: false, startAt: 'TP1', distance: 0 },
        leverage: 1
      };
    }
    
    const currentPrice = candles[candles.length - 1].close;
    const features = this.featureExtractor.extract(candles);
    const atr = features.atr;
    
    // ATR-based stop loss
    const atrMultiplier = 1.2;
    let sl: number;
    let tp: [number, number, number];
    
    if (action === 'BUY') {
      sl = currentPrice - (atr * atrMultiplier);
      const risk = currentPrice - sl;
      tp = [
        currentPrice + (risk * 2), // TP1: 2R
        currentPrice + (risk * 3), // TP2: 3R
        currentPrice + (risk * 4)  // TP3: 4R
      ];
    } else if (action === 'SELL') {
      sl = currentPrice + (atr * atrMultiplier);
      const risk = sl - currentPrice;
      tp = [
        currentPrice - (risk * 2), // TP1: 2R
        currentPrice - (risk * 3), // TP2: 3R
        currentPrice - (risk * 4)  // TP3: 4R
      ];
    } else {
      // HOLD - no entry plan
      sl = currentPrice;
      tp = [currentPrice, currentPrice, currentPrice];
    }
    
    // Calculate dynamic leverage
    const leverage = this.calculateLeverage(currentPrice, sl, context);
    
    return {
      mode: 'ATR',
      sl,
      tp,
      ladder: [0.4, 0.35, 0.25], // 40%, 35%, 25%
      trailing: {
        enabled: true,
        startAt: 'TP1',
        distance: atr * 1.0
      },
      leverage
    };
  }
  
  private calculateLeverage(
    currentPrice: number,
    stopLoss: number,
    context: MarketContext
  ): number {
    const slDistance = Math.abs(currentPrice - stopLoss) / currentPrice;
    
    // Base calculation
    const accountRisk = 0.02; // 2% account risk
    let leverage = Math.min(10, Math.max(2, accountRisk / slDistance));
    
    // Apply liquidation buffer (35%)
    leverage = leverage * (1 - 0.35);
    
    // Reduce leverage in bad market conditions
    if (context.sentiment01 < -0.3 || context.news01 < -0.3) {
      leverage *= 0.7;
    }
    
    // Round to 1 decimal
    return Math.round(leverage * 10) / 10;
  }
  
  private buildRationale(
    mtfDecision: { direction: TrendDirection; action: SignalType; score: number },
    confluence: ConfluenceScore,
    context: MarketContext,
    results: TimeframeResult[]
  ): string {
    const parts: string[] = [];
    
    // Decision summary
    parts.push(`${mtfDecision.action} signal with ${(mtfDecision.score * 100).toFixed(0)}% score`);
    
    // Timeframe alignment
    const aligned = results.filter(r => r.direction === mtfDecision.direction).length;
    parts.push(`${aligned}/3 timeframes aligned ${mtfDecision.direction}`);
    
    // Confluence
    if (confluence.passed) {
      parts.push(`Strong confluence (${(confluence.score * 100).toFixed(0)}%)`);
    } else {
      parts.push(`Weak confluence (${(confluence.score * 100).toFixed(0)}%)`);
    }
    
    // Best detector
    const allDetectors = results.flatMap(r => r.detectors);
    const strongest = this.scoreAggregator.getStrongestDetector(allDetectors);
    if (strongest) {
      parts.push(`Led by ${strongest.name}`);
    }
    
    return parts.join('. ');
  }
}
