// ============================================================================
// HTS Service - Main Service Facade
// ============================================================================

import { OHLCV, HTSResult, TimeframePrediction, ConfluenceResult, SMCData } from '../../types/hts';
import { Candle } from '../../types/strategy';
import { CoreIndicators } from './indicators/CoreIndicators';
import { SMCAnalyzer } from './indicators/SMCAnalyzer';
import { HTSEngine } from './scoring/HTSEngine';
import { ConfluenceAnalyzer } from './scoring/ConfluenceAnalyzer';
import { marketDataProvider } from '../strategy/MarketDataProvider';

/**
 * HTS Service - Main entry point for HTS analysis
 * Uses real market data from MarketDataProvider
 */
export class HTSService {
  private engine: HTSEngine;

  constructor() {
    this.engine = new HTSEngine();
  }

  /**
   * Convert Candle to OHLCV format
   */
  private convertCandlesToOHLCV(candles: Candle[]): OHLCV[] {
    return candles.map(candle => ({
      timestamp: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));
  }

  /**
   * Analyze a symbol using real market data
   * @param symbol Symbol to analyze (e.g., 'BTC', 'ETH')
   * @param interval Timeframe (e.g., '15m', '1h')
   * @param limit Number of candles to analyze
   */
  async analyzeSymbol(
    symbol: string, 
    interval: string = '15m', 
    limit: number = 200
  ): Promise<HTSResult> {
    try {
      console.log(`🔍 HTS analyzing ${symbol} on ${interval} timeframe`);
      
      // Fetch real market data
      const candles = await marketDataProvider.getCandles(symbol, interval, limit);
      
      if (!candles || candles.length === 0) {
        throw new Error(`No market data available for ${symbol}`);
      }

      // Convert to OHLCV format
      const ohlcv = this.convertCandlesToOHLCV(candles);
      
      // Extract price arrays
      const closes = ohlcv.map(c => c.close);
      const highs = ohlcv.map(c => c.high);
      const lows = ohlcv.map(c => c.low);
      const volumes = ohlcv.map(c => c.volume);

      // Calculate core indicators
      const rsi = CoreIndicators.calculateRSI(closes);
      const macd = CoreIndicators.calculateMACD(closes);
      const ema50 = CoreIndicators.calculateEMA(closes, 50);
      const sma200 = CoreIndicators.calculateSMA(closes, 200);
      const atr = CoreIndicators.calculateATR(highs, lows, closes);

      // Analyze Smart Money Concepts
      const orderBlocks = SMCAnalyzer.detectOrderBlocks(ohlcv);
      const liquidityZones = SMCAnalyzer.detectLiquidityZones(ohlcv);
      const fvgs = SMCAnalyzer.detectFVG(ohlcv);

      const smc: SMCData = {
        orderBlocks,
        liquidityZones,
        fvgs,
        smartMoneyScore: SMCAnalyzer.calculateSmartMoneyScore({
          orderBlocks,
          liquidityZones,
          fvgs,
          smartMoneyScore: 0
        })
      };

      // Prepare indicators for scoring
      const indicators = {
        rsi: rsi[rsi.length - 1] || 50,
        macd: macd.macd[macd.macd.length - 1] || 0,
        ema50: ema50[ema50.length - 1] || closes[closes.length - 1],
        sma200: sma200[sma200.length - 1] || closes[closes.length - 1],
        atr: atr[atr.length - 1] || closes[closes.length - 1] * 0.02
      };

      // Generate signal
      const result = this.engine.generateSignal(symbol, ohlcv, indicators, smc);
      
      console.log(`✅ HTS analysis complete for ${symbol}: ${result.action} (Score: ${result.final_score.toFixed(2)})`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ HTS analysis failed for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Analyze multiple timeframes for confluence
   * @param symbol Symbol to analyze
   * @param timeframes Array of timeframes to analyze
   */
  async analyzeMultiTimeframe(
    symbol: string,
    timeframes: Array<'1m' | '5m' | '15m' | '1h'> = ['1m', '5m', '15m', '1h']
  ): Promise<ConfluenceResult> {
    try {
      console.log(`🔍 Multi-timeframe analysis for ${symbol}`);
      
      const predictions: TimeframePrediction[] = [];

      // Analyze each timeframe
      for (const tf of timeframes) {
        try {
          const result = await this.analyzeSymbol(symbol, tf, 200);
          predictions.push({
            timeframe: tf,
            action: result.action,
            confidence: result.confidence,
            score: result.final_score
          });
        } catch (error) {
          console.warn(`⚠️ Failed to analyze ${symbol} on ${tf}:`, error);
          // Continue with other timeframes
        }
      }

      if (predictions.length === 0) {
        throw new Error('No timeframe analysis succeeded');
      }

      // Calculate confluence
      const confluence = ConfluenceAnalyzer.calculate(predictions);
      
      console.log(`✅ Multi-timeframe analysis complete: ${confluence.dominant_action} with ${confluence.agreement_percent.toFixed(1)}% agreement`);
      
      return confluence;
      
    } catch (error) {
      console.error(`❌ Multi-timeframe analysis failed for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Analyze multiple symbols
   * @param symbols Array of symbols to analyze
   * @param interval Timeframe
   */
  async analyzeMultipleSymbols(
    symbols: string[],
    interval: string = '15m'
  ): Promise<HTSResult[]> {
    try {
      console.log(`🔍 Analyzing ${symbols.length} symbols`);
      
      const results: HTSResult[] = [];

      // Analyze symbols in parallel (with some delay to avoid rate limiting)
      for (const symbol of symbols) {
        try {
          const result = await this.analyzeSymbol(symbol, interval);
          results.push(result);
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`⚠️ Failed to analyze ${symbol}:`, error);
          // Continue with other symbols
        }
      }

      // Sort by score (highest first)
      results.sort((a, b) => b.final_score - a.final_score);
      
      console.log(`✅ Analyzed ${results.length}/${symbols.length} symbols`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Multi-symbol analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get real-time price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    return await marketDataProvider.getCurrentPrice(symbol);
  }

  /**
   * Update scoring weights
   */
  updateWeights(newWeights: any) {
    this.engine.updateWeights(newWeights);
  }

  /**
   * Get current scoring weights
   */
  getWeights() {
    return this.engine.getWeights();
  }
}

// Export singleton instance
export const htsService = new HTSService();
