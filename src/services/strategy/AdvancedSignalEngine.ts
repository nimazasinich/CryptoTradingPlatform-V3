import { Candle, AdvancedSignal, SignalType, TechnicalFeatures } from '../../types/strategy';
import { FeatureExtractor } from './FeatureExtractor';

export class AdvancedSignalEngine {
  private featureExtractor: FeatureExtractor;
  private cooldowns: Map<string, number> = new Map();
  
  constructor() {
    this.featureExtractor = new FeatureExtractor();
  }
  
  async generateSignal(
    symbol: string,
    candles: Candle[]
  ): Promise<AdvancedSignal | null> {
    // Check cooldown (4 hours = 16 x 15min candles)
    const cooldownUntil = this.cooldowns.get(symbol);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      return null;
    }
    
    // Validate minimum data
    if (candles.length < 50) return null;
    
    // Extract features
    const features = this.featureExtractor.extract(candles);
    
    // Score each layer
    const layer1 = this.scoreLayer1_PriceAction(features, candles);
    const layer2 = this.scoreLayer2_Indicators(features);
    const layer3 = this.scoreLayer3_Timeframes(features);
    const layer4 = this.scoreLayer4_Volume(features);
    const layer5 = this.scoreLayer5_RiskManagement(features, candles);
    
    const totalScore = layer1 + layer2 + layer3 + layer4 + layer5;
    
    // Threshold: 75 points minimum
    if (totalScore < 75) return null;
    
    // Determine direction (requires 2/3 directional layers to agree)
    const direction = this.determineDirection(features, layer1, layer2, layer3);
    if (!direction || direction === 'HOLD') return null;
    
    // Calculate entry plan
    const currentPrice = candles[candles.length - 1].close;
    const atr = features.atr;
    
    const { stopLoss, takeProfits, riskRewardRatio } = this.calculateEntryPlan(
      currentPrice,
      atr,
      direction
    );
    
    // Risk-reward minimum: 3:1
    if (riskRewardRatio < 3) return null;
    
    // Activate cooldown (4 hours)
    this.cooldowns.set(symbol, Date.now() + (4 * 60 * 60 * 1000));
    
    // Build signal
    return {
      id: `adv-${symbol}-${Date.now()}`,
      symbol,
      type: direction,
      entry_price: currentPrice,
      stop_loss: stopLoss,
      target_price: takeProfits[0],
      takeProfit1: takeProfits[0],
      takeProfit2: takeProfits[1],
      takeProfit3: takeProfits[2],
      riskRewardRatio,
      confidence: this.calculateConfidence(totalScore, features),
      reasoning: this.buildReasoning(layer1, layer2, layer3, layer4, layer5, features),
      timestamp: new Date().toISOString(),
      timeframe: '1h',
      contributingFactors: this.identifyContributingFactors(features),
      score: {
        layer1_priceAction: layer1,
        layer2_indicators: layer2,
        layer3_timeframes: layer3,
        layer4_volume: layer4,
        layer5_riskManagement: layer5,
        totalScore,
        isValid: true
      }
    };
  }
  
  // ========== LAYER 1: PRICE ACTION (0-30 points) ==========
  private scoreLayer1_PriceAction(features: TechnicalFeatures, candles: Candle[]): number {
    let score = 0;
    
    // Trend structure (0-15 points)
    if (features.higherHighs && features.higherLows) {
      score += 15; // Strong bullish structure
    } else if (features.lowerHighs && features.lowerLows) {
      score += 15; // Strong bearish structure
    } else if (features.higherHighs || features.higherLows) {
      score += 8; // Partial bullish structure
    } else if (features.lowerHighs || features.lowerLows) {
      score += 8; // Partial bearish structure
    } else {
      score += 3; // Choppy/ranging
    }
    
    // Candlestick patterns (0-10 points)
    const lastCandles = candles.slice(-3);
    if (this.detectEngulfingPattern(lastCandles)) score += 10;
    else if (this.detectHammerPattern(lastCandles)) score += 8;
    else if (this.detectDojiPattern(lastCandles)) score += 5;
    
    // Support/Resistance proximity (0-5 points)
    const currentPrice = candles[candles.length - 1].close;
    const distanceToSupport = Math.abs(currentPrice - features.support) / currentPrice;
    const distanceToResistance = Math.abs(currentPrice - features.resistance) / currentPrice;
    
    if (distanceToSupport < 0.02 || distanceToResistance < 0.02) {
      score += 5; // Near key level
    } else if (distanceToSupport < 0.05 || distanceToResistance < 0.05) {
      score += 3; // Approaching key level
    }
    
    return Math.min(30, score);
  }
  
  // ========== LAYER 2: INDICATORS (0-25 points) ==========
  private scoreLayer2_Indicators(features: TechnicalFeatures): number {
    let score = 0;
    
    // RSI (0-7 points)
    if (features.rsi < 30) score += 7;
    else if (features.rsi > 70) score += 7;
    else if (features.rsi < 40 || features.rsi > 60) score += 4;
    
    // MACD (0-7 points)
    const macdStrength = Math.abs(features.macd.histogram);
    if (macdStrength > 5) score += 7;
    else if (macdStrength > 2) score += 4;
    
    // Moving Averages (0-6 points)
    const currentPrice = features.sma20;
    if (currentPrice > features.sma20 && features.sma20 > features.sma50) score += 6;
    else if (currentPrice < features.sma20 && features.sma20 < features.sma50) score += 6;
    else if (currentPrice > features.sma20 || features.sma20 > features.sma50) score += 3;
    
    // Bollinger Bands (0-5 points)
    const bbWidth = features.bollingerBands.upper - features.bollingerBands.lower;
    const position = (currentPrice - features.bollingerBands.lower) / bbWidth;
    if (position < 0.1 || position > 0.9) score += 5;
    else if (position < 0.2 || position > 0.8) score += 3;
    
    return Math.min(25, score);
  }
  
  // ========== LAYER 3: TIMEFRAMES (0-20 points) ==========
  private scoreLayer3_Timeframes(features: TechnicalFeatures): number {
    let score = 0;
    
    // Trend alignment (0-10 points)
    if (features.trend === 'BULLISH' || features.trend === 'BEARISH') {
      score += 10; // Clear trend
    } else {
      score += 5; // Neutral trend
    }
    
    // ADX strength (0-10 points)
    if (features.adx > 40) score += 10;
    else if (features.adx > 25) score += 7;
    else if (features.adx > 20) score += 4;
    
    return Math.min(20, score);
  }
  
  // ========== LAYER 4: VOLUME (0-15 points) ==========
  private scoreLayer4_Volume(features: TechnicalFeatures): number {
    let score = 0;
    
    // Volume ratio (0-10 points)
    if (features.volumeRatio > 2.0) score += 10;
    else if (features.volumeRatio > 1.5) score += 7;
    else if (features.volumeRatio > 1.2) score += 5;
    else if (features.volumeRatio < 0.8) score += 2; // Low volume = weak signal
    
    // Volume trend consistency (0-5 points)
    if (features.volumeRatio > 1.0) score += 5;
    else score += 2;
    
    return Math.min(15, score);
  }
  
  // ========== LAYER 5: RISK MANAGEMENT (0-10 points) ==========
  private scoreLayer5_RiskManagement(features: TechnicalFeatures, candles: Candle[]): number {
    let score = 0;
    
    // ATR for stop loss calculation (0-5 points)
    if (features.atr > 0) score += 5;
    
    // Risk-reward potential (0-5 points)
    const currentPrice = candles[candles.length - 1].close;
    const distanceToSupport = Math.abs(currentPrice - features.support) / currentPrice;
    const distanceToResistance = Math.abs(currentPrice - features.resistance) / currentPrice;
    
    const potentialRR = distanceToResistance / distanceToSupport;
    if (potentialRR > 3) score += 5;
    else if (potentialRR > 2) score += 3;
    
    return Math.min(10, score);
  }
  
  // ========== HELPER METHODS ==========
  
  private determineDirection(
    features: TechnicalFeatures,
    layer1: number,
    layer2: number,
    layer3: number
  ): SignalType {
    const signals: SignalType[] = [];
    
    // Layer 1 vote
    if (features.higherHighs && features.higherLows && layer1 > 20) signals.push('BUY');
    else if (features.lowerHighs && features.lowerLows && layer1 > 20) signals.push('SELL');
    
    // Layer 2 vote
    if (features.rsi < 35 && features.macd.histogram > 0 && layer2 > 15) signals.push('BUY');
    else if (features.rsi > 65 && features.macd.histogram < 0 && layer2 > 15) signals.push('SELL');
    
    // Layer 3 vote
    if (features.trend === 'BULLISH' && features.adx > 25 && layer3 > 12) signals.push('BUY');
    else if (features.trend === 'BEARISH' && features.adx > 25 && layer3 > 12) signals.push('SELL');
    
    // Require 2/3 agreement
    const buyVotes = signals.filter(s => s === 'BUY').length;
    const sellVotes = signals.filter(s => s === 'SELL').length;
    
    if (buyVotes >= 2) return 'BUY';
    if (sellVotes >= 2) return 'SELL';
    
    return 'HOLD';
  }
  
  private calculateEntryPlan(
    currentPrice: number,
    atr: number,
    direction: SignalType
  ): { stopLoss: number; takeProfits: [number, number, number]; riskRewardRatio: number } {
    const atrMultiplier = 1.2;
    
    let stopLoss: number;
    let takeProfits: [number, number, number];
    
    if (direction === 'BUY') {
      stopLoss = currentPrice - (atr * atrMultiplier);
      const risk = currentPrice - stopLoss;
      takeProfits = [
        currentPrice + (risk * 2), // TP1: 2R
        currentPrice + (risk * 3.5), // TP2: 3.5R
        currentPrice + (risk * 5)  // TP3: 5R
      ];
    } else { // SELL
      stopLoss = currentPrice + (atr * atrMultiplier);
      const risk = stopLoss - currentPrice;
      takeProfits = [
        currentPrice - (risk * 2),
        currentPrice - (risk * 3.5),
        currentPrice - (risk * 5)
      ];
    }
    
    const risk = Math.abs(currentPrice - stopLoss);
    const reward = Math.abs(takeProfits[0] - currentPrice);
    const riskRewardRatio = reward / risk;
    
    return { stopLoss, takeProfits, riskRewardRatio };
  }
  
  private calculateConfidence(totalScore: number, features: TechnicalFeatures): number {
    // Base confidence from score (75-100 => 0.75-1.0)
    let confidence = Math.min(1.0, totalScore / 100);
    
    // Boost for strong trend
    if (features.adx > 30) confidence *= 1.1;
    
    // Boost for high volume
    if (features.volumeRatio > 1.5) confidence *= 1.05;
    
    return Math.min(1.0, confidence);
  }
  
  private buildReasoning(
    layer1: number,
    layer2: number,
    layer3: number,
    layer4: number,
    layer5: number,
    features: TechnicalFeatures
  ): string {
    const reasons: string[] = [];
    
    if (layer1 >= 20) reasons.push(`Strong price action (${layer1}/30)`);
    if (layer2 >= 15) reasons.push(`Favorable indicators (${layer2}/25)`);
    if (layer3 >= 12) reasons.push(`Multi-timeframe alignment (${layer3}/20)`);
    if (layer4 >= 10) reasons.push(`High volume confirmation (${layer4}/15)`);
    if (layer5 >= 7) reasons.push(`Good risk-reward setup (${layer5}/10)`);
    
    if (features.trend !== 'NEUTRAL') reasons.push(`${features.trend} trend`);
    if (features.adx > 25) reasons.push(`Strong trend (ADX: ${features.adx.toFixed(1)})`);
    
    return reasons.join(', ');
  }
  
  private identifyContributingFactors(features: TechnicalFeatures): string[] {
    const factors: string[] = [];
    
    if (features.rsi < 30 || features.rsi > 70) factors.push('RSI extremes');
    if (Math.abs(features.macd.histogram) > 3) factors.push('Strong MACD signal');
    if (features.adx > 30) factors.push('High ADX trend strength');
    if (features.volumeRatio > 1.5) factors.push('Volume surge');
    if (features.trend !== 'NEUTRAL') factors.push(`${features.trend} trend`);
    
    return factors;
  }
  
  private detectEngulfingPattern(candles: Candle[]): boolean {
    if (candles.length < 2) return false;
    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];
    
    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(curr.close - curr.open);
    
    // Bullish engulfing
    if (prev.close < prev.open && curr.close > curr.open && currBody > prevBody * 1.5) {
      return true;
    }
    
    // Bearish engulfing
    if (prev.close > prev.open && curr.close < curr.open && currBody > prevBody * 1.5) {
      return true;
    }
    
    return false;
  }
  
  private detectHammerPattern(candles: Candle[]): boolean {
    if (candles.length < 1) return false;
    const candle = candles[candles.length - 1];
    
    const body = Math.abs(candle.close - candle.open);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    
    return lowerWick > body * 2 && upperWick < body * 0.5;
  }
  
  private detectDojiPattern(candles: Candle[]): boolean {
    if (candles.length < 1) return false;
    const candle = candles[candles.length - 1];
    
    const body = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    
    return body < totalRange * 0.1;
  }
}
