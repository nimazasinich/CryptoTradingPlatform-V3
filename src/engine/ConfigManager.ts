import scoringConfig from '../config/scoring.config.json';
import strategyConfig from '../config/strategy.config.json';
import riskConfig from '../config/risk.config.json';

export class ConfigManager {
  private static instance: ConfigManager;
  private configs: Map<string, any> = new Map();
  private lastReload: number = Date.now();
  private reloadInterval: number = 30000; // 30 seconds
  private autoReloadTimer?: NodeJS.Timeout;
  
  private constructor() {
    this.loadConfigs();
    this.startAutoReload();
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  private loadConfigs() {
    this.configs.set('scoring', scoringConfig);
    this.configs.set('strategy', strategyConfig);
    this.configs.set('risk', riskConfig);
    console.log('✅ Configs loaded');
  }
  
  private startAutoReload() {
    this.autoReloadTimer = setInterval(() => {
      this.loadConfigs();
      this.lastReload = Date.now();
      console.log(`🔄 Configs reloaded at ${new Date(this.lastReload).toISOString()}`);
    }, this.reloadInterval);
  }
  
  stopAutoReload() {
    if (this.autoReloadTimer) {
      clearInterval(this.autoReloadTimer);
      this.autoReloadTimer = undefined;
    }
  }
  
  get<T>(configName: string): T {
    const config = this.configs.get(configName);
    if (!config) {
      throw new Error(`Config '${configName}' not found`);
    }
    return config as T;
  }
  
  getDetectorWeights() {
    return this.get<typeof scoringConfig>('scoring').detectorWeights;
  }
  
  getStrategyConfig() {
    return this.get<typeof strategyConfig>('strategy');
  }
  
  getRiskConfig() {
    return this.get<typeof riskConfig>('risk');
  }
  
  getThresholds() {
    return this.get<typeof scoringConfig>('scoring').thresholds;
  }
  
  getLastReloadTime(): Date {
    return new Date(this.lastReload);
  }
  
  forceReload() {
    this.loadConfigs();
    this.lastReload = Date.now();
    console.log('🔄 Manual config reload triggered');
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
