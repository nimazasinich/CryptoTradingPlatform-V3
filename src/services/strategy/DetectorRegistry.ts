import { DetectorWeights, TechnicalFeatures } from '../../types/strategy';
import * as CoreDetectors from '../../engine/detectors/CoreDetectors';
import * as SMCDetectors from '../../engine/detectors/SMCDetectors';
import * as PatternDetectors from '../../engine/detectors/PatternDetectors';
import * as SentimentDetectors from '../../engine/detectors/SentimentDetectors';
import * as MLDetector from '../../engine/detectors/MLDetector';

export interface DetectorDefinition {
  name: string;
  weight: number;
  category: 'CORE' | 'SMC' | 'PATTERNS' | 'SENTIMENT' | 'ML';
  fn: (features: TechnicalFeatures) => number;
  description: string;
}

export class DetectorRegistry {
  private detectors: DetectorDefinition[] = [];
  
  constructor(weights: DetectorWeights) {
    this.registerDetectors(weights);
  }
  
  private registerDetectors(weights: DetectorWeights) {
    this.detectors = [
      // CORE DETECTORS (40%)
      {
        name: 'RSI',
        weight: weights.rsi,
        category: 'CORE',
        fn: CoreDetectors.detectRSI,
        description: 'Relative Strength Index - oversold/overbought detection'
      },
      {
        name: 'MACD',
        weight: weights.macd,
        category: 'CORE',
        fn: CoreDetectors.detectMACD,
        description: 'Moving Average Convergence Divergence - momentum indicator'
      },
      {
        name: 'MA Cross',
        weight: weights.maCross,
        category: 'CORE',
        fn: CoreDetectors.detectMACross,
        description: 'Moving Average Crossover - trend identification'
      },
      {
        name: 'Bollinger Bands',
        weight: weights.bollinger,
        category: 'CORE',
        fn: CoreDetectors.detectBollinger,
        description: 'Bollinger Bands - volatility and overbought/oversold'
      },
      {
        name: 'Volume',
        weight: weights.volume,
        category: 'CORE',
        fn: CoreDetectors.detectVolume,
        description: 'Volume Analysis - trend confirmation'
      },
      {
        name: 'ADX',
        weight: weights.adx,
        category: 'CORE',
        fn: CoreDetectors.detectADX,
        description: 'Average Directional Index - trend strength'
      },
      {
        name: 'ROC',
        weight: weights.roc,
        category: 'CORE',
        fn: CoreDetectors.detectROC,
        description: 'Rate of Change - momentum measurement'
      },
      
      // SMC DETECTORS (25%)
      {
        name: 'Market Structure',
        weight: weights.marketStructure,
        category: 'SMC',
        fn: SMCDetectors.detectMarketStructure,
        description: 'Smart Money Concepts - market structure analysis'
      },
      {
        name: 'Support/Resistance',
        weight: weights.supportResistance,
        category: 'SMC',
        fn: SMCDetectors.detectSupportResistance,
        description: 'Key price levels - support and resistance zones'
      },
      
      // PATTERN DETECTORS (20%)
      {
        name: 'Reversal Patterns',
        weight: weights.reversal,
        category: 'PATTERNS',
        fn: PatternDetectors.detectReversal,
        description: 'Reversal pattern detection - trend changes'
      },
      
      // SENTIMENT DETECTORS (10%)
      {
        name: 'Market Sentiment',
        weight: weights.sentiment,
        category: 'SENTIMENT',
        fn: SentimentDetectors.detectSentiment,
        description: 'Fear & Greed Index - market psychology'
      },
      {
        name: 'News Sentiment',
        weight: weights.news,
        category: 'SENTIMENT',
        fn: SentimentDetectors.detectNews,
        description: 'News sentiment analysis - market events'
      },
      {
        name: 'Whale Activity',
        weight: weights.whales,
        category: 'SENTIMENT',
        fn: SentimentDetectors.detectWhales,
        description: 'Large transaction tracking - whale movements'
      },
      
      // ML DETECTOR (5%)
      {
        name: 'ML Prediction',
        weight: weights.mlPrediction,
        category: 'ML',
        fn: MLDetector.detectML,
        description: 'Machine Learning model - AI-based prediction'
      }
    ];
  }
  
  getAll(): DetectorDefinition[] {
    return this.detectors;
  }
  
  getByCategory(category: 'CORE' | 'SMC' | 'PATTERNS' | 'SENTIMENT' | 'ML'): DetectorDefinition[] {
    return this.detectors.filter(d => d.category === category);
  }
  
  getByName(name: string): DetectorDefinition | undefined {
    return this.detectors.find(d => d.name === name);
  }
  
  getTotalWeight(): number {
    return this.detectors.reduce((sum, d) => sum + d.weight, 0);
  }
}
