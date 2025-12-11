import { TechnicalFeatures } from '../../types/strategy';

// ========== 10. REVERSAL DETECTOR (Weight: 0.08) ==========
export function detectReversal(features: TechnicalFeatures): number {
  let score = 0;
  
  // 1. Bollinger Band re-entry (±0.3)
  const { bollingerBands } = features;
  const currentPrice = bollingerBands.middle;
  const bandWidth = bollingerBands.upper - bollingerBands.lower;
  const lowerDist = currentPrice - bollingerBands.lower;
  const position = lowerDist / bandWidth;
  
  if (position < 0.1) {
    // Near lower band - bullish reversal signal
    score += 0.3;
  } else if (position > 0.9) {
    // Near upper band - bearish reversal signal
    score -= 0.3;
  }
  
  // 2. RSI oversold/overbought (±0.3)
  const rsi = features.rsi;
  if (rsi < 30) {
    // Oversold - bullish reversal
    score += 0.3 * (1 - rsi / 30);
  } else if (rsi > 70) {
    // Overbought - bearish reversal
    score -= 0.3 * ((rsi - 70) / 30);
  }
  
  // 3. Stochastic reversal (±0.2)
  const { stochastic } = features;
  if (stochastic.k < 20 && stochastic.k > stochastic.d) {
    // Oversold with bullish crossover
    score += 0.2;
  } else if (stochastic.k > 80 && stochastic.k < stochastic.d) {
    // Overbought with bearish crossover
    score -= 0.2;
  }
  
  // 4. MACD divergence potential (±0.2)
  const { macd } = features;
  if (macd.histogram > 0 && macd.histogram > macd.value * 0.1) {
    // Positive histogram growing - bullish
    score += 0.2;
  } else if (macd.histogram < 0 && Math.abs(macd.histogram) > Math.abs(macd.value) * 0.1) {
    // Negative histogram growing - bearish
    score -= 0.2;
  }
  
  // Clamp to [-1, +1]
  return Math.max(-1, Math.min(1, score));
}
