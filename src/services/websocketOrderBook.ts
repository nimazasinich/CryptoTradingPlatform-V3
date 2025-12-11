/**
 * WebSocket Order Book Service
 * Connects to Binance WebSocket API for real-time order book data
 */

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
  percent: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdate: number;
}

type OrderBookCallback = (data: OrderBookData) => void;

class WebSocketOrderBookService {
  private ws: WebSocket | null = null;
  private callbacks: Set<OrderBookCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentSymbol: string = '';
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Connect to order book WebSocket stream
   */
  connect(symbol: string): void {
    if (this.isConnecting) return;
    
    this.currentSymbol = symbol.toLowerCase();
    this.isConnecting = true;
    this.reconnectAttempts = 0;

    this.establishConnection();
  }

  /**
   * Establish WebSocket connection
   */
  private establishConnection(): void {
    try {
      // Use Binance public WebSocket (no auth required)
      const wsUrl = `wss://stream.binance.com:9443/ws/${this.currentSymbol}usdt@depth20@100ms`;
      
      console.log(`🔌 Connecting to order book WebSocket: ${this.currentSymbol.toUpperCase()}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`✅ Order book WebSocket connected: ${this.currentSymbol.toUpperCase()}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Start ping/pong to keep connection alive
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.processOrderBookUpdate(data);
        } catch (error) {
          console.error('Failed to parse order book data:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('🔌 Order book WebSocket closed');
        this.isConnecting = false;
        this.stopPing();
        
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.establishConnection();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
        }
      };

    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Process order book update from WebSocket
   */
  private processOrderBookUpdate(data: any): void {
    if (!data || !data.bids || !data.asks) return;

    try {
      // Parse bids (buy orders)
      const bids: OrderBookLevel[] = data.bids
        .slice(0, 15) // Take top 15 levels
        .map(([price, amount]: [string, string]) => ({
          price: parseFloat(price),
          amount: parseFloat(amount),
          total: 0,
          percent: 0
        }));

      // Parse asks (sell orders)
      const asks: OrderBookLevel[] = data.asks
        .slice(0, 15) // Take top 15 levels
        .map(([price, amount]: [string, string]) => ({
          price: parseFloat(price),
          amount: parseFloat(amount),
          total: 0,
          percent: 0
        }));

      // Calculate cumulative totals and percentages
      let bidTotal = 0;
      bids.forEach(bid => {
        bidTotal += bid.amount;
        bid.total = bidTotal;
      });

      let askTotal = 0;
      asks.forEach(ask => {
        askTotal += ask.amount;
        ask.total = askTotal;
      });

      // Calculate depth percentages
      bids.forEach(bid => {
        bid.percent = (bid.total / bidTotal) * 100;
      });

      asks.forEach(ask => {
        ask.percent = (ask.total / askTotal) * 100;
      });

      // Notify all subscribers
      const orderBookData: OrderBookData = {
        bids,
        asks: asks.reverse(), // Show from highest to lowest
        lastUpdate: Date.now()
      };

      this.callbacks.forEach(callback => {
        try {
          callback(orderBookData);
        } catch (error) {
          console.error('Error in order book callback:', error);
        }
      });

    } catch (error) {
      console.error('Error processing order book update:', error);
    }
  }

  /**
   * Start ping to keep connection alive
   */
  private startPing(): void {
    this.stopPing();
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Binance doesn't require explicit ping, but we can send a dummy message
        // The connection will stay alive as long as we're receiving data
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Subscribe to order book updates
   */
  subscribe(callback: OrderBookCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.stopPing();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.currentSymbol = '';
    console.log('🔌 Order book WebSocket disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current symbol
   */
  getCurrentSymbol(): string {
    return this.currentSymbol;
  }
}

export const wsOrderBook = new WebSocketOrderBookService();
