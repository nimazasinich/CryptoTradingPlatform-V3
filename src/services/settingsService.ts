
import { HttpClient } from './httpClient';

const STORAGE_KEY = 'crypto_settings_v1';

// Mock Encryption (In a real app, this would use a backend or proper encryption lib)
const encrypt = (text: string) => `enc_${btoa(text)}`;
const decrypt = (text: string) => text.startsWith('enc_') ? atob(text.slice(4)) : text;

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  passwordHash?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: 'huggingface' | 'openai' | 'custom';
  permissions: string[];
  created: number;
}

export interface ExchangeConnection {
  id: string;
  exchange: string;
  apiKey: string;
  apiSecret: string;
  permissions: ('read' | 'trade' | 'withdraw')[];
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: number;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifications: {
    signals: boolean;
    alerts: boolean;
    dailyDigest: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
  minConfidence: number;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  currency: string;
  language: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    tradeExecutions: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  soundEnabled: boolean;
  dataSource: {
    refreshRateMarket: number;
    refreshRateNews: number;
    refreshRateSentiment: number;
    hfToken?: string;
  };
}

const DEFAULT_SETTINGS = {
  profile: {
    name: 'Admin User',
    username: 'cryptotrader',
    email: 'admin@crypto.one',
    bio: 'Professional crypto trader and analyst.',
    twoFactorEnabled: false,
    // Default hash for 'password'
    passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  },
  apiKeys: [],
  exchanges: [],
  telegram: {
    enabled: false,
    botToken: '',
    chatId: '',
    notifications: { signals: true, alerts: true, dailyDigest: false },
    frequency: 'immediate',
    minConfidence: 75
  },
  preferences: {
    theme: 'dark',
    currency: 'USD',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    notifications: { email: true, push: true, priceAlerts: true, tradeExecutions: true },
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
    soundEnabled: true,
    dataSource: { 
      refreshRateMarket: 30, 
      refreshRateNews: 300, 
      refreshRateSentiment: 3600,
      hfToken: '' 
    }
  }
};

class SettingsService {
  private state: any;

  constructor() {
    this.load();
  }

  private load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    this.state = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  // --- Security Helpers ---
  public async hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- Profile ---
  public async getProfile(): Promise<UserProfile> {
    return { ...this.state.profile };
  }

  public async saveProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise(r => setTimeout(r, 500)); // Sim latency
    this.state.profile = { ...this.state.profile, ...data };
    this.save();
    return this.state.profile;
  }

  public async uploadAvatar(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error("File too large (max 2MB)"));
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  public async changePassword(current: string, newPass: string): Promise<boolean> {
    const currentHash = await this.hashPassword(current);
    if (currentHash !== this.state.profile.passwordHash) {
      throw new Error("Incorrect current password");
    }
    const newHash = await this.hashPassword(newPass);
    this.state.profile.passwordHash = newHash;
    this.save();
    return true;
  }

  // --- API Keys ---
  public async getApiKeys(): Promise<ApiKey[]> {
    return [...this.state.apiKeys];
  }

  public async saveApiKey(name: string, key: string, provider: 'custom' | 'huggingface' = 'custom'): Promise<ApiKey> {
    await new Promise(r => setTimeout(r, 600));
    const newKey: ApiKey = {
      id: Math.random().toString(36).substring(7),
      name,
      key: encrypt(key),
      provider,
      permissions: ['read'],
      created: Date.now()
    };
    this.state.apiKeys.push(newKey);
    this.save();
    return newKey;
  }

  public async deleteApiKey(id: string) {
    this.state.apiKeys = this.state.apiKeys.filter((k: ApiKey) => k.id !== id);
    this.save();
  }

  public async testApiConnection(key: string, provider: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 1500));
    // Mock validation logic
    if (!key || key.length < 10) throw new Error("Invalid API Key format");
    return true;
  }

  // --- Exchanges ---
  public async getExchanges(): Promise<ExchangeConnection[]> {
    return [...this.state.exchanges];
  }

  public async connectExchange(exchange: string, apiKey: string, apiSecret: string): Promise<ExchangeConnection> {
    await new Promise(r => setTimeout(r, 1200));
    if (apiKey.length < 5 || apiSecret.length < 5) throw new Error("Invalid credentials");

    const conn: ExchangeConnection = {
      id: exchange.toLowerCase(),
      exchange,
      apiKey: encrypt(apiKey),
      apiSecret: encrypt(apiSecret),
      permissions: ['read', 'trade'],
      status: 'connected',
      lastChecked: Date.now()
    };

    // Update or add
    const idx = this.state.exchanges.findIndex((e: ExchangeConnection) => e.id === conn.id);
    if (idx >= 0) this.state.exchanges[idx] = conn;
    else this.state.exchanges.push(conn);
    
    this.save();
    return conn;
  }

  public async disconnectExchange(id: string) {
    this.state.exchanges = this.state.exchanges.filter((e: ExchangeConnection) => e.id !== id);
    this.save();
  }

  // --- Telegram ---
  public async getTelegramConfig(): Promise<TelegramConfig> {
    return { ...DEFAULT_SETTINGS.telegram, ...this.state.telegram };
  }

  public async saveTelegramConfig(config: Partial<TelegramConfig>) {
    if (config.botToken && !config.botToken.startsWith('enc_')) {
      config.botToken = encrypt(config.botToken);
    }
    this.state.telegram = { ...this.state.telegram, ...config };
    this.save();
  }

  public async sendTestMessage(chatId: string, token: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 1000));
    if (!chatId.startsWith('@') && !/^\d+$/.test(chatId)) throw new Error("Invalid Chat ID");
    if (!token) throw new Error("Missing Bot Token");
    return true;
  }

  // --- Preferences ---
  public getPreferences(): UserPreferences {
    return { 
      ...DEFAULT_SETTINGS.preferences, 
      ...this.state.preferences,
      quietHours: { ...DEFAULT_SETTINGS.preferences.quietHours, ...(this.state.preferences?.quietHours || {}) },
      dataSource: { ...DEFAULT_SETTINGS.preferences.dataSource, ...(this.state.preferences?.dataSource || {}) }
    };
  }

  public async savePreferences(prefs: Partial<UserPreferences>) {
    this.state.preferences = { ...this.state.preferences, ...prefs };
    this.save();
  }
}

export const settingsService = new SettingsService();
