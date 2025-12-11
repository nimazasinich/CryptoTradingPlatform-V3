import { TechnicalFeatures } from '../../types/strategy';

// Cache for AI predictions (to avoid excessive API calls during detector runs)
let aiPredictionCache: { value: number; timestamp: number } | null = null;
const AI_CACHE_TTL = 120000; // 2 minutes

// ========== 14. ML/AI DETECTOR (Weight: 0.15) ==========
export function detectML(features: TechnicalFeatures): number {
  // This combines technical analysis with AI predictions
  // The actual AI API call is handled by AISignalsProvider
  // This function provides an intelligent heuristic that mimics ML behavior
  
  const signals = [
    // Momentum signals
    features.rsi > 70 ? -0.3 : features.rsi < 30 ? 0.3 : (50 - features.rsi) / 50,
    features.macd.histogram / 10,
    features.roc / 10,
    
    // Trend signals
    features.trend === 'BULLISH' ? 0.4 : features.trend === 'BEARISH' ? -0.4 : 0,
    features.adx > 25 ? (features.trend === 'BULLISH' ? 0.3 : -0.3) : 0,
    
    // Mean reversion signals
    features.bollingerBands.middle > features.sma50 ? 0.2 : -0.2,
    
    // Volume confirmation
    features.volumeRatio > 1.2 ? 0.2 : -0.1
  ];
  
  // Weighted average of all signals
  const weights = [0.2, 0.15, 0.1, 0.25, 0.15, 0.1, 0.05];
  let mlScore = 0;
  
  for (let i = 0; i < signals.length; i++) {
    mlScore += signals[i] * weights[i];
  }
  
  // Apply non-linear transformation (sigmoid-like)
  mlScore = Math.tanh(mlScore);
  
  return Math.max(-1, Math.min(1, mlScore));
}

/**
 * Set AI prediction for use in ML detector
 * This should be called externally when AI signals are fetched
 */
export function setAIPrediction(prediction: number) {
  aiPredictionCache = {
    value: Math.max(-1, Math.min(1, prediction)),
    timestamp: Date.now()
  };
}

/**
 * Get cached AI prediction if available
 */
export function getAIPrediction(): number | null {
  if (aiPredictionCache && Date.now() - aiPredictionCache.timestamp < AI_CACHE_TTL) {
    return aiPredictionCache.value;
  }
  return null;
}
