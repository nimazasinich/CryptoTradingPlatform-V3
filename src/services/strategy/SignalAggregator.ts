import { AdvancedSignalEngine } from './AdvancedSignalEngine';
import { StrategyEngine } from './StrategyEngine';
import { RiskManager } from './RiskManager';
import { Candle, Signal, StrategyOutput, DetectorWeights, RiskConfig } from '../../types/strategy';

export class SignalAggregator {
  private advancedEngine: AdvancedSignalEngine;
  private strategyEngine: StrategyEngine;
  private riskManager: RiskManager;
  
  constructor(weights: DetectorWeights, riskConfig: RiskConfig) {
    this.advancedEngine = new AdvancedSignalEngine();
    this.strategyEngine = new StrategyEngine(weights);
    this.riskManager = new RiskManager(riskConfig);
  }
  
  async generateCombinedSignal(
    symbol: string,
    candles15m: Candle[],
    candles1h: Candle[],
    candles4h: Candle[]
  ): Promise<{
    signal: Signal | null;
    advanced: any;
    strategy: StrategyOutput;
  }> {
    // Check if trading is allowed
    const riskCheck = this.riskManager.canTrade(symbol);
    if (!riskCheck.allowed) {
      console.log(`❌ Trade blocked for ${symbol}: ${riskCheck.reason}`);
      
      // Still return analysis but no signal
      const strategyOutput = await this.strategyEngine.analyzeMultiTimeframe(
        symbol,
        candles15m,
        candles1h,
        candles4h
      );
      
      return {
        signal: null,
        advanced: null,
        strategy: strategyOutput
      };
    }
    
    // Run both engines in parallel
    const [advancedSignal, strategyOutput] = await Promise.all([
      this.advancedEngine.generateSignal(symbol, candles1h),
      this.strategyEngine.analyzeMultiTimeframe(symbol, candles15m, candles1h, candles4h)
    ]);
    
    // Decision logic: Combine both engines
    let finalSignal: Signal | null = null;
    
    // CASE 1: Both engines agree - STRONGEST signal
    if (advancedSignal && strategyOutput.action !== 'HOLD') {
      if (advancedSignal.type === strategyOutput.action) {
        console.log(`✅ Both engines agree: ${advancedSignal.type} ${symbol}`);
        finalSignal = {
          ...advancedSignal,
          confidence: Math.min(1.0, advancedSignal.confidence * 1.2),
          reasoning: `${advancedSignal.reasoning} | Multi-engine consensus with ${(strategyOutput.confluence.score * 100).toFixed(0)}% confluence`
        };
      } else {
        console.log(`⚠️ Engine conflict for ${symbol}: Advanced=${advancedSignal.type}, Strategy=${strategyOutput.action}`);
        // Conflict - use higher confidence
        if (advancedSignal.confidence > strategyOutput.confluence.score) {
          finalSignal = advancedSignal;
        } else {
          finalSignal = this.convertStrategyOutputToSignal(strategyOutput);
        }
      }
    }
    // CASE 2: Only advanced engine has signal
    else if (advancedSignal && advancedSignal.score.totalScore >= 85) {
      console.log(`⭐ Advanced engine high score: ${advancedSignal.score.totalScore}/100`);
      finalSignal = advancedSignal;
    }
    // CASE 3: Only strategy engine has signal
    else if (strategyOutput.confluence.score >= 0.70 && strategyOutput.action !== 'HOLD') {
      console.log(`📊 Strategy engine strong confluence: ${(strategyOutput.confluence.score * 100).toFixed(0)}%`);
      finalSignal = this.convertStrategyOutputToSignal(strategyOutput);
    }
    // CASE 4: No signal
    else {
      console.log(`⏸️ No signal generated for ${symbol}`);
    }
    
    return {
      signal: finalSignal,
      advanced: advancedSignal,
      strategy: strategyOutput
    };
  }
  
  private convertStrategyOutputToSignal(output: StrategyOutput): Signal {
    const currentPrice = output.entryPlan.sl > 0 
      ? (output.action === 'BUY' 
        ? output.entryPlan.sl / 0.988 
        : output.entryPlan.sl / 1.012)
      : output.entryPlan.tp[0];
    
    return {
      id: `mtf-${output.symbol}-${output.timestamp}`,
      symbol: output.symbol,
      type: output.action,
      entry_price: currentPrice,
      stop_loss: output.entryPlan.sl,
      target_price: output.entryPlan.tp[0],
      confidence: output.confluence.score,
      reasoning: output.rationale,
      timestamp: new Date(output.timestamp).toISOString()
    };
  }
  
  getRiskManager(): RiskManager {
    return this.riskManager;
  }
  
  getEngineStats(): {
    advancedCooldowns: number;
    riskStats: any;
  } {
    return {
      advancedCooldowns: 0, // Could track this if needed
      riskStats: this.riskManager.getStats()
    };
  }
}
