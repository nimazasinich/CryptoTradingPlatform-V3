import { TechnicalFeatures } from '../../types/strategy';

// Global cache for sentiment data (to avoid excessive API calls)
let sentimentCache: { value: number; timestamp: number } | null = null;
const SENTIMENT_CACHE_TTL = 300000; // 5 minutes

// ========== 11. SENTIMENT DETECTOR (Weight: 0.08) - Fear & Greed ==========
export function detectSentiment(features: TechnicalFeatures): number {
  // Use cached sentiment if available
  // The actual API call is handled by SentimentDataProvider
  // This function provides a technical fallback
  
  const indicators = [
    features.rsi > 70 ? 0.8 : features.rsi < 30 ? -0.8 : (features.rsi - 50) / 25,
    features.stochastic.k > 80 ? 0.7 : features.stochastic.k < 20 ? -0.7 : 0,
    features.trend === 'BULLISH' ? 0.6 : features.trend === 'BEARISH' ? -0.6 : 0
  ];
  
  const avgSentiment = indicators.reduce((a, b) => a + b, 0) / indicators.length;
  
  // Contrarian indicator: extreme greed = sell signal, extreme fear = buy signal
  return -avgSentiment * 0.8; // Inverted and scaled
}

// ========== 12. NEWS DETECTOR (Weight: 0.06) ==========
export function detectNews(features: TechnicalFeatures): number {
  // This would integrate with news sentiment API
  // For now, use volume spike as proxy for news events
  
  const volumeRatio = features.volumeRatio;
  
  if (volumeRatio > 2.0) {
    // Large volume spike - likely news event
    // Use trend to determine sentiment
    if (features.trend === 'BULLISH' && features.rsi < 70) return 0.6;
    if (features.trend === 'BEARISH' && features.rsi > 30) return -0.6;
  }
  
  // Normal news environment
  return 0;
}

// ========== 13. WHALES DETECTOR (Weight: 0.02) ==========
export function detectWhales(features: TechnicalFeatures): number {
  // This would integrate with whale tracking API (large transactions)
  // For now, use volume + price action as proxy
  
  const volumeRatio = features.volumeRatio;
  const roc = features.roc;
  
  // Large volume + strong price movement = potential whale activity
  if (volumeRatio > 2.5 && Math.abs(roc) > 3) {
    // Whale buying
    if (roc > 0) return 0.5;
    // Whale selling
    if (roc < 0) return -0.5;
  }
  
  return 0;
}
