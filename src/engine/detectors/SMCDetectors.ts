import { TechnicalFeatures } from '../../types/strategy';

// ========== 8. MARKET STRUCTURE DETECTOR (Weight: 0.05) ==========
export function detectMarketStructure(features: TechnicalFeatures): number {
  const { higherHighs, higherLows, lowerHighs, lowerLows } = features;
  
  // Higher Highs + Higher Lows = Bullish structure
  if (higherHighs && higherLows) return 0.8;
  
  // Lower Highs + Lower Lows = Bearish structure
  if (lowerHighs && lowerLows) return -0.8;
  
  // Mixed structure = choppy/consolidation
  if (higherHighs && lowerLows) return 0;
  if (lowerHighs && higherLows) return 0;
  
  // Partial structure
  if (higherHighs || higherLows) return 0.4;
  if (lowerHighs || lowerLows) return -0.4;
  
  return 0;
}

// ========== 9. SUPPORT/RESISTANCE DETECTOR (Weight: 0.09) ==========
export function detectSupportResistance(features: TechnicalFeatures): number {
  const { support, resistance } = features;
  
  // Get current price from SMA20 as proxy
  const currentPrice = features.sma20;
  
  // Calculate distance from support and resistance
  const distanceFromSupport = (currentPrice - support) / support;
  const distanceFromResistance = (resistance - currentPrice) / currentPrice;
  
  // Near support (within 2%) - bullish bounce expected
  if (distanceFromSupport < 0.02) return 0.7;
  
  // Near resistance (within 2%) - bearish rejection expected
  if (distanceFromResistance < 0.02) return -0.7;
  
  // Position between support and resistance
  const range = resistance - support;
  const position = (currentPrice - support) / range;
  
  // Closer to support = more bullish potential
  // Closer to resistance = more bearish potential
  return (0.5 - position) * 1.5;
}
