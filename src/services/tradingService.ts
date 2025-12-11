
import { marketService } from './marketService';
import { databaseService } from './database';

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price: number;
  amount: number;
  status: 'open' | 'filled' | 'canceled';
  timestamp: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  amount: number;
  unrealizedPnL: number;
  pnlPercent: number;
  status: 'OPEN' | 'CLOSED';
}

export interface TradeHistory {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: number;
  pnl?: number;
}

export interface WalletBalance {
  [currency: string]: number;
}

class TradingService {
  private balances: WalletBalance = {
    USDT: 100000, 
    BTC: 0.5,
    ETH: 10,
    SOL: 100
  };
  
  constructor() {
    this.loadBalances();
  }

  private loadBalances() {
    const saved = localStorage.getItem('wallet_balances');
    if (saved) {
      this.balances = JSON.parse(saved);
    }
  }

  private saveBalances() {
    localStorage.setItem('wallet_balances', JSON.stringify(this.balances));
  }

  public async getBalances(): Promise<WalletBalance> {
    return { ...this.balances };
  }

  public async getOpenOrders(symbol?: string): Promise<Order[]> {
    // For now mock open orders in memory, or add DB table if needed
    return [];
  }

  public async getPositions(): Promise<Position[]> {
    const rawPositions = databaseService.getOpenPositions();
    // Map DB fields to interface
    return rawPositions.map(p => ({
      id: p.id,
      symbol: p.symbol,
      side: p.side === 'BUY' ? 'long' : 'short', // DB uses BUY/SELL, UI uses long/short
      entryPrice: p.entry_price,
      amount: p.amount,
      unrealizedPnL: p.unrealized_pnl,
      pnlPercent: 0, // calculate if needed
      status: p.status
    }));
  }

  public async getTradeHistory(): Promise<TradeHistory[]> {
    return databaseService.getTradeHistory();
  }

  public async placeOrder(order: Omit<Order, 'id' | 'status' | 'timestamp'>): Promise<Order> {
    const cost = order.price * order.amount;
    const coin = order.symbol.replace('/USDT', '');

    if (order.side === 'buy' && this.balances['USDT'] < cost) {
      throw new Error('Insufficient USDT Balance');
    }
    if (order.side === 'sell' && (this.balances[coin] || 0) < order.amount) {
      throw new Error(`Insufficient ${coin} Balance`);
    }

    const newOrder: Order = {
      ...order,
      id: Math.random().toString(36).substring(7),
      status: 'filled', // Auto-fill for sim
      timestamp: Date.now()
    };

    await this.executeTrade(newOrder);
    return newOrder;
  }

  public async closePosition(symbol: string): Promise<TradeHistory | null> {
    const positions = databaseService.getOpenPositions();
    const pos = positions.find(p => p.symbol === symbol);
    
    if (!pos) return null;

    let currentPrice = pos.entry_price;
    try {
      const rate = await marketService.getRate(symbol + '/USDT');
      if (rate && rate.price) currentPrice = rate.price;
    } catch(e) {}

    const pnl = (currentPrice - pos.entry_price) * pos.amount * (pos.side === 'BUY' ? 1 : -1);
    const collateral = pos.entry_price * pos.amount;
    
    // Return to wallet
    this.balances['USDT'] += (collateral + pnl);
    this.saveBalances();

    // Close in DB using proper update
    databaseService.updatePosition(pos.id, { 
      status: 'CLOSED', 
      realized_pnl: pnl,
      closed_at: Date.now()
    });
    
    const tradeId = Math.random().toString(36).substring(7);
    const trade = {
      id: tradeId,
      position_id: pos.id,
      symbol: pos.symbol,
      side: pos.side === 'BUY' ? 'SELL' : 'BUY',
      price: currentPrice,
      amount: pos.amount,
      fee: 0,
      total: currentPrice * pos.amount,
      timestamp: Date.now(),
      order_type: 'MARKET',
      strategy_id: pos.strategy_id
    };

    databaseService.saveTrade(trade);
    
    return {
      id: tradeId,
      symbol,
      side: pos.side === 'BUY' ? 'sell' : 'buy',
      price: currentPrice,
      amount: pos.amount,
      timestamp: Date.now(),
      pnl
    };
  }

  private async executeTrade(order: Order) {
    const cost = order.price * order.amount;
    const coin = order.symbol.replace('/USDT', ''); // Assuming pair

    if (order.side === 'buy') {
      this.balances['USDT'] -= cost;
      this.balances[coin] = (this.balances[coin] || 0) + order.amount;
      
      // Save Position to DB
      databaseService.savePosition({
        id: order.id,
        symbol: coin,
        side: 'BUY',
        entry_price: order.price,
        amount: order.amount,
        current_price: order.price,
        unrealized_pnl: 0,
        stop_loss: 0,
        take_profit: 0,
        strategy_id: 'MANUAL',
        opened_at: Date.now(),
        status: 'OPEN'
      });

    } else {
      this.balances[coin] -= order.amount;
      this.balances['USDT'] += cost;
      // Note: Sell orders without existing position in this simple model 
      // act as closing logic handled by closePosition usually, 
      // but here we just update balance for spot trading.
    }

    this.saveBalances();

    // Log History
    databaseService.saveTrade({
      id: order.id,
      position_id: order.id, // linked
      symbol: coin,
      side: order.side.toUpperCase(),
      price: order.price,
      amount: order.amount,
      fee: 0,
      total: cost,
      timestamp: Date.now(),
      order_type: order.type.toUpperCase(),
      strategy_id: 'MANUAL'
    });
  }
}

export const tradingService = new TradingService();
