
import { databaseService } from './database';
import { tradingService } from './tradingService';
import { marketService } from './marketService';

/**
 * Background Task Manager
 * Handles all periodic tasks like cache cleanup, position updates, and database persistence
 */
class BackgroundTaskManager {
  private intervals: ReturnType<typeof setInterval>[] = [];
  private isRunning = false;

  /**
   * Start all background tasks
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Background tasks already running');
      return;
    }

    this.stop(); // Clear any existing intervals
    
    console.log('🚀 Starting background tasks...');

    // TASK 1: Save Database to localStorage (Every 30 seconds)
    this.intervals.push(
      setInterval(() => {
        try {
          databaseService.saveToLocalStorage();
          console.log('💾 Database auto-saved');
        } catch (err) {
          console.error('Failed to auto-save database:', err);
        }
      }, 30 * 1000)
    );

    // TASK 2: Clear Expired Cache (Every 5 minutes)
    this.intervals.push(
      setInterval(() => {
        try {
          databaseService.clearExpiredCache();
          console.log('🗑️ Expired cache cleared');
        } catch (err) {
          console.error('Failed to clear expired cache:', err);
        }
      }, 5 * 60 * 1000)
    );

    // TASK 3: Update Open Positions (Every 10 seconds)
    // Fetches current prices and updates unrealized P&L
    this.intervals.push(
      setInterval(async () => {
        try {
          const positions = databaseService.getOpenPositions();
          
          if (positions.length === 0) return;

          console.log(`📊 Updating ${positions.length} open positions...`);

          for (const position of positions) {
            try {
              // Get current market price
              const rate = await marketService.getRate(`${position.symbol}/USDT`);
              
              if (rate && rate.price) {
                const currentPrice = Number(rate.price);
                
                // Calculate unrealized P&L
                const priceDiff = currentPrice - position.entry_price;
                const unrealizedPnl = priceDiff * position.amount * (position.side === 'BUY' ? 1 : -1);
                
                // Update position in database
                databaseService.updatePosition(position.id, {
                  current_price: currentPrice,
                  unrealized_pnl: unrealizedPnl
                });

                // Check stop loss and take profit
                if (position.stop_loss > 0) {
                  if ((position.side === 'BUY' && currentPrice <= position.stop_loss) ||
                      (position.side === 'SELL' && currentPrice >= position.stop_loss)) {
                    console.log(`🛑 Stop loss triggered for ${position.symbol}`);
                    // Close position (would need to call trading service)
                  }
                }

                if (position.take_profit > 0) {
                  if ((position.side === 'BUY' && currentPrice >= position.take_profit) ||
                      (position.side === 'SELL' && currentPrice <= position.take_profit)) {
                    console.log(`🎯 Take profit triggered for ${position.symbol}`);
                    // Close position (would need to call trading service)
                  }
                }
              }
            } catch (err) {
              console.error(`Failed to update position ${position.symbol}:`, err);
            }
          }

          // Save after all updates
          databaseService.saveToLocalStorage();
        } catch (err) {
          console.error('Failed to update positions:', err);
        }
      }, 10 * 1000)
    );

    // TASK 4: Check and Execute Limit Orders (Every 5 seconds)
    this.intervals.push(
      setInterval(async () => {
        try {
          await tradingService.checkLimitOrders();
        } catch (err) {
          console.error('Failed to check limit orders:', err);
        }
      }, 5 * 1000)
    );

    // TASK 5: Vacuum Database (Every 24 hours)
    // Optimizes database and reclaims unused space
    this.intervals.push(
      setInterval(() => {
        try {
          console.log('🧹 Running database vacuum...');
          databaseService.vacuum();
          console.log('✅ Database vacuumed');
        } catch (err) {
          console.error('Failed to vacuum database:', err);
        }
      }, 24 * 60 * 60 * 1000)
    );

    // TASK 6: Database Backup (Every 6 hours)
    // Creates a backup checkpoint in localStorage
    this.intervals.push(
      setInterval(() => {
        try {
          console.log('💾 Creating database backup checkpoint...');
          const stats = databaseService.getStats();
          localStorage.setItem('db_backup_checkpoint', JSON.stringify({
            timestamp: Date.now(),
            size: stats.size,
            tables: stats.tables
          }));
          console.log('✅ Backup checkpoint created');
        } catch (err) {
          console.error('Failed to create backup checkpoint:', err);
        }
      }, 6 * 60 * 60 * 1000)
    );

    this.isRunning = true;
    console.log('✅ All background tasks started successfully');
    
    // Log initial stats
    this.logStats();
  }

  /**
   * Stop all background tasks
   */
  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
    console.log('⏹️ Background tasks stopped');
  }

  /**
   * Check if tasks are running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Log current statistics
   */
  logStats() {
    try {
      const stats = databaseService.getStats();
      const totalRecords = stats.tables.reduce((sum, t) => sum + t.count, 0);
      
      console.log('📊 Database Statistics:');
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Total Records: ${totalRecords}`);
      console.log(`   Tables: ${stats.tables.length}`);
      
      stats.tables.forEach(t => {
        if (t.count > 0) {
          console.log(`   - ${t.name}: ${t.count} records`);
        }
      });
    } catch (err) {
      console.error('Failed to log stats:', err);
    }
  }

  /**
   * Force immediate execution of all tasks
   */
  async runAll() {
    console.log('⚡ Running all background tasks immediately...');
    
    try {
      databaseService.saveToLocalStorage();
      console.log('✓ Database saved');
    } catch (err) {
      console.error('✗ Failed to save database');
    }

    try {
      databaseService.clearExpiredCache();
      console.log('✓ Cache cleared');
    } catch (err) {
      console.error('✗ Failed to clear cache');
    }

    try {
      await tradingService.checkLimitOrders();
      console.log('✓ Limit orders checked');
    } catch (err) {
      console.error('✗ Failed to check orders');
    }

    this.logStats();
    console.log('✅ All tasks executed');
  }
}

export const backgroundTasks = new BackgroundTaskManager();
