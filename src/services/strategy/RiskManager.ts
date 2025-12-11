import { RiskConfig, Position, TradeResult } from '../../types/strategy';

export class RiskManager {
  private cooldowns: Map<string, number> = new Map();
  private consecutiveLosses: Map<string, number> = new Map();
  private openPositions: Position[] = [];
  private tradeHistory: TradeResult[] = [];
  
  constructor(private config: RiskConfig) {}
  
  canTrade(symbol: string): { allowed: boolean; reason?: string } {
    // Check cooldown
    const cooldownUntil = this.cooldowns.get(symbol);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const remainingMinutes = Math.ceil((cooldownUntil - Date.now()) / 60000);
      return {
        allowed: false,
        reason: `Cooldown active for ${remainingMinutes} more minutes`
      };
    }
    
    // Check max open positions
    if (this.openPositions.length >= this.config.futures.maxOpenPositions) {
      return {
        allowed: false,
        reason: `Max open positions (${this.config.futures.maxOpenPositions}) reached`
      };
    }
    
    // Check daily loss limit
    const todayPnl = this.calculateDailyPnl();
    if (todayPnl <= -this.config.futures.maxDailyLoss) {
      return {
        allowed: false,
        reason: `Daily loss limit reached: $${todayPnl.toFixed(2)}`
      };
    }
    
    // Check consecutive losses
    const consecutiveLosses = this.consecutiveLosses.get(symbol) || 0;
    if (consecutiveLosses >= 3) {
      return {
        allowed: false,
        reason: `${consecutiveLosses} consecutive losses - cooldown triggered`
      };
    }
    
    return { allowed: true };
  }
  
  activateCooldown(
    symbol: string,
    bars: number = 20,
    barDurationMs: number = 15 * 60 * 1000
  ) {
    const cooldownMs = bars * barDurationMs;
    const until = Date.now() + cooldownMs;
    this.cooldowns.set(symbol, until);
    
    console.log(
      `🛑 Cooldown activated for ${symbol} until ${new Date(until).toLocaleString()}`
    );
  }
  
  recordTrade(result: TradeResult) {
    this.tradeHistory.push(result);
    
    // Track consecutive losses
    const symbol = result.signal.symbol;
    if (result.status === 'LOSS') {
      const current = this.consecutiveLosses.get(symbol) || 0;
      this.consecutiveLosses.set(symbol, current + 1);
      
      // Activate cooldown after 2 consecutive losses
      if (current + 1 >= 2) {
        this.activateCooldown(symbol);
      }
    } else if (result.status === 'WIN' || result.status === 'BREAKEVEN') {
      // Reset consecutive losses
      this.consecutiveLosses.set(symbol, 0);
      // Clear cooldown
      this.cooldowns.delete(symbol);
    }
    
    console.log(
      `📊 Trade recorded: ${result.status} - ${symbol} - P&L: $${result.pnl.toFixed(2)}`
    );
  }
  
  calculatePositionSize(
    balance: number,
    entryPrice: number,
    stopLoss: number,
    leverage: number = 1
  ): number {
    const riskPercent = this.config.futures.maxRiskPerTrade / 100;
    const riskAmount = balance * riskPercent;
    const slDistance = Math.abs(entryPrice - stopLoss) / entryPrice;
    
    if (slDistance === 0) return 0;
    
    const positionSize = (riskAmount / slDistance) / entryPrice;
    
    // Apply max position size limit
    const maxSize = this.config.futures.maxPositionSize;
    return Math.min(positionSize, maxSize);
  }
  
  validateLeverage(leverage: number): number {
    const { minLeverage, maxLeverage } = this.config.futures;
    return Math.max(minLeverage, Math.min(maxLeverage, leverage));
  }
  
  private calculateDailyPnl(): number {
    const today = new Date().setHours(0, 0, 0, 0);
    return this.tradeHistory
      .filter(t => t.timestamp >= today)
      .reduce((sum, t) => sum + t.pnl, 0);
  }
  
  addPosition(position: Position) {
    this.openPositions.push(position);
    console.log(`➕ Position added: ${position.symbol} ${position.side}`);
  }
  
  removePosition(id: string) {
    const position = this.openPositions.find(p => p.id === id);
    this.openPositions = this.openPositions.filter(p => p.id !== id);
    if (position) {
      console.log(`➖ Position removed: ${position.symbol} ${position.side}`);
    }
  }
  
  getOpenPositions(): Position[] {
    return [...this.openPositions];
  }
  
  getOpenPositionsBySymbol(symbol: string): Position[] {
    return this.openPositions.filter(p => p.symbol === symbol);
  }
  
  getTotalExposure(): number {
    return this.openPositions.reduce((sum, p) => {
      return sum + (p.amount * p.entryPrice * p.leverage);
    }, 0);
  }
  
  getCurrentDrawdown(): number {
    let peak = 0;
    let currentDrawdown = 0;
    let runningPnl = 0;
    
    for (const trade of this.tradeHistory) {
      runningPnl += trade.pnl;
      if (runningPnl > peak) peak = runningPnl;
      const drawdown = peak - runningPnl;
      if (drawdown > currentDrawdown) currentDrawdown = drawdown;
    }
    
    return currentDrawdown;
  }
  
  getTradeHistory(limit?: number): TradeResult[] {
    const sorted = [...this.tradeHistory].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  clearCooldown(symbol: string) {
    this.cooldowns.delete(symbol);
    console.log(`✅ Cooldown cleared for ${symbol}`);
  }
  
  getCooldownStatus(symbol: string): { active: boolean; remainingMs: number } {
    const cooldownUntil = this.cooldowns.get(symbol);
    if (!cooldownUntil) {
      return { active: false, remainingMs: 0 };
    }
    
    const remainingMs = cooldownUntil - Date.now();
    return {
      active: remainingMs > 0,
      remainingMs: Math.max(0, remainingMs)
    };
  }
  
  getStats(): {
    openPositions: number;
    totalExposure: number;
    dailyPnl: number;
    currentDrawdown: number;
    totalTrades: number;
  } {
    return {
      openPositions: this.openPositions.length,
      totalExposure: this.getTotalExposure(),
      dailyPnl: this.calculateDailyPnl(),
      currentDrawdown: this.getCurrentDrawdown(),
      totalTrades: this.tradeHistory.length
    };
  }
}
