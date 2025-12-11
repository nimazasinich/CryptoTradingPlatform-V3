
import { tradingService } from './tradingService';
import { databaseService, PriceAlert } from './database';
import { marketService } from './marketService';

export interface PortfolioStats {
  totalValue: number;
  totalPnl24h: number;
  pnlPercent24h: number;
  riskScore: number;
  activePositionsCount: number;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  value: number;
  allocation: number;
  pnl: number; // For positions
  pnlPercent: number; // For positions
  isPosition: boolean;
}

class RiskService {
  
  async getPortfolioStats(): Promise<PortfolioStats> {
    const balances = await tradingService.getBalances();
    const positions = await tradingService.getPositions();
    let totalValue = 0;
    
    // Calculate balances value
    for (const [symbol, amount] of Object.entries(balances)) {
      if (symbol === 'USDT') {
        totalValue += amount;
        continue;
      }
      // Get price
      try {
        const rate = await marketService.getRate(`${symbol}/USDT`);
        const price = rate?.price || 0;
        totalValue += amount * price;
      } catch (e) {
        // Fallback or ignore
      }
    }

    // Add positions value (margin/unrealized PnL logic would go here, 
    // but in this spot model positions update balances directly on close, 
    // so we just check open positions equity if not already in balances)
    // Note: tradingService subtracts cost from balance on open, so we need to add current value of pos.
    
    // Calculate Risk Score
    // 0-100. Lower is better.
    // Factors: 
    // 1. Diversification (few assets = high risk)
    // 2. Volatility of assets (not implemented here)
    // 3. Leverage (not implemented)
    
    const assetCount = Object.keys(balances).filter(k => balances[k] > 0).length + positions.length;
    let riskScore = 100;
    if (assetCount > 1) riskScore -= 20;
    if (assetCount > 3) riskScore -= 20;
    if (assetCount > 5) riskScore -= 20;
    if (balances['USDT'] > totalValue * 0.3) riskScore -= 20; // Cash buffer

    return {
      totalValue,
      totalPnl24h: totalValue * 0.015, // Mock 24h change as we don't store daily snapshots yet
      pnlPercent24h: 1.5,
      riskScore: Math.max(10, Math.min(90, riskScore)),
      activePositionsCount: positions.length
    };
  }

  async getHoldings(): Promise<Holding[]> {
    const balances = await tradingService.getBalances();
    const holdings: Holding[] = [];
    let totalValue = 0;

    // Process Balances
    for (const [symbol, amount] of Object.entries(balances)) {
      if (amount <= 0) continue;
      
      let price = 1;
      if (symbol !== 'USDT') {
        const rate = await marketService.getRate(`${symbol}/USDT`);
        price = rate?.price || 0;
      }
      
      const value = amount * price;
      totalValue += value;

      holdings.push({
        id: `bal_${symbol}`,
        symbol,
        name: symbol,
        amount,
        price,
        value,
        allocation: 0,
        pnl: 0,
        pnlPercent: 0,
        isPosition: false
      });
    }

    // Calc Allocation
    holdings.forEach(h => {
      h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
    });

    return holdings.sort((a, b) => b.value - a.value);
  }

  // --- Alerts ---

  getAlerts(): PriceAlert[] {
    return databaseService.getAlerts();
  }

  createAlert(symbol: string, condition: 'above' | 'below', price: number) {
    const alert: PriceAlert = {
      id: Math.random().toString(36).substring(7),
      symbol,
      condition,
      price,
      active: true,
      created_at: Date.now()
    };
    databaseService.saveAlert(alert);
    return alert;
  }

  deleteAlert(id: string) {
    databaseService.deleteAlert(id);
  }

  async checkAlerts() {
    const alerts = this.getAlerts().filter(a => a.active);
    for (const alert of alerts) {
      const rate = await marketService.getRate(`${alert.symbol}/USDT`);
      if (!rate) continue;
      
      const current = rate.price;
      if (alert.condition === 'above' && current >= alert.price) {
        // Trigger
        console.log(`ALERT: ${alert.symbol} is above ${alert.price}`);
        // In a real app, send push notification
      } else if (alert.condition === 'below' && current <= alert.price) {
        // Trigger
        console.log(`ALERT: ${alert.symbol} is below ${alert.price}`);
      }
    }
  }
}

export const riskService = new RiskService();
