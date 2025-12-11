
declare const window: any;

const DB_NAME = 'crypto_platform.db';
const SQL_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm';

export interface DBStats {
  size: number;
  tables: { name: string; count: number }[];
}

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  active: boolean;
  created_at: number;
}

class DatabaseService {
  private db: any = null;
  private SQL: any = null;
  private isInitialized = false;

  async initDatabase() {
    if (this.isInitialized) return;

    try {
      // Load sql.js
      if (!window.initSqlJs) {
        throw new Error("sql.js not loaded");
      }

      this.SQL = await window.initSqlJs({
        locateFile: () => SQL_JS_URL
      });

      // Load existing data from localStorage
      const savedData = localStorage.getItem(DB_NAME);
      if (savedData) {
        const uInt8Array = new Uint8Array(
          atob(savedData).split('').map(c => c.charCodeAt(0))
        );
        this.db = new this.SQL.Database(uInt8Array);
      } else {
        this.db = new this.SQL.Database();
        this.createTables();
      }

      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  }

  createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        symbol TEXT,
        side TEXT,
        entry_price REAL,
        amount REAL,
        current_price REAL,
        unrealized_pnl REAL,
        stop_loss REAL,
        take_profit REAL,
        strategy_id TEXT,
        opened_at INTEGER,
        status TEXT,
        closed_at INTEGER,
        realized_pnl REAL
      );`,
      `CREATE TABLE IF NOT EXISTS trade_history (
        id TEXT PRIMARY KEY,
        position_id TEXT,
        symbol TEXT,
        side TEXT,
        price REAL,
        amount REAL,
        fee REAL,
        total REAL,
        timestamp INTEGER,
        order_type TEXT,
        strategy_id TEXT,
        FOREIGN KEY(position_id) REFERENCES positions(id)
      );`,
      `CREATE TABLE IF NOT EXISTS market_data_cache (
        symbol TEXT PRIMARY KEY,
        price REAL,
        volume_24h REAL,
        change_24h REAL,
        market_cap REAL,
        data TEXT,
        updated_at INTEGER,
        expires_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS ohlcv_cache (
        id TEXT PRIMARY KEY,
        symbol TEXT,
        interval TEXT,
        timestamp INTEGER,
        open REAL,
        high REAL,
        low REAL,
        close REAL,
        volume REAL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_ohlcv ON ohlcv_cache(symbol, interval, timestamp);`,
      `CREATE TABLE IF NOT EXISTS signals_history (
        id TEXT PRIMARY KEY,
        symbol TEXT,
        signal_type TEXT,
        confidence REAL,
        entry_price REAL,
        target_price REAL,
        stop_loss REAL,
        reasoning TEXT,
        created_at INTEGER,
        status TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS api_cache (
        endpoint TEXT PRIMARY KEY,
        response TEXT,
        cached_at INTEGER,
        ttl INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        symbol TEXT,
        condition TEXT,
        price REAL,
        active INTEGER,
        created_at INTEGER
      );`
    ];

    queries.forEach(query => this.db.run(query));
    this.saveToStorage();
  }

  saveToStorage() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const binaryString = Array.from(data)
        .map((byte: any) => String.fromCharCode(byte))
        .join('');
      localStorage.setItem(DB_NAME, btoa(binaryString));
    } catch (e) {
      console.error('Failed to save database to storage:', e);
    }
  }

  // --- API Cache ---

  cacheApiResponse(endpoint: string, data: any, ttlSeconds: number) {
    if (!this.db) return;
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO api_cache (endpoint, response, cached_at, ttl)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([endpoint, JSON.stringify(data), now, ttlSeconds]);
    stmt.free();
  }

  getCachedResponse<T>(endpoint: string): T | null {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT response, cached_at, ttl FROM api_cache WHERE endpoint = ?");
    const result = stmt.getAsObject([endpoint]);
    stmt.free();

    if (result && result.response) {
      const now = Date.now();
      const expiry = result.cached_at + (result.ttl * 1000);
      if (now < expiry) {
        return JSON.parse(result.response);
      } else {
        // Cleanup expired
        this.db.run("DELETE FROM api_cache WHERE endpoint = ?", [endpoint]);
      }
    }
    return null;
  }

  clearExpiredCache() {
    if (!this.db) return;
    const now = Date.now();
    this.db.run("DELETE FROM api_cache WHERE (cached_at + (ttl * 1000)) < ?", [now]);
    this.db.run("DELETE FROM market_data_cache WHERE expires_at < ?", [now]);
    this.saveToStorage();
  }

  // --- Positions ---

  savePosition(position: any) {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO positions (
        id, symbol, side, entry_price, amount, current_price, unrealized_pnl,
        stop_loss, take_profit, strategy_id, opened_at, status, closed_at, realized_pnl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      position.id, position.symbol, position.side, position.entry_price, position.amount,
      position.current_price, position.unrealized_pnl, position.stop_loss, position.take_profit,
      position.strategy_id, position.opened_at, position.status, position.closed_at, position.realized_pnl
    ]);
    stmt.free();
    this.saveToStorage();
  }

  getOpenPositions(): any[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM positions WHERE status = 'OPEN'");
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  updatePosition(id: string, updates: Record<string, any>) {
    if (!this.db) return;
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    if (fields.length === 0) return;

    const stmt = this.db.prepare(`UPDATE positions SET ${fields} WHERE id = ?`);
    stmt.run([...values, id]);
    stmt.free();
    this.saveToStorage();
  }

  // --- Trade History ---

  saveTrade(trade: any) {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT INTO trade_history (
        id, position_id, symbol, side, price, amount, fee, total, timestamp, order_type, strategy_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      trade.id, trade.position_id, trade.symbol, trade.side, trade.price, trade.amount,
      trade.fee, trade.total, trade.timestamp, trade.order_type, trade.strategy_id
    ]);
    stmt.free();
    this.saveToStorage();
  }

  getTradeHistory(): any[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM trade_history ORDER BY timestamp DESC");
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  // --- Signals ---

  saveSignal(signal: any) {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO signals_history (
        id, symbol, signal_type, confidence, entry_price, target_price, stop_loss, reasoning, created_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      signal.id, signal.symbol, signal.type, signal.confidence, signal.entry_price,
      signal.target_price, signal.stop_loss, signal.reasoning, Date.now(), 'ACTIVE'
    ]);
    stmt.free();
    this.saveToStorage();
  }

  getSignals(): any[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM signals_history ORDER BY created_at DESC LIMIT 50");
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  // --- Alerts ---

  saveAlert(alert: PriceAlert) {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO alerts (id, symbol, condition, price, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([alert.id, alert.symbol, alert.condition, alert.price, alert.active ? 1 : 0, alert.created_at]);
    stmt.free();
    this.saveToStorage();
  }

  getAlerts(): PriceAlert[] {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM alerts ORDER BY created_at DESC");
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push({
        ...row,
        active: row.active === 1
      });
    }
    stmt.free();
    return rows;
  }

  deleteAlert(id: string) {
    if (!this.db) return;
    this.db.run("DELETE FROM alerts WHERE id = ?", [id]);
    this.saveToStorage();
  }

  // --- Utilities ---

  getStats(): DBStats {
    if (!this.db) return { size: 0, tables: [] };
    
    try {
      // Estimate size
      const data = this.db.export();
      const size = data.length;

      const tables = ['positions', 'trade_history', 'market_data_cache', 'ohlcv_cache', 'signals_history', 'api_cache', 'alerts'];
      const stats = tables.map(table => {
        try {
          const stmt = this.db.prepare(`SELECT count(*) as count FROM ${table}`);
          const res = stmt.getAsObject();
          stmt.free();
          return { name: table, count: res.count as number };
        } catch (e) {
          return { name: table, count: 0 };
        }
      });

      return { size, tables: stats };
    } catch (e) {
      return { size: 0, tables: [] };
    }
  }

  clearAllData() {
    if (!this.db) return;
    this.db.close();
    this.db = new this.SQL.Database();
    this.createTables();
    localStorage.removeItem(DB_NAME);
  }
}

export const databaseService = new DatabaseService();
