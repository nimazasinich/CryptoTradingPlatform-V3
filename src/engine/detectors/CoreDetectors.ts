import { TechnicalFeatures } from '../../types/strategy';

// ========== 1. RSI DETECTOR (Weight: 0.09) ==========
export function detectRSI(features: TechnicalFeatures): number {
  const rsi = features.rsi;
  
  // Oversold zone (<30) - bullish signal
  if (rsi < 30) {
    return 1 - (rsi / 30); // Returns 0.33 to 1.0
  }
  
  // Overbought zone (>70) - bearish signal
  if (rsi > 70) {
    return -(rsi - 70) / 30; // Returns -0.33 to -1.0
  }
  
  // Neutral zone (30-70) - normalize to [-1, +1]
  return (rsi - 50) / 20;
}

// ========== 2. MACD DETECTOR (Weight: 0.09) ==========
export function detectMACD(features: TechnicalFeatures): number {
  const { value, signal, histogram } = features.macd;
  
  // Normalize histogram (typical range: -5 to +5)
  const normalizedHistogram = Math.max(-1, Math.min(1, histogram / 10));
  
  // Check crossover
  const bullishCross = value > signal && histogram > 0;
  const bearishCross = value < signal && histogram < 0;
  
  let score = normalizedHistogram;
  
  // Boost signal on crossover
  if (bullishCross) score = Math.max(score, 0.5);
  if (bearishCross) score = Math.min(score, -0.5);
  
  return Math.max(-1, Math.min(1, score));
}

// ========== 3. MA CROSS DETECTOR (Weight: 0.09) ==========
export function detectMACross(features: TechnicalFeatures): number {
  const { sma20, sma50, ema12, ema26 } = features;
  
  let score = 0;
  
  // SMA cross
  const smaGap = (sma20 - sma50) / sma50;
  score += Math.max(-0.5, Math.min(0.5, smaGap * 10));
  
  // EMA cross
  const emaGap = (ema12 - ema26) / ema26;
  score += Math.max(-0.5, Math.min(0.5, emaGap * 10));
  
  return Math.max(-1, Math.min(1, score));
}

// ========== 4. BOLLINGER BANDS DETECTOR (Weight: 0.09) ==========
export function detectBollinger(features: TechnicalFeatures): number {
  const { bollingerBands } = features;
  const currentPrice = bollingerBands.middle; // Using middle as proxy for current
  
  const upperDist = bollingerBands.upper - currentPrice;
  const lowerDist = currentPrice - bollingerBands.lower;
  const bandWidth = bollingerBands.upper - bollingerBands.lower;
  
  // Position within bands (0 = lower band, 1 = upper band)
  const position = lowerDist / bandWidth;
  
  // Near lower band (oversold) - bullish
  if (position < 0.2) return 0.8;
  
  // Near upper band (overbought) - bearish
  if (position > 0.8) return -0.8;
  
  // Normalize to [-1, +1] based on position
  return (position - 0.5) * 2;
}

// ========== 5. VOLUME DETECTOR (Weight: 0.07) ==========
export function detectVolume(features: TechnicalFeatures): number {
  const { volume, avgVolume, volumeRatio } = features;
  
  // High volume relative to average suggests strong trend
  if (volumeRatio > 1.5) {
    // Need price direction to determine signal
    // For now, use trend as proxy
    return features.trend === 'BULLISH' ? 0.7 : features.trend === 'BEARISH' ? -0.7 : 0;
  }
  
  if (volumeRatio < 0.5) {
    // Low volume suggests weak trend/consolidation
    return 0;
  }
  
  // Normal volume
  return (volumeRatio - 1) * 0.5;
}

// ========== 6. ADX DETECTOR (Weight: 0.09) ==========
export function detectADX(features: TechnicalFeatures): number {
  const adx = features.adx;
  
  // ADX measures trend strength (not direction)
  // High ADX + trend direction = strong signal
  
  if (adx < 20) {
    // Weak trend - neutral
    return 0;
  }
  
  if (adx > 40) {
    // Strong trend - amplify trend direction
    if (features.trend === 'BULLISH') return 0.8;
    if (features.trend === 'BEARISH') return -0.8;
  }
  
  // Moderate trend (20-40)
  const strength = (adx - 20) / 20; // 0 to 1
  if (features.trend === 'BULLISH') return strength * 0.6;
  if (features.trend === 'BEARISH') return -strength * 0.6;
  
  return 0;
}

// ========== 7. ROC DETECTOR (Weight: 0.05) ==========
export function detectROC(features: TechnicalFeatures): number {
  const roc = features.roc;
  
  // ROC (Rate of Change) in percentage
  // Normalize to [-1, +1] range
  
  // Strong positive momentum
  if (roc > 5) return 0.8;
  
  // Strong negative momentum
  if (roc < -5) return -0.8;
  
  // Normal range: normalize -5 to +5 => -1 to +1
  return Math.max(-1, Math.min(1, roc / 5));
}
