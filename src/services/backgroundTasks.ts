
import { databaseService } from './database';

class BackgroundTaskManager {
  private intervals: ReturnType<typeof setInterval>[] = [];

  start() {
    this.stop(); // Clear existing

    // 1. Save Database Periodically (Every 30s)
    this.intervals.push(
      setInterval(() => {
        databaseService.saveToStorage();
      }, 30000)
    );

    // 2. Clear Expired Cache (Every 5m)
    this.intervals.push(
      setInterval(() => {
        databaseService.clearExpiredCache();
      }, 5 * 60 * 1000)
    );

    console.log('Background tasks started');
  }

  stop() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }
}

export const backgroundTasks = new BackgroundTaskManager();
