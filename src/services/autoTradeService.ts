import { SignalAggregator } from './strategy/SignalAggregator';
import { RiskManager } from './strategy/RiskManager';
import { AutoTradeState, Signal, Position, TradeResult, PerformanceMetrics, Candle } from '../types/strategy';
import { configManager } from '../engine/ConfigManager';

export class AutoTradeService {
  private static instance: AutoTradeService;
  private state: AutoTradeState;
  private signalAggregator: SignalAggregator;
  private riskManager: RiskManager;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    const weights = configManager.getDetectorWeights();
    const riskConfig = configManager.getRiskConfig();
    
    this.signalAggregator = new SignalAggregator(weights, riskConfig);
    this.riskManager = this.signalAggregator.getRiskManager();
    
    this.state = {
      enabled: false,
      activeSignals: [],
      openPositions: [],
      performance: this.initializePerformance(),
      lastUpdate: Date.now(),
      cooldownUntil: {}
    };
  }
  
  static getInstance(): AutoTradeService {
    if (!AutoTradeService.instance) {
      AutoTradeService.instance = new AutoTradeService();
    }
    return AutoTradeService.instance;
  }
  
  async start(symbols: string[] = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']) {
    if (this.state.enabled) {
      console.log('⚠️ Auto-trade already running');
      return;
    }
    
    this.state.enabled = true;
    console.log(`🤖 Auto-trade started for: ${symbols.join(', ')}`);
    
    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      for (const symbol of symbols) {
        await this.monitorSymbol(symbol);
      }
    }, 60000); // Check every 1 minute
    
    // Start position update loop
    this.updateInterval = setInterval(async () => {
      await this.updateOpenPositions();
      this.state.lastUpdate = Date.now();
    }, 10000); // Update every 10 seconds
  }
  
  stop() {
    if (!this.state.enabled) return;
    
    this.state.enabled = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('🛑 Auto-trade stopped');
  }
  
  private async monitorSymbol(symbol: string) {
    try {
      // Generate mock candle data (in production, fetch from marketDataService)
      const candles15m = this.generateMockCandles(200, 15);
      const candles1h = this.generateMockCandles(200, 60);
      const candles4h = this.generateMockCandles(200, 240);
      
      // Generate signal
      const result = await this.signalAggregator.generateCombinedSignal(
        symbol,
        candles15m,
        candles1h,
        candles4h
      );
      
      if (result.signal) {
        console.log(`📊 Signal generated for ${symbol}:`, result.signal.type);
        
        // Add to active signals
        this.state.activeSignals.push(result.signal);
        
        // Keep only last 10 signals
        if (this.state.activeSignals.length > 10) {
          this.state.activeSignals = this.state.activeSignals.slice(-10);
        }
        
        // Execute trade (simulated or real)
        await this.executeSignal(result.signal);
      }
    } catch (error) {
      console.error(`❌ Error monitoring ${symbol}:`, error);
    }
  }
  
  private async executeSignal(signal: Signal) {
    console.log(`⚡ Executing signal: ${signal.id}`);
    
    // Create position
    const position: Position = {
      id: `pos-${Date.now()}`,
      symbol: signal.symbol,
      side: signal.type === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice: signal.entry_price,
      amount: 100, // Would calculate based on risk management
      leverage: 5,  // From entry plan
      stopLoss: signal.stop_loss,
      takeProfit: [signal.target_price],
      currentPnl: 0,
      openedAt: Date.now()
    };
    
    this.state.openPositions.push(position);
    this.riskManager.addPosition(position);
    
    console.log(`✅ Position opened: ${position.symbol} ${position.side} @ ${position.entryPrice}`);
  }
  
  private async updateOpenPositions() {
    for (const position of [...this.state.openPositions]) {
      try {
        // Simulate price movement (in production, fetch real price)
        const priceChange = (Math.random() - 0.5) * 0.02; // ±1% movement
        const currentPrice = position.entryPrice * (1 + priceChange);
        
        // Calculate P&L
        const pnl = this.calculatePnl(position, currentPrice);
        position.currentPnl = pnl;
        
        // Check exit conditions
        if (this.shouldExitPosition(position, currentPrice)) {
          await this.exitPosition(position, currentPrice);
        }
      } catch (error) {
        console.error(`❌ Error updating position ${position.id}:`, error);
      }
    }
  }
  
  private calculatePnl(position: Position, currentPrice: number): number {
    const priceChange = position.side === 'LONG'
      ? (currentPrice - position.entryPrice) / position.entryPrice
      : (position.entryPrice - currentPrice) / position.entryPrice;
    
    return position.amount * priceChange * position.leverage;
  }
  
  private shouldExitPosition(position: Position, currentPrice: number): boolean {
    // Check stop loss
    if (position.side === 'LONG' && currentPrice <= position.stopLoss) return true;
    if (position.side === 'SHORT' && currentPrice >= position.stopLoss) return true;
    
    // Check take profit
    for (const tp of position.takeProfit) {
      if (position.side === 'LONG' && currentPrice >= tp) return true;
      if (position.side === 'SHORT' && currentPrice <= tp) return true;
    }
    
    // Time-based exit (24 hours)
    const maxHoldTime = 24 * 60 * 60 * 1000;
    if (Date.now() - position.openedAt > maxHoldTime) return true;
    
    return false;
  }
  
  private async exitPosition(position: Position, exitPrice: number) {
    console.log(`🚪 Exiting position: ${position.id}`);
    
    // Calculate final P&L
    const finalPnl = this.calculatePnl(position, exitPrice);
    
    // Find the signal that created this position
    const signal = this.findSignalForPosition(position);
    
    // Create trade result
    const result: TradeResult = {
      id: `trade-${Date.now()}`,
      signal,
      entryPrice: position.entryPrice,
      exitPrice,
      pnl: finalPnl,
      pnlPercent: (finalPnl / position.amount) * 100,
      duration: Date.now() - position.openedAt,
      status: finalPnl > 0 ? 'WIN' : finalPnl < 0 ? 'LOSS' : 'BREAKEVEN',
      timestamp: Date.now()
    };
    
    // Record trade
    this.riskManager.recordTrade(result);
    
    // Update performance
    this.updatePerformance(result);
    
    // Remove position
    const index = this.state.openPositions.findIndex(p => p.id === position.id);
    if (index !== -1) {
      this.state.openPositions.splice(index, 1);
    }
    this.riskManager.removePosition(position.id);
    
    console.log(`${result.status === 'WIN' ? '🎉' : '😔'} Trade closed: ${result.status} P&L: $${finalPnl.toFixed(2)}`);
  }
  
  private updatePerformance(result: TradeResult) {
    const perf = this.state.performance;
    
    perf.totalTrades++;
    if (result.status === 'WIN') perf.winningTrades++;
    if (result.status === 'LOSS') perf.losingTrades++;
    
    perf.winRate = perf.totalTrades > 0 
      ? (perf.winningTrades / perf.totalTrades) * 100 
      : 0;
    
    perf.totalPnl += result.pnl;
    
    if (result.status === 'WIN') {
      perf.avgWin = perf.winningTrades > 0
        ? (perf.avgWin * (perf.winningTrades - 1) + result.pnl) / perf.winningTrades
        : result.pnl;
    }
    
    if (result.status === 'LOSS') {
      perf.avgLoss = perf.losingTrades > 0
        ? (perf.avgLoss * (perf.losingTrades - 1) + Math.abs(result.pnl)) / perf.losingTrades
        : Math.abs(result.pnl);
    }
    
    perf.profitFactor = perf.avgLoss > 0 ? perf.avgWin / perf.avgLoss : 0;
    
    // Update max drawdown
    perf.maxDrawdown = Math.max(perf.maxDrawdown, this.riskManager.getCurrentDrawdown());
  }
  
  private findSignalForPosition(position: Position): Signal {
    const signal = this.state.activeSignals.find(s => s.symbol === position.symbol);
    if (signal) return signal;
    
    // Return default signal if not found
    return {
      id: 'unknown',
      symbol: position.symbol,
      type: position.side === 'LONG' ? 'BUY' : 'SELL',
      entry_price: position.entryPrice,
      stop_loss: position.stopLoss,
      target_price: position.takeProfit[0] || position.entryPrice,
      confidence: 0.5,
      reasoning: 'Historical position',
      timestamp: new Date().toISOString()
    };
  }
  
  private initializePerformance(): PerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    };
  }
  
  private generateMockCandles(count: number, intervalMinutes: number): Candle[] {
    const candles: Candle[] = [];
    let price = 50000 + Math.random() * 10000;
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const timestamp = now - (count - i) * intervalMinutes * 60 * 1000;
      const change = (Math.random() - 0.5) * 0.02;
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = 1000000 + Math.random() * 5000000;
      
      candles.push({ timestamp, open, high, low, close, volume });
      price = close;
    }
    
    return candles;
  }
  
  getState(): AutoTradeState {
    return { ...this.state };
  }
  
  isEnabled(): boolean {
    return this.state.enabled;
  }
  
  getActiveSignals(): Signal[] {
    return [...this.state.activeSignals];
  }
  
  getOpenPositions(): Position[] {
    return [...this.state.openPositions];
  }
  
  getPerformance(): PerformanceMetrics {
    return { ...this.state.performance };
  }
}

// Export singleton instance
export const autoTradeService = AutoTradeService.getInstance();
