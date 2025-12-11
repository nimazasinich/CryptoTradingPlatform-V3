
declare const window: any;

const DB_NAME = 'crypto_platform.db';
const SQL_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm';

export interface DBStats {
  size: number;
  tables: { name: string; count: number }[];
  lastSaved?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entry_price: number;
  amount: number;
  current_price: number;
  unrealized_pnl: number;
  stop_loss: number;
  take_profit: number;
  strategy_id: string;
  opened_at: number;
  status: 'OPEN' | 'CLOSED';
  closed_at: number | null;
  realized_pnl: number;
}

export interface Trade {
  id: string;
  position_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  fee: number;
  total: number;
  timestamp: number;
  order_type: string;
  strategy_id: string;
}

export interface Signal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
  created_at: number;
  status: 'ACTIVE' | 'EXECUTED' | 'EXPIRED';
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  conditions: string; // JSON string
  risk_management: string; // JSON string
  performance_stats: string; // JSON string
  created_at: number;
  is_active: boolean;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  active: boolean;
  created_at: number;
}

/**
 * SQLite Database Service for Crypto Trading Platform
 * Implements complete data persistence with caching, transactions, and optimization
 */
class DatabaseService {
  private db: any = null;
  private SQL: any = null;
  private isInitialized = false;
  private lastSaved: number = 0;
  private transactionActive = false;

  /**
   * Initialize SQLite database
   * Loads sql.js and creates/loads database from localStorage
   */
  async initDatabase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load sql.js library
      if (!window.initSqlJs) {
        throw new Error("sql.js not loaded. Make sure it's included in index.html");
      }

      this.SQL = await window.initSqlJs({
        locateFile: () => SQL_JS_URL
      });

      // Try to load existing database from localStorage
      await this.loadFromLocalStorage();

      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize database:', err);
      throw err;
    }
  }

  /**
   * Create all required tables with proper schema and indexes
   */
  createTables(): void {
    if (!this.db) return;

    const tables = [
      // Positions table - tracks all trading positions
      `CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        entry_price REAL NOT NULL,
        amount REAL NOT NULL,
        current_price REAL NOT NULL,
        unrealized_pnl REAL DEFAULT 0,
        stop_loss REAL DEFAULT 0,
        take_profit REAL DEFAULT 0,
        strategy_id TEXT,
        opened_at INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN',
        closed_at INTEGER,
        realized_pnl REAL DEFAULT 0
      )`,
      
      // Trade history table - records all executed trades
      `CREATE TABLE IF NOT EXISTS trade_history (
        id TEXT PRIMARY KEY,
        position_id TEXT,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        price REAL NOT NULL,
        amount REAL NOT NULL,
        fee REAL DEFAULT 0,
        total REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        order_type TEXT,
        strategy_id TEXT,
        FOREIGN KEY(position_id) REFERENCES positions(id)
      )`,
      
      // Market data cache - stores latest market data for coins
      `CREATE TABLE IF NOT EXISTS market_data_cache (
        symbol TEXT PRIMARY KEY,
        price REAL,
        volume_24h REAL,
        change_24h REAL,
        market_cap REAL,
        data TEXT,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )`,
      
      // OHLCV cache - stores candlestick data for charts
      `CREATE TABLE IF NOT EXISTS ohlcv_cache (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        interval TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        volume REAL NOT NULL
      )`,
      
      // Signals history - AI-generated trading signals
      `CREATE TABLE IF NOT EXISTS signals_history (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        signal_type TEXT NOT NULL,
        confidence REAL NOT NULL,
        entry_price REAL NOT NULL,
        target_price REAL,
        stop_loss REAL,
        reasoning TEXT,
        created_at INTEGER NOT NULL,
        status TEXT DEFAULT 'ACTIVE'
      )`,
      
      // Strategies - user-defined or AI trading strategies
      `CREATE TABLE IF NOT EXISTS strategies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        conditions TEXT,
        risk_management TEXT,
        performance_stats TEXT,
        created_at INTEGER NOT NULL,
        is_active INTEGER DEFAULT 0
      )`,
      
      // Generic API cache - caches any API endpoint response
      `CREATE TABLE IF NOT EXISTS api_cache (
        endpoint TEXT PRIMARY KEY,
        response TEXT NOT NULL,
        cached_at INTEGER NOT NULL,
        ttl INTEGER NOT NULL
      )`,
      
      // Price alerts - user-configured price notifications
      `CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        condition TEXT NOT NULL,
        price REAL NOT NULL,
        active INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL
      )`
    ];

    // Create all tables
    tables.forEach(query => {
      try {
        this.db.run(query);
      } catch (err) {
        console.error('Error creating table:', err);
      }
    });

    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status)',
      'CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol)',
      'CREATE INDEX IF NOT EXISTS idx_trade_history_position ON trade_history(position_id)',
      'CREATE INDEX IF NOT EXISTS idx_trade_history_timestamp ON trade_history(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_ohlcv_lookup ON ohlcv_cache(symbol, interval, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_signals_status ON signals_history(status)',
      'CREATE INDEX IF NOT EXISTS idx_signals_created ON signals_history(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_strategies_active ON strategies(is_active)'
    ];

    indexes.forEach(query => {
      try {
        this.db.run(query);
      } catch (err) {
        console.error('Error creating index:', err);
      }
    });

    console.log('✅ All tables and indexes created');
  }

  /**
   * Save database to localStorage
   */
  saveToLocalStorage(): void {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      const binaryString = Array.from(data)
        .map((byte: any) => String.fromCharCode(byte))
        .join('');
      localStorage.setItem(DB_NAME, btoa(binaryString));
      this.lastSaved = Date.now();
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  /**
   * Load database from localStorage
   */
  async loadFromLocalStorage(): Promise<void> {
    try {
      const savedData = localStorage.getItem(DB_NAME);
      
      if (savedData) {
        const uInt8Array = new Uint8Array(
          atob(savedData).split('').map(c => c.charCodeAt(0))
        );
        this.db = new this.SQL.Database(uInt8Array);
        console.log('✅ Database loaded from localStorage');
      } else {
        // Create new database
        this.db = new this.SQL.Database();
        this.createTables();
        console.log('✅ New database created');
      }
    } catch (err) {
      console.error('Failed to load database:', err);
      // Create new database on error
      this.db = new this.SQL.Database();
      this.createTables();
    }
  }

  /**
   * Vacuum database to optimize and reclaim space
   */
  vacuum(): void {
    if (!this.db) return;
    try {
      this.db.run('VACUUM');
      this.saveToLocalStorage();
      console.log('✅ Database vacuumed');
    } catch (err) {
      console.error('Failed to vacuum database:', err);
    }
  }

  // ========================================
  // TRANSACTION SUPPORT
  // ========================================

  /**
   * Begin a transaction
   */
  beginTransaction(): void {
    if (!this.db || this.transactionActive) return;
    this.db.run('BEGIN TRANSACTION');
    this.transactionActive = true;
  }

  /**
   * Commit current transaction
   */
  commit(): void {
    if (!this.db || !this.transactionActive) return;
    this.db.run('COMMIT');
    this.transactionActive = false;
    this.saveToLocalStorage();
  }

  /**
   * Rollback current transaction
   */
  rollback(): void {
    if (!this.db || !this.transactionActive) return;
    this.db.run('ROLLBACK');
    this.transactionActive = false;
  }

  // ========================================
  // POSITIONS MANAGEMENT
  // ========================================

  /**
   * Save a new position or update existing
   */
  savePosition(position: Position): void {
    if (!this.db) return;
    
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO positions (
          id, symbol, side, entry_price, amount, current_price, unrealized_pnl,
          stop_loss, take_profit, strategy_id, opened_at, status, closed_at, realized_pnl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        position.id,
        position.symbol,
        position.side,
        position.entry_price,
        position.amount,
        position.current_price,
        position.unrealized_pnl,
        position.stop_loss || 0,
        position.take_profit || 0,
        position.strategy_id || 'MANUAL',
        position.opened_at,
        position.status,
        position.closed_at,
        position.realized_pnl || 0
      ]);
      
      stmt.free();
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error saving position:', err);
    }
  }

  /**
   * Update position fields
   */
  updatePosition(id: string, updates: Partial<Position>): void {
    if (!this.db) return;
    
    const fields = Object.keys(updates)
      .filter(key => updates[key as keyof Position] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(updates)
      .filter(key => updates[key as keyof Position] !== undefined)
      .map(key => updates[key as keyof Position]);
    
    if (fields.length === 0) return;

    try {
      const stmt = this.db.prepare(`UPDATE positions SET ${fields} WHERE id = ?`);
      stmt.run([...values, id]);
      stmt.free();
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error updating position:', err);
    }
  }

  /**
   * Close a position
   */
  closePosition(id: string, exitPrice: number, pnl: number): void {
    if (!this.db) return;
    
    try {
      const stmt = this.db.prepare(`
        UPDATE positions 
        SET status = 'CLOSED', closed_at = ?, realized_pnl = ?, current_price = ?
        WHERE id = ?
      `);
      stmt.run([Date.now(), pnl, exitPrice, id]);
      stmt.free();
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error closing position:', err);
    }
  }

  /**
   * Get all open positions
   */
  getOpenPositions(): Position[] {
    if (!this.db) return [];
    
    try {
      const stmt = this.db.prepare("SELECT * FROM positions WHERE status = 'OPEN' ORDER BY opened_at DESC");
      const rows: Position[] = [];
      
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as Position);
      }
      
      stmt.free();
      return rows;
    } catch (err) {
      console.error('Error getting open positions:', err);
      return [];
    }
  }

  /**
   * Get position history with filters
   */
  getPositionHistory(filters?: {
    symbol?: string;
    status?: string;
    limit?: number;
  }): Position[] {
    if (!this.db) return [];
    
    try {
      let query = 'SELECT * FROM positions WHERE 1=1';
      const params: any[] = [];
      
      if (filters?.symbol) {
        query += ' AND symbol = ?';
        params.push(filters.symbol);
      }
      
      if (filters?.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      query += ' ORDER BY opened_at DESC';
      
      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      const stmt = this.db.prepare(query);
      const rows: Position[] = [];
      
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as Position);
      }
      
      stmt.free();
      return rows;
    } catch (err) {
      console.error('Error getting position history:', err);
      return [];
    }
  }

  // ========================================
  // TRADE HISTORY
  // ========================================

  /**
   * Save a trade to history
   */
  saveTrade(trade: Trade): void {
    if (!this.db) return;
    
    try {
      const stmt = this.db.prepare(`
        INSERT INTO trade_history (
          id, position_id, symbol, side, price, amount, fee, total, timestamp, order_type, strategy_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        trade.id,
        trade.position_id,
        trade.symbol,
        trade.side,
        trade.price,
        trade.amount,
        trade.fee || 0,
        trade.total,
        trade.timestamp,
        trade.order_type || 'MARKET',
        trade.strategy_id || 'MANUAL'
      ]);
      
      stmt.free();
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error saving trade:', err);
    }
  }

  /**
   * Get trade history with filters
   */
  getTradeHistory(filters?: {
    symbol?: string;
    limit?: number;
  }): any[] {
    if (!this.db) return [];
    
    try {
      let query = 'SELECT * FROM trade_history WHERE 1=1';
      const params: any[] = [];
      
      if (filters?.symbol) {
        query += ' AND symbol = ?';
        params.push(filters.symbol);
      }
      
      query += ' ORDER BY timestamp DESC';
      
      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      const stmt = this.db.prepare(query);
      const rows: any[] = [];
      
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      
      stmt.free();
      return rows;
    } catch (err) {
      console.error('Error getting trade history:', err);
      return [];
    }
  }

  /**
   * Get trade statistics
   */
  getTradeStats(): {
    winRate: number;
    totalPnl: number;
    avgPnl: number;
    totalFees: number;
    tradeCount: number;
  } {
    if (!this.db) return { winRate: 0, totalPnl: 0, avgPnl: 0, totalFees: 0, tradeCount: 0 };
    
    try {
      // Get closed positions
      const stmt = this.db.prepare("SELECT realized_pnl FROM positions WHERE status = 'CLOSED'");
      const pnls: number[] = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        pnls.push(Number(row.realized_pnl) || 0);
      }
      stmt.free();
      
      // Calculate stats
      const wins = pnls.filter(p => p > 0).length;
      const totalPnl = pnls.reduce((sum, p) => sum + p, 0);
      const avgPnl = pnls.length > 0 ? totalPnl / pnls.length : 0;
      const winRate = pnls.length > 0 ? (wins / pnls.length) * 100 : 0;
      
      // Get total fees
      const feeStmt = this.db.prepare("SELECT SUM(fee) as total_fees FROM trade_history");
      feeStmt.step();
      const feeRow = feeStmt.getAsObject();
      const totalFees = Number(feeRow.total_fees) || 0;
      feeStmt.free();
      
      return {
        winRate,
        totalPnl,
        avgPnl,
        totalFees,
        tradeCount: pnls.length
      };
    } catch (err) {
      console.error('Error getting trade stats:', err);
      return { winRate: 0, totalPnl: 0, avgPnl: 0, totalFees: 0, tradeCount: 0 };
    }
  }

  // ========================================
  // MARKET DATA CACHE
  // ========================================

  /**
   * Cache market data for a symbol
   */
  cacheMarketData(symbol: string, data: any, ttlSeconds: number): void {
    if (!this.db) return;
    
    try {
      const now = Date.now();
      const expiresAt = now + (ttlSeconds * 1000);
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO market_data_cache 
        (symbol, price, volume_24h, change_24h, market_cap, data, updated_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        symbol,
        data.price || data.current_price || 0,
        data.volume_24h || data.total_volume || 0,
        data.change_24h || data.price_change_percentage_24h || 0,
        data.market_cap || 0,
        JSON.stringify(data),
        now,
        expiresAt
      ]);
      
      stmt.free();
    } catch (err) {
      console.error('Error caching market data:', err);
    }
  }

  /**
   * Get cached market data
   */
  getMarketData(symbol: string): any | null {
    if (!this.db) return null;
    
    try {
      const stmt = this.db.prepare("SELECT * FROM market_data_cache WHERE symbol = ?");
      stmt.bind([symbol]);
      
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        
        // Check if expired
        if (Date.now() > row.expires_at) {
          this.db.run("DELETE FROM market_data_cache WHERE symbol = ?", [symbol]);
          return null;
        }
        
        return row.data ? JSON.parse(row.data as string) : null;
      }
      
      stmt.free();
      return null;
    } catch (err) {
      console.error('Error getting market data:', err);
      return null;
    }
  }

  /**
   * Check if cache is valid for a symbol
   */
  isCacheValid(symbol: string): boolean {
    if (!this.db) return false;
    
    try {
      const stmt = this.db.prepare("SELECT expires_at FROM market_data_cache WHERE symbol = ?");
      stmt.bind([symbol]);
      
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return Date.now() < (row.expires_at as number);
      }
      
      stmt.free();
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Clear all expired cache entries
   */
  clearExpiredCache(): void {
    if (!this.db) return;
    
    try {
      const now = Date.now();
      this.db.run("DELETE FROM api_cache WHERE (cached_at + (ttl * 1000)) < ?", [now]);
      this.db.run("DELETE FROM market_data_cache WHERE expires_at < ?", [now]);
      this.saveToLocalStorage();
      console.log('✅ Expired cache cleared');
    } catch (err) {
      console.error('Error clearing expired cache:', err);
    }
  }

  // ========================================
  // OHLCV CACHE
  // ========================================

  /**
   * Cache OHLCV candles in batch
   */
  cacheOHLCV(symbol: string, interval: string, candles: any[]): void {
    if (!this.db || candles.length === 0) return;
    
    try {
      this.beginTransaction();
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO ohlcv_cache 
        (id, symbol, interval, timestamp, open, high, low, close, volume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const candle of candles) {
        const id = `${symbol}_${interval}_${candle.timestamp || candle.t}`;
        stmt.run([
          id,
          symbol,
          interval,
          candle.timestamp || candle.t || 0,
          candle.open || candle.o || 0,
          candle.high || candle.h || 0,
          candle.low || candle.l || 0,
          candle.close || candle.c || 0,
          candle.volume || candle.v || 0
        ]);
      }
      
      stmt.free();
      this.commit();
    } catch (err) {
      console.error('Error caching OHLCV:', err);
      this.rollback();
    }
  }

  /**
   * Get cached OHLCV data
   */
  getOHLCV(symbol: string, interval: string, limit: number = 100): any[] {
    if (!this.db) return [];
    
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM ohlcv_cache 
        WHERE symbol = ? AND interval = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      
      stmt.bind([symbol, interval, limit]);
      const rows: any[] = [];
      
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      
      stmt.free();
      return rows.reverse(); // Return in chronological order
    } catch (err) {
      console.error('Error getting OHLCV:', err);
      return [];
    }
  }

  /**
   * Update the latest candle
   */
  updateLatestCandle(symbol: string, interval: string, candle: any): void {
    if (!this.db) return;
    
    try {
      const id = `${symbol}_${interval}_${candle.timestamp || candle.t}`;
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO ohlcv_cache 
        (id, symbol, interval, timestamp, open, high, low, close, volume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        id,
        symbol,
        interval,
        candle.timestamp || candle.t || Date.now(),
        candle.open || candle.o || 0,
        candle.high || candle.h || 0,
        candle.low || candle.l || 0,
        candle.close || candle.c || 0,
        candle.volume || candle.v || 0
      ]);
      
      stmt.free();
    } catch (err) {
      console.error('Error updating latest candle:', err);
    }
  }

  // ========================================
  // SIGNALS
  // ========================================

  /**
   * Save a trading signal
   */
  saveSignal(signal: Partial<Signal>): void {
    if (!this.db) return;
    
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO signals_history (
          id, symbol, signal_type, confidence, entry_price, target_price, 
          stop_loss, reasoning, created_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        signal.id || `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        signal.symbol || '',
        signal.signal_type || 'BUY',
        signal.confidence || 50,
        signal.entry_price || 0,
        signal.target_price || 0,
        signal.stop_loss || 0,
        signal.reasoning || '',
        signal.created_at || Date.now(),
        signal.status || 'ACTIVE'
      ]);
      
      stmt.free();
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error saving signal:', err);
    }
  }

  /**
   * Get active signals
   */
  getActiveSignals(): Signal[] {
    if (!this.db) return [];
    
    try {
      const stmt = this.db.prepare("SELECT * FROM signals_history WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 50");
      const rows: Signal[] = [];
      
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as Signal);
      }
      
      stmt.free();
      return rows;
    } catch (err) {
      console.error('Error getting active signals:', err);
      return [];
    }
  }

  /**
   * Mark a signal as executed
   */
  markSignalExecuted(id: string): void {
    if (!this.db) return;
    
    try {
      this.db.run("UPDATE signals_history SET status = 'EXECUTED' WHERE id = ?", [id]);
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error marking signal executed:', err);
    }
  }

  /**
   * Get signals history with filters
   */
  getSignals(filters?: { status?: string; limit?: number }): Signal[] {
    if (!this.db) return [];
    
    try {
      let query = 'SELECT * FROM signals_history WHERE 1=1';
      const params: any[] = [];
      
      if (filters?.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      } else {
        query += ' LIMIT 100';
      }
      
      const stmt = this.db.prepare(query);
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      const rows: Signal[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as Signal);
      }
      
      stmt.free();
      return rows;
    } catch (err) {
      console.error('Error getting signals:', err);
      return [];
    }
  }

  // ========================================
  // STRATEGIES
  // ========================================

  /**
   * Save a trading strategy
   */
  saveStrategy(strategy: Partial<Strategy>): void {
    if (!this.db) return;
    
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO strategies (
          id, name, description, conditions, risk_management, 
          performance_stats, created_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        strategy.id || `STRAT-${Date.now()}`,
        strategy.name || 'Unnamed Strategy',
        strategy.description || '',
        strategy.conditions || '{}',
        strategy.risk_management || '{}',
        strategy.performance_stats || '{}',
        strategy.created_at || Date.now(),
        strategy.is_active ? 1 : 0
      ]);
      
      stmt.free();
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error saving strategy:', err);
    }
  }

  /**
   * Get all strategies
   */
  getStrategies(): Strategy[] {
    if (!this.db) return [];
    
    try {
      const stmt = this.db.prepare("SELECT * FROM strategies ORDER BY created_at DESC");
      const rows: Strategy[] = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push({
          ...row,
          is_active: Boolean(row.is_active)
        } as Strategy);
      }
      
      stmt.free();
      return rows;
    } catch (err) {
      console.error('Error getting strategies:', err);
      return [];
    }
  }

  /**
   * Get active strategy
   */
  getActiveStrategy(): Strategy | null {
    if (!this.db) return null;
    
    try {
      const stmt = this.db.prepare("SELECT * FROM strategies WHERE is_active = 1 LIMIT 1");
      
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          ...row,
          is_active: true
        } as Strategy;
      }
      
      stmt.free();
      return null;
    } catch (err) {
      console.error('Error getting active strategy:', err);
      return null;
    }
  }

  /**
   * Update strategy statistics
   */
  updateStrategyStats(id: string, stats: any): void {
    if (!this.db) return;
    
    try {
      const stmt = this.db.prepare("UPDATE strategies SET performance_stats = ? WHERE id = ?");
      stmt.run([JSON.stringify(stats), id]);
      stmt.free();
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error updating strategy stats:', err);
    }
  }

  // ========================================
  // GENERIC API CACHE
  // ========================================

  /**
   * Cache API response
   */
  cacheApiResponse(endpoint: string, data: any, ttlSeconds: number): void {
    if (!this.db) return;
    
    try {
      const now = Date.now();
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO api_cache (endpoint, response, cached_at, ttl)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([endpoint, JSON.stringify(data), now, ttlSeconds]);
      stmt.free();
    } catch (err) {
      console.error('Error caching API response:', err);
    }
  }

  /**
   * Get cached API response
   */
  getCachedResponse<T>(endpoint: string): T | null {
    if (!this.db) return null;
    
    try {
      const stmt = this.db.prepare("SELECT response, cached_at, ttl FROM api_cache WHERE endpoint = ?");
      stmt.bind([endpoint]);
      
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        
        const now = Date.now();
        const expiry = (result.cached_at as number) + ((result.ttl as number) * 1000);
        
        if (now < expiry) {
          return JSON.parse(result.response as string) as T;
        } else {
          // Cleanup expired entry
          this.db.run("DELETE FROM api_cache WHERE endpoint = ?", [endpoint]);
        }
      } else {
        stmt.free();
      }
      
      return null;
    } catch (err) {
      console.error('Error getting cached response:', err);
      return null;
    }
  }

  // ========================================
  // ALERTS
  // ========================================

  /**
   * Save a price alert
   */
  saveAlert(alert: PriceAlert): void {
    if (!this.db) return;
    
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO alerts (id, symbol, condition, price, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        alert.id,
        alert.symbol,
        alert.condition,
        alert.price,
        alert.active ? 1 : 0,
        alert.created_at
      ]);
      
      stmt.free();
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error saving alert:', err);
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(): PriceAlert[] {
    if (!this.db) return [];
    
    try {
      const stmt = this.db.prepare("SELECT * FROM alerts ORDER BY created_at DESC");
      const rows: PriceAlert[] = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push({
          ...row,
          active: Boolean(row.active)
        } as PriceAlert);
      }
      
      stmt.free();
      return rows;
    } catch (err) {
      console.error('Error getting alerts:', err);
      return [];
    }
  }

  /**
   * Delete an alert
   */
  deleteAlert(id: string): void {
    if (!this.db) return;
    
    try {
      this.db.run("DELETE FROM alerts WHERE id = ?", [id]);
      this.saveToLocalStorage();
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  }

  // ========================================
  // UTILITIES
  // ========================================

  /**
   * Export database as downloadable file
   */
  exportDatabase(): Blob | null {
    if (!this.db) return null;
    
    try {
      const data = this.db.export();
      return new Blob([data], { type: 'application/octet-stream' });
    } catch (err) {
      console.error('Error exporting database:', err);
      return null;
    }
  }

  /**
   * Import database from file
   */
  async importDatabase(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uInt8Array = new Uint8Array(arrayBuffer);
          
          // Close current database
          if (this.db) {
            this.db.close();
          }
          
          // Load new database
          this.db = new this.SQL.Database(uInt8Array);
          this.saveToLocalStorage();
          
          console.log('✅ Database imported successfully');
          resolve();
        } catch (err) {
          console.error('Error importing database:', err);
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Clear all data and recreate tables
   */
  clearAllData(): void {
    if (!this.db) return;
    
    try {
      // Drop all tables
      const tables = ['positions', 'trade_history', 'market_data_cache', 'ohlcv_cache', 
                      'signals_history', 'strategies', 'api_cache', 'alerts'];
      
      tables.forEach(table => {
        try {
          this.db.run(`DROP TABLE IF EXISTS ${table}`);
        } catch (err) {
          console.error(`Error dropping table ${table}:`, err);
        }
      });
      
      // Recreate tables
      this.createTables();
      
      // Save to storage
      this.saveToLocalStorage();
      
      console.log('✅ All data cleared and tables recreated');
    } catch (err) {
      console.error('Error clearing data:', err);
    }
  }

  /**
   * Get database statistics
   */
  getStats(): DBStats {
    if (!this.db) return { size: 0, tables: [], lastSaved: 0 };
    
    try {
      // Get database size
      const data = this.db.export();
      const size = data.length;
      
      // Get table counts
      const tables = ['positions', 'trade_history', 'market_data_cache', 'ohlcv_cache', 
                      'signals_history', 'strategies', 'api_cache', 'alerts'];
      
      const stats = tables.map(table => {
        try {
          const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
          stmt.step();
          const res = stmt.getAsObject();
          stmt.free();
          return { name: table, count: res.count as number };
        } catch (err) {
          return { name: table, count: 0 };
        }
      });
      
      return {
        size,
        tables: stats,
        lastSaved: this.lastSaved
      };
    } catch (err) {
      console.error('Error getting stats:', err);
      return { size: 0, tables: [], lastSaved: 0 };
    }
  }

  /**
   * List all tables in database
   */
  listTables(): string[] {
    if (!this.db) return [];
    
    try {
      const stmt = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
      const tables: string[] = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        tables.push(row.name as string);
      }
      
      stmt.free();
      return tables;
    } catch (err) {
      console.error('Error listing tables:', err);
      return [];
    }
  }
}

export const databaseService = new DatabaseService();
