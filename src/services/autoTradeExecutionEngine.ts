/**
 * Auto-Trading Execution Engine
 * Monitors AI signals and executes trades automatically based on configuration
 */

import { aiService } from './aiService';
import { tradingService } from './tradingService';
import { databaseService } from './database';
import { marketService } from './marketService';

export interface AutoTradeConfig {
  enabled: boolean;
  minConfidence: number;
  maxPositions: number;
  riskPerTrade: number; // Percentage of balance
  symbols: string[];
  stopLossPercent: number;
  takeProfitPercent: number;
  cooldownMinutes: number;
}

interface ActiveTrade {
  symbol: string;
  signalId: string;
  positionId: string;
  entryTime: number;
}

class AutoTradeExecutionEngine {
  private isRunning = false;
  private config: AutoTradeConfig = {
    enabled: false,
    minConfidence: 70,
    maxPositions: 3,
    riskPerTrade: 2,
    symbols: ['BTC', 'ETH', 'SOL'],
    stopLossPercent: 3,
    takeProfitPercent: 6,
    cooldownMinutes: 30
  };
  private activeTrades: Map<string, ActiveTrade> = new Map();
  private lastTradeTime: Map<string, number> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<(status: string, data?: any) => void> = new Set();

  /**
   * Start the auto-trading engine
   */
  async start(config: Partial<AutoTradeConfig>): Promise<void> {
    if (this.isRunning) {
      throw new Error('Auto-trading engine is already running');
    }

    this.config = { ...this.config, ...config };
    this.isRunning = true;
    
    this.notifyListeners('started', { config: this.config });
    console.log('🤖 Auto-trading engine started', this.config);

    // Check for signals every 30 seconds
    this.intervalId = setInterval(() => this.executionCycle(), 30000);
    
    // Run immediately
    await this.executionCycle();
  }

  /**
   * Stop the auto-trading engine
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.notifyListeners('stopped');
    console.log('🛑 Auto-trading engine stopped');
  }

  /**
   * Main execution cycle
   */
  private async executionCycle(): Promise<void> {
    if (!this.config.enabled || !this.isRunning) return;

    try {
      // Check current positions
      await this.monitorPositions();

      // Check if we can open new positions
      if (this.activeTrades.size >= this.config.maxPositions) {
        console.log(`⏸️ Max positions reached (${this.config.maxPositions})`);
        return;
      }

      // Get signals for configured symbols
      for (const symbol of this.config.symbols) {
        // Check cooldown
        const lastTrade = this.lastTradeTime.get(symbol) || 0;
        const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastTrade < cooldownMs) {
          console.log(`⏳ ${symbol} in cooldown`);
          continue;
        }

        // Skip if already have position
        if (this.activeTrades.has(symbol)) {
          continue;
        }

        // Get AI signals
        const signals = await aiService.getSignals(symbol);
        const validSignals = signals.filter(s => 
          s.confidence >= this.config.minConfidence
        );

        if (validSignals.length === 0) continue;

        // Take highest confidence signal
        const bestSignal = validSignals.reduce((a, b) => 
          a.confidence > b.confidence ? a : b
        );

        // Execute trade
        await this.executeSignal(bestSignal);
      }
    } catch (error) {
      console.error('❌ Auto-trade execution error:', error);
      this.notifyListeners('error', { error });
    }
  }

  /**
   * Execute a trading signal
   */
  private async executeSignal(signal: any): Promise<void> {
    try {
      const symbol = signal.symbol;
      
      // Get current price
      const rateData = await marketService.getRate(`${symbol}/USDT`);
      const currentPrice = rateData?.price || signal.entry_price;

      // Calculate position size based on risk
      const balance = await tradingService.getAvailableBalance('USDT');
      const riskAmount = balance * (this.config.riskPerTrade / 100);
      const stopLossDistance = currentPrice * (this.config.stopLossPercent / 100);
      const amount = riskAmount / stopLossDistance;

      // Place order
      const side = signal.type === 'BUY' ? 'buy' : 'sell';
      const order = await tradingService.placeOrder({
        symbol: `${symbol}/USDT`,
        side,
        type: 'market',
        price: currentPrice,
        amount
      });

      // Calculate stop loss and take profit
      const stopLoss = side === 'buy' 
        ? currentPrice * (1 - this.config.stopLossPercent / 100)
        : currentPrice * (1 + this.config.stopLossPercent / 100);
      
      const takeProfit = side === 'buy'
        ? currentPrice * (1 + this.config.takeProfitPercent / 100)
        : currentPrice * (1 - this.config.takeProfitPercent / 100);

      // Track trade
      this.activeTrades.set(symbol, {
        symbol,
        signalId: signal.id,
        positionId: order.id,
        entryTime: Date.now()
      });

      this.lastTradeTime.set(symbol, Date.now());

      // Save signal as executed
      databaseService.markSignalExecuted(signal.id);

      this.notifyListeners('trade_opened', {
        symbol,
        side,
        price: currentPrice,
        amount,
        stopLoss,
        takeProfit,
        confidence: signal.confidence
      });

      console.log(`✅ Auto-trade executed: ${side.toUpperCase()} ${amount.toFixed(4)} ${symbol} @ ${currentPrice}`);
    } catch (error) {
      console.error(`❌ Failed to execute signal for ${signal.symbol}:`, error);
      this.notifyListeners('trade_failed', { signal, error });
    }
  }

  /**
   * Monitor open positions and manage stops/targets
   */
  private async monitorPositions(): Promise<void> {
    const positions = await tradingService.getPositions();
    
    for (const position of positions) {
      const trade = this.activeTrades.get(position.symbol);
      if (!trade) continue;

      // Get current price
      const rateData = await marketService.getRate(`${position.symbol}/USDT`);
      const currentPrice = rateData?.price || position.entryPrice;

      const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      const adjustedPnl = position.side === 'long' ? pnlPercent : -pnlPercent;

      // Check stop loss
      if (adjustedPnl <= -this.config.stopLossPercent) {
        await this.closePosition(position.symbol, 'stop_loss', currentPrice);
        continue;
      }

      // Check take profit
      if (adjustedPnl >= this.config.takeProfitPercent) {
        await this.closePosition(position.symbol, 'take_profit', currentPrice);
        continue;
      }

      // Trailing stop (if profit > 3%)
      if (adjustedPnl > 3) {
        const trailingStop = this.config.stopLossPercent / 2; // Half of stop loss
        if (adjustedPnl < (this.config.takeProfitPercent - trailingStop)) {
          // Price has retraced, close with profit
          await this.closePosition(position.symbol, 'trailing_stop', currentPrice);
        }
      }
    }
  }

  /**
   * Close a position
   */
  private async closePosition(symbol: string, reason: string, exitPrice: number): Promise<void> {
    try {
      const result = await tradingService.closePosition(symbol);
      
      if (result) {
        this.activeTrades.delete(symbol);
        
        this.notifyListeners('trade_closed', {
          symbol,
          reason,
          pnl: result.pnl,
          exitPrice
        });

        console.log(`🔒 Position closed: ${symbol} | ${reason} | PnL: ${result.pnl.toFixed(2)} USDT`);
      }
    } catch (error) {
      console.error(`❌ Failed to close position ${symbol}:`, error);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      activePositions: this.activeTrades.size,
      activeTrades: Array.from(this.activeTrades.values()),
      lastTradeTimes: Object.fromEntries(this.lastTradeTime)
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoTradeConfig>): void {
    this.config = { ...this.config, ...config };
    this.notifyListeners('config_updated', { config: this.config });
  }

  /**
   * Subscribe to engine events
   */
  subscribe(callback: (status: string, data?: any) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(status: string, data?: any): void {
    this.callbacks.forEach(callback => {
      try {
        callback(status, data);
      } catch (error) {
        console.error('Error in auto-trade callback:', error);
      }
    });
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats() {
    const stats = databaseService.getTradeStats();
    const positions = await tradingService.getPositions();
    
    const totalPnL = stats.totalPnl;
    const winRate = stats.winRate;
    const avgPnL = stats.avgPnl;
    
    return {
      totalTrades: stats.tradeCount,
      winRate,
      totalPnL,
      avgPnL,
      activePositions: positions.length,
      totalFees: stats.totalFees
    };
  }
}

export const autoTradeEngine = new AutoTradeExecutionEngine();
