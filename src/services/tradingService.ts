
import { marketService } from './marketService';
import { databaseService } from './database';

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop-limit';
  price: number;
  amount: number;
  stopPrice?: number;
  status: 'open' | 'filled' | 'canceled' | 'rejected';
  timestamp: number;
  filled?: number;
  fee?: number;
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
  stopLoss?: number;
  takeProfit?: number;
  leverage?: number;
}

export interface TradeHistory {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: number;
  pnl?: number;
  fee?: number;
  total: number;
}

export interface WalletBalance {
  [currency: string]: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

class TradingService {
  private balances: WalletBalance = {
    USDT: 100000, 
    BTC: 0.5,
    ETH: 10,
    SOL: 100,
    BNB: 20,
    ADA: 5000,
    XRP: 3000,
    DOGE: 50000
  };
  
  private openOrders: Order[] = [];
  private readonly FEE_RATE = 0.001; // 0.1% trading fee
  
  constructor() {
    this.loadBalances();
    this.loadOrders();
  }

  private loadBalances() {
    const saved = localStorage.getItem('wallet_balances');
    if (saved) {
      try {
        this.balances = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load balances:', e);
      }
    }
  }

  private saveBalances() {
    try {
      localStorage.setItem('wallet_balances', JSON.stringify(this.balances));
    } catch (e) {
      console.error('Failed to save balances:', e);
    }
  }

  private loadOrders() {
    const saved = localStorage.getItem('open_orders');
    if (saved) {
      try {
        this.openOrders = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load orders:', e);
      }
    }
  }

  private saveOrders() {
    try {
      localStorage.setItem('open_orders', JSON.stringify(this.openOrders));
    } catch (e) {
      console.error('Failed to save orders:', e);
    }
  }

  /**
   * Get wallet balances
   */
  public async getBalances(): Promise<WalletBalance> {
    return { ...this.balances };
  }

  /**
   * Get balance for specific asset
   */
  public async getBalance(currency: string): Promise<number> {
    return this.balances[currency] || 0;
  }

  /**
   * Get available balance (excluding locked in orders)
   */
  public async getAvailableBalance(currency: string): Promise<number> {
    const total = this.balances[currency] || 0;
    
    // Calculate locked amount in open orders
    const locked = this.openOrders
      .filter(o => o.status === 'open')
      .reduce((sum, order) => {
        if (currency === 'USDT' && order.side === 'buy') {
          return sum + (order.price * order.amount);
        }
        if (currency === order.symbol && order.side === 'sell') {
          return sum + order.amount;
        }
        return sum;
      }, 0);
    
    return Math.max(0, total - locked);
  }

  /**
   * Get all open orders
   */
  public async getOpenOrders(symbol?: string): Promise<Order[]> {
    if (symbol) {
      return this.openOrders.filter(o => o.symbol === symbol && o.status === 'open');
    }
    return this.openOrders.filter(o => o.status === 'open');
  }

  /**
   * Get all positions
   */
  public async getPositions(): Promise<Position[]> {
    const rawPositions = databaseService.getOpenPositions();
    
    // Map DB fields to interface and calculate real-time PnL
    return rawPositions.map(p => {
      const pnlPercent = p.entry_price ? ((p.unrealized_pnl / (p.entry_price * p.amount)) * 100) : 0;
      
      return {
        id: p.id,
        symbol: p.symbol,
        side: p.side === 'BUY' ? 'long' : 'short',
        entryPrice: p.entry_price,
        amount: p.amount,
        unrealizedPnL: p.unrealized_pnl,
        pnlPercent,
        status: p.status,
        stopLoss: p.stop_loss || undefined,
        takeProfit: p.take_profit || undefined
      };
    });
  }

  /**
   * Get trade history
   */
  public async getTradeHistory(limit: number = 50): Promise<TradeHistory[]> {
    const trades = databaseService.getTradeHistory();
    
    return trades.slice(0, limit).map(t => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side.toLowerCase() as 'buy' | 'sell',
      price: t.price,
      amount: t.amount,
      timestamp: t.timestamp,
      fee: t.fee,
      total: t.total,
      pnl: t.pnl
    }));
  }

  /**
   * Place a new order with validation
   */
  public async placeOrder(order: Omit<Order, 'id' | 'status' | 'timestamp'>): Promise<Order> {
    // Validate order
    this.validateOrder(order);
    
    const coin = order.symbol.replace('/USDT', '');
    const cost = order.price * order.amount;
    const fee = cost * this.FEE_RATE;
    const totalCost = cost + fee;

    // Check balance
    if (order.side === 'buy') {
      const available = await this.getAvailableBalance('USDT');
      if (available < totalCost) {
        throw new Error(`Insufficient USDT balance. Available: ${available.toFixed(2)}, Required: ${totalCost.toFixed(2)}`);
      }
    } else {
      const available = await this.getAvailableBalance(coin);
      if (available < order.amount) {
        throw new Error(`Insufficient ${coin} balance. Available: ${available.toFixed(4)}, Required: ${order.amount.toFixed(4)}`);
      }
    }

    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      status: order.type === 'market' ? 'filled' : 'open',
      timestamp: Date.now(),
      filled: order.type === 'market' ? order.amount : 0,
      fee
    };

    // Execute immediately for market orders
    if (order.type === 'market') {
      await this.executeTrade(newOrder);
    } else {
      // Add to open orders for limit orders
      this.openOrders.push(newOrder);
      this.saveOrders();
      
      // Lock balance
      if (order.side === 'buy') {
        this.balances['USDT'] -= totalCost;
      } else {
        this.balances[coin] -= order.amount;
      }
      this.saveBalances();
    }

    return newOrder;
  }

  /**
   * Cancel an open order
   */
  public async cancelOrder(orderId: string): Promise<boolean> {
    const orderIndex = this.openOrders.findIndex(o => o.id === orderId && o.status === 'open');
    
    if (orderIndex === -1) {
      throw new Error('Order not found or already filled');
    }

    const order = this.openOrders[orderIndex];
    order.status = 'canceled';
    
    // Release locked balance
    const coin = order.symbol.replace('/USDT', '');
    const cost = order.price * order.amount;
    const fee = cost * this.FEE_RATE;
    
    if (order.side === 'buy') {
      this.balances['USDT'] += (cost + fee);
    } else {
      this.balances[coin] += order.amount;
    }
    
    this.saveBalances();
    this.saveOrders();
    
    return true;
  }

  /**
   * Close a position
   */
  public async closePosition(symbol: string): Promise<TradeHistory | null> {
    const positions = databaseService.getOpenPositions();
    const pos = positions.find(p => p.symbol === symbol);
    
    if (!pos) {
      throw new Error('Position not found');
    }

    // Get current market price
    let currentPrice = pos.entry_price;
    try {
      const rate = await marketService.getRate(symbol + '/USDT');
      if (rate && rate.price) {
        currentPrice = rate.price;
      }
    } catch(e) {
      console.warn('Failed to fetch current price, using entry price');
    }

    // Calculate PnL
    const pnl = (currentPrice - pos.entry_price) * pos.amount * (pos.side === 'BUY' ? 1 : -1);
    const exitValue = currentPrice * pos.amount;
    const fee = exitValue * this.FEE_RATE;
    const netPnl = pnl - fee;
    const collateral = pos.entry_price * pos.amount;
    
    // Return funds to wallet
    this.balances['USDT'] += (collateral + netPnl);
    this.saveBalances();

    // Update position in database
    databaseService.updatePosition(pos.id, { 
      status: 'CLOSED', 
      realized_pnl: netPnl,
      closed_at: Date.now()
    });
    
    // Record trade
    const tradeId = `TRD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const trade = {
      id: tradeId,
      position_id: pos.id,
      symbol: pos.symbol,
      side: (pos.side === 'BUY' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
      price: currentPrice,
      amount: pos.amount,
      fee,
      total: exitValue,
      timestamp: Date.now(),
      order_type: 'MARKET',
      strategy_id: pos.strategy_id,
      pnl: netPnl
    };

    databaseService.saveTrade(trade);
    
    return {
      id: tradeId,
      symbol,
      side: pos.side === 'BUY' ? 'sell' : 'buy',
      price: currentPrice,
      amount: pos.amount,
      timestamp: Date.now(),
      fee,
      total: exitValue,
      pnl: netPnl
    };
  }

  /**
   * Update stop loss and take profit for a position
   */
  public async updatePositionRisk(symbol: string, stopLoss?: number, takeProfit?: number): Promise<boolean> {
    const positions = databaseService.getOpenPositions();
    const pos = positions.find(p => p.symbol === symbol);
    
    if (!pos) {
      throw new Error('Position not found');
    }

    databaseService.updatePosition(pos.id, {
      stop_loss: stopLoss || 0,
      take_profit: takeProfit || 0
    });

    return true;
  }

  /**
   * Get simulated order book data
   */
  public async getOrderBook(symbol: string, depth: number = 20): Promise<{ bids: OrderBookEntry[], asks: OrderBookEntry[] }> {
    // Get current price
    let basePrice = 65000;
    try {
      const rate = await marketService.getRate(`${symbol}/USDT`);
      if (rate && rate.price) {
        basePrice = rate.price;
      }
    } catch (e) {
      // Use default
    }

    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];
    let totalBid = 0;
    let totalAsk = 0;

    for (let i = 0; i < depth; i++) {
      const spread = (i + 1) * (basePrice * 0.0003);
      const bidAmount = (basePrice > 1000 ? 0.2 : 500) * (0.5 + Math.random() * 2);
      const askAmount = (basePrice > 1000 ? 0.2 : 500) * (0.5 + Math.random() * 2);
      
      totalBid += bidAmount;
      totalAsk += askAmount;
      
      bids.push({
        price: basePrice - spread,
        amount: bidAmount,
        total: totalBid
      });
      
      asks.push({
        price: basePrice + spread,
        amount: askAmount,
        total: totalAsk
      });
    }

    return { bids, asks: asks.reverse() };
  }

  /**
   * Get recent trades
   */
  public async getRecentTrades(symbol: string, limit: number = 50): Promise<TradeHistory[]> {
    const trades = databaseService.getTradeHistory();
    
    return trades
      .filter(t => t.symbol === symbol)
      .slice(0, limit)
      .map(t => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side.toLowerCase() as 'buy' | 'sell',
        price: t.price,
        amount: t.amount,
        timestamp: t.timestamp,
        fee: t.fee,
        total: t.total
      }));
  }

  /**
   * Private: Validate order parameters
   */
  private validateOrder(order: Omit<Order, 'id' | 'status' | 'timestamp'>): void {
    if (order.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (order.type !== 'market' && order.price <= 0) {
      throw new Error('Price must be greater than 0 for limit orders');
    }
    
    if (order.type === 'stop-limit' && !order.stopPrice) {
      throw new Error('Stop price is required for stop-limit orders');
    }

    // Minimum order value check (e.g., 10 USDT)
    const minOrderValue = 10;
    const orderValue = order.price * order.amount;
    if (orderValue < minOrderValue) {
      throw new Error(`Order value must be at least ${minOrderValue} USDT`);
    }
  }

  /**
   * Private: Execute trade and update balances
   */
  private async executeTrade(order: Order): Promise<void> {
    const cost = order.price * order.amount;
    const fee = order.fee || (cost * this.FEE_RATE);
    const coin = order.symbol.replace('/USDT', '');

    if (order.side === 'buy') {
      // Deduct USDT including fee
      this.balances['USDT'] -= (cost + fee);
      // Add crypto
      this.balances[coin] = (this.balances[coin] || 0) + order.amount;
      
      // Create position in database
      const positionId = `POS-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      databaseService.savePosition({
        id: positionId,
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
        status: 'OPEN',
        closed_at: null,
        realized_pnl: 0
      });

    } else {
      // Deduct crypto
      this.balances[coin] -= order.amount;
      // Add USDT minus fee
      this.balances['USDT'] += (cost - fee);
    }

    this.saveBalances();

    // Log trade in history
    databaseService.saveTrade({
      id: order.id,
      position_id: order.id,
      symbol: coin,
      side: order.side.toUpperCase() as 'BUY' | 'SELL',
      price: order.price,
      amount: order.amount,
      fee,
      total: cost,
      timestamp: Date.now(),
      order_type: order.type.toUpperCase(),
      strategy_id: 'MANUAL'
    });
  }

  /**
   * Check and execute pending limit orders (called periodically)
   */
  public async checkLimitOrders(): Promise<void> {
    for (const order of this.openOrders) {
      if (order.status !== 'open') continue;

      try {
        const coin = order.symbol.replace('/USDT', '');
        const rate = await marketService.getRate(`${coin}/USDT`);
        
        if (!rate || !rate.price) continue;

        const currentPrice = rate.price;
        let shouldExecute = false;

        if (order.type === 'limit') {
          if (order.side === 'buy' && currentPrice <= order.price) {
            shouldExecute = true;
          } else if (order.side === 'sell' && currentPrice >= order.price) {
            shouldExecute = true;
          }
        } else if (order.type === 'stop-limit' && order.stopPrice) {
          if (order.side === 'buy' && currentPrice >= order.stopPrice) {
            shouldExecute = true;
          } else if (order.side === 'sell' && currentPrice <= order.stopPrice) {
            shouldExecute = true;
          }
        }

        if (shouldExecute) {
          order.status = 'filled';
          order.filled = order.amount;
          await this.executeTrade(order);
          this.saveOrders();
        }
      } catch (e) {
        console.error('Error checking limit order:', e);
      }
    }
  }
}

export const tradingService = new TradingService();
