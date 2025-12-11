import { HttpClient } from '../httpClient';
import { API_ENDPOINTS } from '../../config/api';
import { Signal, SignalType } from '../../types/strategy';

/**
 * AI Signals Provider
 * Integrates with the API's AI decision-making endpoints
 */
export class AISignalsProvider {
  private static instance: AISignalsProvider;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache
  
  private constructor() {}
  
  static getInstance(): AISignalsProvider {
    if (!AISignalsProvider.instance) {
      AISignalsProvider.instance = new AISignalsProvider();
    }
    return AISignalsProvider.instance;
  }
  
  /**
   * Get AI trading signals for a symbol
   */
  async getSignals(symbol: string): Promise<any> {
    const cacheKey = `signals-${symbol}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 Using cached AI signals for ${symbol}`);
      return cached.data;
    }
    
    try {
      console.log(`🔄 Fetching AI signals for ${symbol}`);
      
      const baseSymbol = symbol.split('/')[0];
      const response = await HttpClient.get<any>(API_ENDPOINTS.AI_SIGNALS, {
        symbol: baseSymbol
      });
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      console.log(`✅ Fetched AI signals for ${symbol}`);
      return response;
      
    } catch (error) {
      console.error(`❌ Error fetching AI signals for ${symbol}:`, error);
      
      // Return cached if available
      if (cached) {
        return cached.data;
      }
      
      return null;
    }
  }
  
  /**
   * Get AI decision with risk parameters
   * @param symbol Symbol to analyze
   * @param horizon Trading horizon: 'scalp' | 'swing' | 'position'
   * @param riskTolerance Risk tolerance: 'conservative' | 'moderate' | 'aggressive'
   */
  async getDecision(
    symbol: string,
    horizon: 'scalp' | 'swing' | 'position' = 'swing',
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ): Promise<{
    decision: SignalType;
    confidence: number;
    summary: string;
    signals: any[];
  } | null> {
    try {
      console.log(`🤖 Getting AI decision for ${symbol} (${horizon}, ${riskTolerance})`);
      
      const baseSymbol = symbol.split('/')[0];
      const response = await HttpClient.post<any>(API_ENDPOINTS.AI_DECISION, {
        symbol: baseSymbol,
        horizon,
        risk_tolerance: riskTolerance
      });
      
      // Parse decision
      let decision: SignalType = 'HOLD';
      if (response?.decision) {
        const decisionStr = String(response.decision).toUpperCase();
        if (decisionStr === 'BUY' || decisionStr === 'LONG') {
          decision = 'BUY';
        } else if (decisionStr === 'SELL' || decisionStr === 'SHORT') {
          decision = 'SELL';
        }
      }
      
      const confidence = Number(response?.confidence || 0);
      const summary = response?.summary || '';
      const signals = response?.signals || [];
      
      console.log(`✅ AI Decision for ${symbol}: ${decision} (${(confidence * 100).toFixed(0)}%)`);
      
      return {
        decision,
        confidence,
        summary,
        signals
      };
      
    } catch (error) {
      console.error(`❌ Error getting AI decision for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Convert AI signals to our Signal format
   */
  convertToSignal(
    symbol: string,
    aiDecision: {
      decision: SignalType;
      confidence: number;
      summary: string;
      signals: any[];
    },
    currentPrice: number
  ): Signal | null {
    if (aiDecision.decision === 'HOLD') {
      return null;
    }
    
    // Calculate stop loss and target based on confidence
    const riskPercent = 0.02; // 2% risk
    const rewardMultiplier = aiDecision.confidence > 0.8 ? 4 : 3; // Higher target for high confidence
    
    let stopLoss: number;
    let targetPrice: number;
    
    if (aiDecision.decision === 'BUY') {
      stopLoss = currentPrice * (1 - riskPercent);
      targetPrice = currentPrice * (1 + riskPercent * rewardMultiplier);
    } else {
      stopLoss = currentPrice * (1 + riskPercent);
      targetPrice = currentPrice * (1 - riskPercent * rewardMultiplier);
    }
    
    return {
      id: `ai-${symbol}-${Date.now()}`,
      symbol,
      type: aiDecision.decision,
      entry_price: currentPrice,
      stop_loss: stopLoss,
      target_price: targetPrice,
      confidence: aiDecision.confidence,
      reasoning: `AI Decision: ${aiDecision.summary || 'Based on multi-factor analysis'}`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ AI signals cache cleared');
  }
  
  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const aiSignalsProvider = AISignalsProvider.getInstance();
